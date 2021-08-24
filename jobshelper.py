from crontab import CronTab
import pathlib
from utils import *

# Использование crontab
# cron.remove_all()
# for job in cron:
#     print(job)
	# cron.remove(job)
# job = cron.new(command='touch /home/horifox/SmartHomeApi/test_file_cron')
# job.minute.every(1)
# cron.write()

class CronManager():
	def __init__(self, api, plan_list, api_config, logger):
		self.logger = logger
		self.api_config = api_config
		self.api = api
		self.cron = CronTab(user=True)
		# Очистку нужно проводить до выключения сервера!
		self.cron.remove_all()
		self.cron.write()
		# При первом запуске подгружаем все задания в очередь
		self.load_plan(plan_list)

	def load_plan(self, plan_list):
		if len(plan_list) != 0:
			for elem in plan_list:
				self.create_plan(str(elem['PlanId']), elem['PlanDays'],
									elem['PlanTime'], 'relay', elem['ModuleIp'])
		eprint('Список заданий в cron:')
		for job in self.cron:
			eprint(job)
		eprint('\n')

	def create_plan(self, plan_id, plan_days, plan_time, module_type, module_ip):
		# Чтобы избежать дублирование - чистим
		self.delete_plan(plan_id)

		print('[!]Load plan:\n')
		print('[P]Id:', plan_id, '\n' +
				'[P]Days:',  plan_days, '\n' +
				'[P]Time:', plan_time, '\n' +
				'[P]Type module:', module_type, '\n' +
				'[P]Module ip', module_ip, '\n')

		week_list = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
		# Переводим указанные дни недели в числа 0-6
		day_of_week = ','.join([str(week_list.index(plan_day))
								for plan_day in plan_days.split(' ')])
		time_all = plan_time.split(' ')
		hour_start, minute_start = time_all[0].split(':')

		#Стартовое время
		id_job_start = plan_id + 'start'
		job = self.cron.new(comment=id_job_start,
							command='python3 %s/jobworker.py %s %s %s %s' % 
													(pathlib.Path(__file__).parent.absolute(),
													self.api_config['dacrover_port'],
													module_type,
													module_ip,
													1))
		job.setall(minute_start, hour_start, None, None, day_of_week)

		# Если есть конечное время
		if len(time_all) == 2:
			hour_end, minute_end = time_all[1].split(':')
			id_job_end = plan_id + 'end'
			job = self.cron.new(comment=id_job_end,
								command='python3 %s/jobworker.py %s %s %s %s' % 
														(pathlib.Path(__file__).parent.absolute(),
														self.api_config['dacrover_port'],
														module_type,
														module_ip,
														0))
			job.setall(minute_end, hour_end, None, None, day_of_week)

		self.cron.write()


	def delete_plan(self, id_jobs):
		id_job_start = id_jobs + 'start'
		id_job_end = id_jobs + 'end'
		self.cron.remove_all(comment=id_job_start)
		self.cron.remove_all(comment=id_job_end)
		self.cron.write()

	def on_exit(self):
		pass
		# self.scheduler.shutdown()
		# self.logger.info('SERVER: Scheduler shutdown')

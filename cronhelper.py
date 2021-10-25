# -*- coding: utf-8 -*-

from crontab import CronTab
from threading import Thread
from time import sleep
from mysqlhelper import DBConnection
import pathlib
import atexit


# Timeout auto-update plans on leader node if necessary
UPDATE_PLANS_TIMEOUT = 20


class CronThread():

	submodule_line = '> Cron-submodule: '
	update_timeout = 20
	leader_flag = False
	plans_list = []

	def __init__(self, api, api_config, logger):
		self.logger = logger
		self.api_config = api_config
		self.api = api
		self.cron = CronTab(user=True)


	def connect_db(self):
		link_bd = DBConnection(self.logger, user=self.api_config['user_mysql'],
								password=self.api_config['password_mysql'],
								host=self.api_config['host_mysql'],
								port=self.api_config['port_mysql'],
								database=self.api_config['database_mysql'])
		return link_bd


	def cron_loop(self):
		self.logger.debug('%sStart cron thread' % self.submodule_line)
		self.leader_flag = True
		link_bd = self.connect_db()
		self.plans_list = link_bd.select('plans', json=True)
		self.cron.remove_all()
		self.cron.write()
		self.load_plan(self.plans_list)
		atexit.register(self.on_exit)
		sleep(UPDATE_PLANS_TIMEOUT)

		while self._thread_loop:
			self.new_plans_list = link_bd.select('plans', json=True)
			if self.plans_list != self.new_plans_list:
				self.logger.debug('%sSince the plan data has changed - update cron plans' % self.submodule_line)
				self.plans_list = self.new_plans_list
				self.cron.remove_all()
				self.cron.write()
				self.load_plan(self.plans_list)
			sleep(UPDATE_PLANS_TIMEOUT)


	def load_plan(self, plan_list):
		if not self.leader_flag:
			return

		if len(plan_list) != 0:
			for elem in plan_list:
				self.create_plan(str(elem['PlanId']), elem['PlanDays'],
									elem['PlanTime'], 'relay', elem['ModuleIp'])
		self.logger.info('%sList of jobs in cron:' % self.submodule_line)
		for job in self.cron:
			self.logger.info(job)
		self.logger.info('\n')


	def create_plan(self, plan_id, plan_days, plan_time, module_type, module_ip):
		if not self.leader_flag:
			return

		# Clear plans to avoid duplication
		self.delete_plan(plan_id)

		self.logger.info('[!]Load plan:\n')
		self.logger.info('[P]Id: %s\n[P]Days: %s\n[P]Time: %s\n[P]Type module: %s\n[P]Module ip %s\n' 
								% (plan_id, plan_days, plan_time.replace(' ', '-'), module_type, module_ip))

		week_list = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
		# Convert days to number 0-6
		day_of_week = ','.join([str(week_list.index(plan_day))
								for plan_day in plan_days.split(' ')])
		time_all = plan_time.split(' ')
		hour_start, minute_start = time_all[0].split(':')

		# Start time
		id_job_start = plan_id + 'start'
		job = self.cron.new(comment=id_job_start,
							command='python3 %s/cronworker.py %s %s %s %s %s' % 
													(pathlib.Path(__file__).parent.absolute(),
													self.api_config['dacrover_host'],
													self.api_config['dacrover_port'],
													module_type,
													module_ip,
													1))
		job.setall(minute_start, hour_start, None, None, day_of_week)

		# if exist finish time - set it
		if len(time_all) == 2:
			hour_end, minute_end = time_all[1].split(':')
			id_job_end = plan_id + 'end'
			job = self.cron.new(comment=id_job_end,
								command='python3 %s/cronworker.py %s %s %s %s %s' % 
														(pathlib.Path(__file__).parent.absolute(),
														self.api_config['dacrover_host'],
														self.api_config['dacrover_port'],
														module_type,
														module_ip,
														0))
			job.setall(minute_end, hour_end, None, None, day_of_week)

		self.cron.write()


	def delete_plan(self, id_jobs):
		if not self.leader_flag:
			return

		id_job_start = id_jobs + 'start'
		id_job_end = id_jobs + 'end'
		self.cron.remove_all(comment=id_job_start)
		self.cron.remove_all(comment=id_job_end)
		self.cron.write()


	def run(self):
		self._thread_loop = True
		thread = Thread(target=self.cron_loop)
		thread.setDaemon(True)
		thread.start()


	def stop(self):
		self._thread_loop = False
		#self.led_thread.join()

	
	def on_exit(self):
		self.logger.info('%sExit handler check stop service' % self.submodule_line)
		if hasattr(self, 'cron') and self.cron:
			self.cron.remove_all()
		self.logger.info('%sFinish exit operation crontab' % self.submodule_line)

import os
import time
from threading import Thread
import consulate

# Ключевое слово успешной health проверки
GOOD_HEALTH_CHECK = 'passing'
# Время, на которое сессия блокируется на дергание
SESSION_LOCK_DELAY = "15s"
# Время протухания сессии
SESSION_TTL = "30s"

class ConsulThread:

	leader_key = "master-pointer"
	current_leader_name = None
	submodule_line = '> Consul-submodule: '
	additional_line = None
	on_change_leader_callback = []


	def __init__(self, api_config, logger):
		self.api_config = api_config
		self.logger = logger

		self.service_host = self.api_config['dacrover_host']
		self.service_port = self.api_config['dacrover_port']
		self.service_name = self.api_config['consul_service_name']
		self.service_id = self.api_config['consul_service_id']
		self.process_id = '%s-%s' % (self.service_name, os.getpid())
		self.tags = self.api_config['consul_tags']
		self.check_interval = self.api_config['consul_interval']
		self.check_tpl = self.api_config['consul_httpcheck']

		self.consul = consulate.Consul(
			host=self.api_config['consul_host'],
			port=self.api_config['consul_port'],
		)


	def set_on_change_leader_callback(self, callback):
		self.on_change_leader_callback.append(callback)


	def on_change_leader(self):
		self.logger.debug('%s[%s] [%s] Current master: %s' 
								%  (self.submodule_line, 
									self.consul_leader_name,
									self.leader_str(), 
									self.current_leader_name))
		if self.consul_leader_name == self.current_leader_name:
			self.logger.debug('%s[%s] [%s] Start leader event list' 
											%  (self.submodule_line, 
												self.consul_leader_name, 
												self.leader_str()))
			for callback in self.on_change_leader_callback:
				callback()


	def leader_str(self):
		return "MASTER" if self.current_leader_name == self.consul_leader_name else "NOT MASTER"

	
	def register_service(self):
		try:
			self.consul.agent.service.register(
				name=self.service_name,
				service_id=self.service_id,
				address=self.service_host,
				port=self.service_port,
				tags=self.tags,
				interval=self.check_interval,
				httpcheck=self.check_tpl.format(self.service_host, self.service_port)
			)
		except Exception as err:
			self.logger.error('Failed to register consul service: %s' % err)


	def consul_loop(self):
		self.logger.debug('%sStart consul thread' % self.submodule_line)
		try:
			service_http_check = 'service:%s' % self.service_id

			# Try to get check status from consul
			attempt = 1
			limit = 3
			health_checks = self.consul.health.service(self.service_name)
			status = self.get_status_by_checks(health_checks, service_http_check)
			# If status not passing - waiting
			while status != GOOD_HEALTH_CHECK and attempt < limit:
				self.logger.debug('%sStatus verification procedures: %s' % (self.submodule_line, status))
				attempt += 1
				self.logger.debug('%sWaiting for good health-check...' % self.submodule_line)
				time.sleep(int(self.check_interval[:-1]) // 2)
				health_checks = self.consul.health.service(self.service_name)
				status = self.get_status_by_checks(health_checks, service_http_check)

			# Consul can not get our status
			if status != GOOD_HEALTH_CHECK:
				self.logger.error('%sFailed to get good health-check' % self.submodule_line)

			# Если всё создали и прошли проверки health, то создаём сессию
			self.session_id = self.consul.session.create(
				behavior='release',
				node=None,
				delay=SESSION_LOCK_DELAY,
				ttl=SESSION_TTL,
				checks=['serfHealth', service_http_check]
			)
		except Exception as err:
		 	self.logger.error('%sFailed: %s' %  (self.submodule_line, err))

		# Строка идентификатор приложения и его потоков
		self.consul_leader_name = '%s@%s@%s' % (self.service_host, self.service_name, self.process_id)

		while self._thread_loop:
			try:
				# Попытка захватить лидерство, если занято, то вернёт False
				if self.consul.kv.acquire_lock(self.leader_key, self.session_id):
					# Прописываем нового лидера
					self.new_leader_name = self.consul_leader_name
					self.consul.kv[self.leader_key] = self.consul_leader_name
				else:
					# Иначе получаем текущего лидера
					self.new_leader_name = self.consul.kv.get(self.leader_key, None)

				# Обрабатываем изменение лидера
				if self.current_leader_name != self.new_leader_name:
					self.current_leader_name = self.new_leader_name
					self.on_change_leader()
			except Exception as err:
				self.logger.error('Failed to get leader name:', err)
			
			# self.logger.debug('%s[%s] [%s] [master: %s]' 
			# 								% (self.submodule_line, 
			# 								self.consul_leader_name, 
			# 								self.leader_str(), 
			# 								self.current_leader_name))
			time.sleep(int(SESSION_TTL[:-1]) // 2)

			try:
				# Renew session before TTL + LockDelay
				self.consul.session.renew(self.session_id)
			except Exception as err:
				self.logger.error('Failed to renew session:', err)


	def get_status_by_checks(self, health_checks, check_id):
		''' Just parsing consul response ... '''
		for node in health_checks:
			for check in node['Checks']:
				if check['CheckID'] == check_id:
					return check['Status']
		return 'unknown'


	def run(self):
		self._thread_loop = True
		self.register_service()
		thread = Thread(target=self.consul_loop)
		thread.setDaemon(True)
		thread.start()

	def stop(self):
		self._thread_loop = False
		#self.led_thread.join()
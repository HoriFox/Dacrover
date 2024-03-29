# -*- coding: utf-8 -*-

from flask import render_template, request, jsonify
import json
import requests
from mysqlhelper import DBConnection
from cronhelper import CronThread
from utils import *

class Api():
	def __init__(self, config, logger, consul_thread):
		self.api_config = config
		self.logger = logger
		self.consul = consul_thread.consul
		# Get data plans and start plans manager 
		self.cron_thread = CronThread(self, self.api_config, self.logger) if config['enable_cron'] else None
		# Set cron callback new master up
		consul_thread.set_on_change_leader_callback(self.cron_service_run)


	def cron_service_run(self):
		if self.cron_thread:
			self.cron_thread.run()


	def connect_db(self):
		link_bd = DBConnection(self.logger, user=self.api_config['user_mysql'],
								password=self.api_config['password_mysql'],
								host=self.api_config['host_mysql'],
								port=self.api_config['port_mysql'],
								database=self.api_config['database_mysql'])
		return link_bd


	def healthcheck(self):
		"""
		ROUTE 0
		Проведение самодиагностики 2хх - все хорошо, 5xx - что-то сломалось
		"""
		ok_mark = 'OK'
		failed_mark = 'FAILED'
		service_name = self.api_config['consul_service_name']

		db_connection_status = failed_mark
		sensors_status = failed_mark
		consul_status = failed_mark

		# Check db connection
		link_bd = self.connect_db()
		if link_bd.is_connection_open():
			db_connection_status = ok_mark

		# Check sensors
		sensors_status = ok_mark
		data = self.run_api(_request = {'type': 'sensor', 'ip': '%s:%s' 
		% (self.api_config['dacrover_host'], self.api_config['dacrover_port'])}, selfcheck = True)
		if int(json.loads(data[1:-1])['temperature']) == 20:
			sensors_status = ok_mark	

		# Check consul
		try:
			service = self.consul.catalog.service(service_name)
			if len(service) > 0:
				consul_status = ok_mark
		except Exception as err:
			self.logger.error('Failed to get consul members: {}'.format(err))
		
		health_status = {
			'db_connection': db_connection_status,
			'sensors': sensors_status,
			'consul': consul_status,
		}

		status_code = 200 if all(module == ok_mark for module in health_status.values()) else 500
		return jsonify({'health': health_status}), status_code


	def sensor_emulator(self):
		"""
		ROUTE 1
		Эмулятор ответов сенсора
		"""
		return jsonify({"temperature": "20",
						 "temperature_err_mody": "0",
						 "humidity": "20",
						 "humidity_err_mody": "0",
						 "pir_artive": "0",
						 "callback": "null",
						 "flashChipSize": "1048576",
						 "real": "1048576"})


	def run_api(self, _request = None, selfcheck = False):
		"""
		ROUTE 2
		Запуск методы API, а именно выполнение действий над устройствами
		"""
		self.logger.info('NEW API REQUEST -->')
		request_data = _request if (_request != None) else request.json
		module_type = request_data['type']
		if module_type == 'relay':
			# if ip = None --> find ip
			if 'ip' not in request_data:
				link_bd = self.connect_db()
				relay_name = request_data['name']
				ip_json = link_bd.select('modules', where="`ModuleName` LIKE '%" + relay_name + "%'", json=True)
				if len(ip_json) == 0:
					ip_json = link_bd.select('modules', where="`ModuleName` LIKE '%" + relay_name[:-1] + "%'", json=True)
				# No unique device --> return
				if len(ip_json) != 1: 
					return 'didnt-find-unique-device' 
				ip_dev = ip_json[0]['ModuleIp']
				self.logger.debug('LOGIC: Полученное по токену [%s] IP устройства [%s]' % (relay_name, ip_dev))
			else:
				ip_dev = request_data['ip']
			value_relay = request_data['value']
			self.logger.info('--> [IP(%s) SWITCH] try set value = %s' % (ip_dev, value_relay))
			try:
				to = self.api_config['sensor_request_timeout']
				requests.get('http://%s/relay?value=%s' % (ip_dev, value_relay), timeout=to)
			except requests.exceptions.ConnectionError as err:
				self.logger.warning('[!] [IP(%s) SWITCH] warning: error-connection-ip: %s' % (ip_dev, err))
				return 'error-connection-ip'
			except requests.exceptions.ReadTimeout as err:
				self.logger.warning('[!] [IP(%s) SWITCH] warning: read-timeout (error-connection-ip): %s' % (ip_dev, err))
				return 'error-connection-ip'
			else:
				self.logger.info('[+] [IP(%s) SWITCH] set value = %s' % (ip_dev, value_relay))
				return 'good'

		if module_type == 'sensor':
			ip_dev = request_data['ip']
			self.logger.info('--> [IP(%s) SENSOR] try get value' % (ip_dev))
			try:
				to = self.api_config['sensor_request_timeout']
				url_sensor = 'http://%s/info' % ip_dev if not selfcheck else 'http://%s/sensor_emulator' % ip_dev
				responce = requests.get(url_sensor, timeout=to)
				return '[%s]' % responce.text
			except requests.exceptions.ConnectionError as err:
				self.logger.warning('[!] [IP(%s) SENSOR] warning: error-connection-ip: %s' % (ip_dev, err))
				return 'error-connection-ip'
			except requests.exceptions.ReadTimeout as err:
				self.logger.warning('[!] [IP(%s) SENSOR] warning: read-timeout (error-connection-ip): %s' % (ip_dev, err))
				return 'error-connection-ip'


	def root(self):
		"""
		ROUTE 3
		Выдача по запросу страницы управления
		"""
		return render_template('index.html')


	def data_transfer_request(self):
		"""
		ROUTE 4
		Котейнер метода выдачи и редактирования данных.
		Данный метод является оболочкой _data_transfer т.к. тот содержит
		множество return с разными типами вывода. Здесь мы узнаём тип
		и отправляем соотвествующий ответ.
		"""
		self.logger.info('NEW API REQUEST -->')
		request_data = request.json
		self.logger.debug('Request data: ', request_data)
		data, isjson = self._data_transfer(request_data)
		return jsonify(data) if isjson else data


	def _data_transfer(self, request_data):
		"""
		В зависимости от название функции выбираем нужный тип работы с данными.
		return [данные],[is_json?]
		"""
		link_bd = self.connect_db()
		function = request_data['function']

		if function == 'get_list_module':
			modules_json = link_bd.select('modules', json=True)
			return modules_json, True

		if function == 'set_module':
			idModule = None if request_data['id'] == 'NULL' else request_data['id']
			query = link_bd.insert('modules', True, 'ChangeTime',
									ModuleId=idModule,
									ModuleName=request_data['name'],
									ModuleUser=request_data['user'],
									ModuleIp=request_data['ip'],
									ModuleType=request_data['type'],
					MapData=request_data['mapdata'])
			return query, False

		if function == 'delete_module':
			idModule = request_data['id']
			link_bd.delete('modules', '`ModuleId` = ' + idModule)
			return 'good', False

		if function == 'get_list_plan':
			plans_json = link_bd.select('plans', json=True)
			return plans_json, True

		if function == 'set_plan':
			id_plan = None if request_data['id'] == 'NULL' else request_data['id']
			query = link_bd.insert('plans', True, 'ChangeTime',
									PlanId=id_plan,
									PlanDisc=request_data['disc'],
									ModuleIp=request_data['ip'],
									PlanDays=request_data['days'],
									PlanTime=request_data['time'])
			if self.cron_thread:
				self.cron_thread.create_plan(str(id_plan), request_data['days'],
										request_data['time'], 'relay', request_data['ip'])
			return query, False

		if function == 'delete_plan':
			id_plan = request_data['id']
			link_bd.delete('plans', '`PlanId` = ' + id_plan)
			if self.cron_thread:
				self.cron_thread.delete_plan(str(id_plan))
			return 'good', False

		if function == 'get_list_reminder':
			reminders_json = link_bd.select('reminders', json=True)
			return reminders_json, True

		if function == 'set_reminder':
			id_reminder = None if request_data['id'] == 'NULL' else request_data['id']
			query = link_bd.insert('reminders', True, 'ChangeTime',
									ReminderId=id_reminder,
									ReminderUser=request_data['user'],
									ReminderDisc=request_data['disc'],
									ReminderList=request_data['list'])
			return query, False

		if function == 'delete_reminder':
			id_reminder = request_data['id']
			link_bd.delete('reminders', '`ReminderId` = ' + id_reminder)
			return 'good', False

		return 'function not found', False

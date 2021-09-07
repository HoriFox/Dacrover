from flask import render_template, request, jsonify
import json
import requests
from mysqlhelper import DBConnection
from jobshelper import CronManager
from utils import *

class Api():
	def __init__(self, config, logger):
		self.api_config = config
		self.logger = logger
		# Получаем данные по планам и запускаем менеджер работы с планами
		plan_list, _ = self.data_transfer({'function':'get_list_plan'})
		self.cron_manager = CronManager(self, plan_list, self.api_config, self.logger)

	def run_api(self, _request = None):
		"""
		ROUTE 1
		Запуск методы API, а именно выполнение действий над устройствами
		"""
		self.logger.info('NEW API REQUEST -->')
		request_data = _request if (_request != None) else request.json
		module_type = request_data['type']
		if module_type == 'relay':
			# Если нам не передают ip, значит будем его определять
			if 'ip' not in request_data:
				link_bd = DBConnection(user=self.api_config['user_mysql'],
									password=self.api_config['password_mysql'],
									host=self.api_config['host_mysql'],
									port=self.api_config['port_mysql'],
									database=self.api_config['database_mysql'])
				relay_name = request_data['name']
				ip_json = link_bd.select('modules', where="`ModuleName` LIKE '%" + relay_name + "%'", json=True)
				if len(ip_json) == 0:
					ip_json = link_bd.select('modules', where="`ModuleName` LIKE '%" + relay_name[:-1] + "%'", json=True)
				# Если нет уникального найденного устройства, то сбрасываем
				if len(ip_json) != 1: 
					return 'didnt-find-unique-device' 
				ip_dev = ip_json[0]['ModuleIp']
				self.logger.debug('LOGIC: Полученное по токену [%s] IP устройства [%s]' % (relay_name, ip_dev))
			else:
				ip_dev = request_data['ip']
			value_relay = request_data['value']
			self.logger.info('--> [IP(%s) SWITCH] try set value = %s' % (ip_dev, value_relay))
			try:
				requests.get('http://%s/relay?value=%s' % (ip_dev, value_relay))
			except requests.exceptions.ConnectionError:
				self.logger.warning('[!] [IP(%s) SWITCH] warning: error-connection-ip' % (ip_dev))
				return 'error-connection-ip'
			else:
				self.logger.info('[+] [IP(%s) SWITCH] set value = %s' % (ip_dev, value_relay))
				return 'good'

		if module_type == 'sensor':
			ip_dev = request_data['ip']
			self.logger.info('--> [IP(%s) SENSOR] try get value' % (ip_dev))
			try:
				responce = requests.get('http://%s/info' % ip_dev)
				return '[%s]' % responce.text
			except requests.exceptions.ConnectionError:
				self.logger.warning('[!] [IP(%s) SWITCH] warning: error-connection-ip' % (ip_dev))
				return 'error-connection-ip'

	def root(self):
		"""
		ROUTE 2
		Выдача по запросу страницы управления
		"""
		return render_template('index.html')

	def data_transfer_request(self):
		"""
		ROUTE 3
		Котейнер метода выдачи и редактирования данных.
		Данный метод является оболочкой data_transfer т.к. тот содержит
		множество return с разными типами вывода. Здесь мы узнаём тип
		и отправляем соотвествующий ответ.
		"""
		self.logger.info('NEW API REQUEST -->')
		request_data = request.json
		self.logger.debug('Request data: ', request_data)
		data, isjson = self.data_transfer(request_data)
		return jsonify(data) if isjson else data

	def data_transfer(self, request_data):
		"""
		В зависимости от название функции выбираем нужный тип работы с данными.
		return [данные],[is_json?]
		"""
		link_bd = DBConnection(user=self.api_config['user_mysql'],
								password=self.api_config['password_mysql'],
								host=self.api_config['host_mysql'],
								port=self.api_config['port_mysql'],
								database=self.api_config['database_mysql'])
		function = request_data['function']

		if function == 'get_list_module':
			modules_json = link_bd.select('modules', json=True)
			return modules_json, True

		if function == 'set_module':
			idModule = None if request_data['id'] == 'NULL' else request_data['id']
			query = link_bd.insert('modules', True, 'ChangeTime',
									ModuleId=idModule,
									ModuleName=request_data['name'],
									Room=request_data['room'],
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
			self.cron_manager.create_plan(str(id_plan), request_data['days'],
										request_data['time'], 'relay', request_data['ip'])
			return query, False

		if function == 'delete_plan':
			id_plan = request_data['id']
			link_bd.delete('plans', '`PlanId` = ' + id_plan)
			self.cron_manager.delete_plan(str(id_plan))
			return 'good', False

		return 'function not found', False

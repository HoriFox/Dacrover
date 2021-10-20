# -*- coding: utf-8 -*-

from flask import Flask
import logging
import sys
import consulate
from utils import *
from flask.logging import default_handler
from treatment import Api

class FlaskServer (Flask):
	def __init__(self, import_name, config_file):
		super(FlaskServer, self).__init__(import_name)
		self.api_config = self.load_config(config_file)
		self.handler = logging.StreamHandler(sys.stderr)
		self.logger.removeHandler(default_handler)
		self.logger.addHandler(self.handler)
		self.logger.setLevel(logging.DEBUG)
		self.consul = consulate.Consul(
			host=self.api_config['consul_host'],
			port=self.api_config['consul_port'],
		)
		self.api = Api(self.api_config, self.logger, self.consul)


	def load_config(self, path):
		config = {
			"user_mysql": "dacroveruser",
			"password_mysql": "password",
			"host_mysql": "127.0.0.1",
			"port_mysql": 3306,
			"database_mysql": "dacrover",
			"dacrover_host": "127.0.0.1", # NOT a binding address
			"dacrover_port": 4050,
			"enable_cron": True,
			"sensor_request_timeout": 3,
			"consul_host": "127.0.0.1",
			"consul_port": "8500",
			"consul_interval": "30s",
			"consul_service_name": "dacrover",
			"consul_service_id": "dacrover-0",
			"consul_tags": ["omega", "dacrover"],
			"consul_httpcheck": "http://{}:{}/healthcheck"
		}
		load_status = True
		try:
			with open(path) as file:
				data = load_json(path)
				config.update(data)
		except Exception as err:
			self.logger.info('\n[!]Cant load config from %s: %s' % (path, err))
			self.logger.info('[!]Load default config\n')
			load_status = False
		if load_status:
			self.logger.info('\n[!]Load config from %s\n' % path)
		self.show_load_log('config', config)
		self.logger.info('')
		return config


	def show_load_log(self, name, config):
		"""
		Вывод списка загруженных конфигураций.
		Password выводится после предварительного hash()
		"""
		for key in config:
			value = hash(config[key]) if ('password' in key) else config[key]
			self.logger.info('[C]%s = %s' % (key, value))


	def setup_route(self):
		self.add_url_rule('/healthcheck', "healthcheck", self.api.healthcheck, methods=['GET'])
		self.add_url_rule('/', "run_api", self.api.run_api, methods=['POST'])
		self.add_url_rule('/', "root", self.api.root, methods=['GET'])
		self.add_url_rule('/data', "data_transfer_request", self.api.data_transfer_request, methods=['POST'])


	def register_service(self):
		host = self.api_config['dacrover_host']
		port = self.api_config['dacrover_port']
		check_tpl = self.api_config['consul_httpcheck']
		try:
			self.consul.agent.service.register(
				name=self.api_config['consul_service_name'],
				service_id=self.api_config['consul_service_id'],
				address=host,
				port=port,
				tags=self.api_config['consul_tags'],
				interval=self.api_config['consul_interval'],
				httpcheck=check_tpl.format(host, port)
			)
		except Exception as err:
			self.logger.error('Failed to register consul service: {}'.format(err))


def create_app(config_file):
	app = FlaskServer('FlaskServer', config_file)
	app.setup_route()
	app.register_service()
	return app

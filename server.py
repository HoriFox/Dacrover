from flask import Flask
import logging
import sys
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
		self.api = Api(self.api_config, self.logger)

	def load_config(self, path):
		config = {
			"user_mysql": "smarthomeuser",
			"password_mysql": "password",
			"host_mysql": "127.0.0.1",
			"port_mysql": 3306,
			"database_mysql": "smarthome",
			"smarthome_port": 4050,
		}
		load_status = True
		try:
			with open(path) as file:
				data = load_json(path)
				config.update(data)
		except Exception as err:
			eprint('\n[!]Cant load config from %s: %s' % (path, err))
			eprint('[!]Load default config\n')
			load_status = False
		if load_status:
			eprint('\n[!]Load config from %s\n' % path)
		self.show_load_log('config', config)
		eprint('')
		return config

	def show_load_log(self, name, config):
		"""
		Вывод списка загруженных конфигураций.
		Password выводится после предварительного hash()
		"""
		for key in config:
			value = hash(config[key]) if ('password' in key) else config[key]
			eprint('[C]%s = %s' % (key, value))

	def setup_route(self):
		self.add_url_rule('/', "run_api", self.api.run_api, methods=['POST'])
		self.add_url_rule('/', "root", self.api.root, methods=['GET'])
		self.add_url_rule('/data', "data_transfer_request", self.api.data_transfer_request, methods=['POST'])


def create_app(config_file):
	app = FlaskServer('FlaskServer', config_file)
	app.setup_route()
	return app

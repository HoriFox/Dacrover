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
        if not path:
            path='/etc/assol/api.config.json'
        return load_json(path)

    def setup_route(self):
        self.add_url_rule('/', "run_api", self.api.run_api, methods=['POST'])
        self.add_url_rule('/', "root", self.api.root, methods=['GET'])
        self.add_url_rule('/data', "data_transfer_request", self.api.data_transfer_request, methods=['POST'])

def create_app(config_file):
    app = FlaskServer('FlaskServer', config_file)
    app.setup_route()
    return app

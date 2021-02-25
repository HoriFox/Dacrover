import sys
import argparse
from server import create_app

parser = argparse.ArgumentParser(description='Smarthome server executor')
parser.add_argument('-c', '--config', type=str,
			default='/etc/assol/api.config.json',
			help='Config file for Smarthome server')
args = parser.parse_args()

app = create_app(args.config)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=4050)

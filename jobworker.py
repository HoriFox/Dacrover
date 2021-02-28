import sys
import requests

if __name__ == '__main__':
    requests.post('http://localhost:'+sys.argv[1], json={'type': sys.argv[2], 'ip': sys.argv[3], 'value': sys.argv[4]})
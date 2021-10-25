import sys
import requests

if __name__ == '__main__':
    requests.post('http://%s:%s' % (sys.argv[1], sys.argv[2]), json={'type': sys.argv[3], 'ip': sys.argv[4], 'value': sys.argv[5]})
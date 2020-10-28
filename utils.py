import json
import sys

def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

def load_json(path):
    with open(path, 'r') as f:
        data = json.load(f)
    return data
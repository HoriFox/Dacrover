import sys
from server import create_app

config = sys.argv[1] if len(sys.argv) > 1 else None

app = create_app(config)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=4050)
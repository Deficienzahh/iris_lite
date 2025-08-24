from flask import Flask
from flask_cors import CORS
from flask_sock import Sock

# Import blueprint
from api.auth import auth_bp
from api.gps import gps_bp
from api.voice import voice_bp
from api.iris import iris_bp
from api.system import system_bp
from api.calendar import calendar_bp
from api.music import music_bp
from api.timers import timers_bp

# WebSocket manager
from api.ws_manager import ws_manager

import main

# --- App setup ---
app = Flask(__name__)
sock = Sock(app)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://tuo-username.pythonanywhere.com"
]

CORS(app, resources={r"/api/*": {"origins": CORS_ALLOWED_ORIGINS}})
# --- Registrazione blueprint ---
app.register_blueprint(auth_bp)
app.register_blueprint(gps_bp)
app.register_blueprint(voice_bp)
app.register_blueprint(iris_bp)
app.register_blueprint(system_bp)
app.register_blueprint(calendar_bp)
app.register_blueprint(music_bp)
app.register_blueprint(timers_bp)

# --- WebSocket endpoint ---
@sock.route("/ws")
def websocket(ws):
    ws_manager.add_connection(ws)
    try:
        while True:
            data = ws.receive()
            if data:
                print("📥 Ricevuto via WebSocket:", data)
                main.groq_for_websocket(data, ws)
            else:
                break
    finally:
        ws_manager.remove_connection(ws)

# --- Main ---
if __name__ == "__main__":
    print("🚀 Avvio del server Flask...")
    app.run(debug=True, host="127.0.0.1", port=5100)
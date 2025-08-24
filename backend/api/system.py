from flask import Blueprint, jsonify
import psutil
from utils.config_loader import get_config
from logic import audio_switch

system_bp = Blueprint("system", __name__, url_prefix="/api")

is_audio_on = get_config("audio", False)

@system_bp.route("/config")
def config():
    global is_audio_on
    return jsonify({
        "weatherApiKey": get_config("weather_api_key"),
        "audio": is_audio_on
    })

@system_bp.route("/system_stats")
def system_stats():
    ram = psutil.virtual_memory().percent
    cpu = psutil.cpu_percent(interval=1)
    return jsonify({"cpu": cpu, "ram": ram})

@system_bp.route("/audio/toggle", methods=["POST"])
def toggle_audio():
    global is_audio_on
    try:
        audio_switch()
        is_audio_on = not is_audio_on
        return jsonify({"success": True, "audio": is_audio_on})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@system_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "online"}), 200
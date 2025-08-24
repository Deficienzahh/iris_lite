from flask import Blueprint, jsonify, request
import time

timers_bp = Blueprint("timers", __name__, url_prefix="/api/timers")

timers = {}

@timers_bp.route("", methods=["POST"])
def create_timer():
    data = request.json
    name = data.get("name", f"timer_{len(timers)+1}")
    seconds = int(data.get("seconds", 60))
    end_time = time.time() + seconds
    timers[name] = {"end_time": end_time, "seconds": seconds}
    return jsonify({"message": f"Timer '{name}' avviato per {seconds} secondi."})

@timers_bp.route("", methods=["GET"])
def get_timers():
    now = time.time()
    active = {name: max(0, int(data["end_time"] - now)) for name, data in timers.items()}
    return jsonify(active)

@timers_bp.route("/<name>", methods=["DELETE"])
def delete_timer(name):
    if name in timers:
        del timers[name]
        return jsonify({"message": f"Timer '{name}' cancellato."})
    return jsonify({"message": f"Nessun timer chiamato '{name}'"}), 404
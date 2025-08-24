from flask import Blueprint, jsonify, request

gps_bp = Blueprint("gps", __name__, url_prefix="/api")

last_city = None
gps_city = None

@gps_bp.route("/set_city", methods=["POST"])
def set_city():
    global last_city
    data = request.json
    last_city = data.get("city")
    return jsonify({"status": "ok", "last_city": last_city})

@gps_bp.route("/last_city", methods=["GET"])
def get_last_city():
    return jsonify({"last_city": last_city})

@gps_bp.route("/gps_position", methods=["POST"])
def gps_position():
    global gps_city
    data = request.json
    gps_city = data.get("gps_city")
    return jsonify({"status": "ok", "gps_city": gps_city})

@gps_bp.route("/get_gps_position", methods=["GET"])
def get_gps_position():
    return jsonify({"gps_city": gps_city})
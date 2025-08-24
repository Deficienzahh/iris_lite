from flask import Blueprint, request, jsonify
from utils.config_loader import get_config

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

PASSWORD = get_config("password")

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    password = data.get("password", "")
    if password == PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Password errata"}), 401
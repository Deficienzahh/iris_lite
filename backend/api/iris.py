from flask import Blueprint, request, jsonify
import json
import main
from main import clear_chat_history
from api.ws_manager import ws_manager

iris_bp = Blueprint("iris", __name__, url_prefix="/api")

@iris_bp.route('/iris', methods=["POST"])
def iris():
    data = request.get_json()
    frase = data.get("frase", "")
    risposte = main.groq(frase)
    print("Risposte:", risposte)
    return jsonify({"risposta": risposte})

@iris_bp.route("/summary", methods=["POST"])
def receive_summary():
    try:
        data = request.get_json()
        summary = data.get("summary")
        if summary:
            print(f"Riassunto ricevuto su /api/summary: {summary[:100]}...")
            ws_manager.broadcast({
                "command": "show_summary",
                "content": summary
            })
            return jsonify({"success": True, "message": "Summary broadcasted."})
        else:
            return jsonify({"success": False, "message": "No summary provided."}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@iris_bp.route("/chat/clear", methods=["POST"])
def clear_chat():
    try:
        clear_chat_history()
        return jsonify({"success": True, "message": "Chat history cleared."})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
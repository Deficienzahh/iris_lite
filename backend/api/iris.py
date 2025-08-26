from flask import Blueprint, request, jsonify
import main
from main import clear_chat_history

iris_bp = Blueprint("iris", __name__, url_prefix="/api")

@iris_bp.route('/iris', methods=["POST"])
def iris():
    try:
        data = request.get_json(force=True)
        frase = data.get("frase", "")
        print(f"📥 Input ricevuto: {frase}")

        risposta, comando = main.groq_for_http(frase)
        print(f"🤖 Risposta: {risposta}, Comando: {comando}")

        return jsonify({
            "risposta": risposta,
            "comando": comando
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500
@iris_bp.route("/summary", methods=["POST"])
def receive_summary():
    try:
        data = request.get_json()
        summary = data.get("summary")
        if summary:
            print(f"Riassunto ricevuto su /api/summary: {summary[:100]}...")
            return jsonify({"success": True, "message": "Summary received."})
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
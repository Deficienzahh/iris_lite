# voice.py
from flask import Blueprint, jsonify
from state.voice_state import is_voice_listening, current_transcription, transcription_complete, lock
from utils.voice_listener import start_listener_thread
from vosk_recognition import stop_listening

voice_bp = Blueprint("voice_bp", __name__, url_prefix="/api/voice")

@voice_bp.route("/start-listening", methods=["POST"])
def start_listening():
    global is_voice_listening
    with lock:
        if is_voice_listening:
            return jsonify({"error": "Already listening"}), 400
        is_voice_listening = True

    start_listener_thread()
    return jsonify({"message": "Voice listening started"}), 200

@voice_bp.route("/stop-listening", methods=["POST"])
def stop_listening_route():
    global is_voice_listening
    with lock:
        is_voice_listening = False
    stop_listening()
    return jsonify({"message": "Voice listening stopped"}), 200

@voice_bp.route("/transcription", methods=["GET"])
def get_transcription():
    with lock:
        return jsonify({
            "transcription": current_transcription,
            "is_complete": transcription_complete,
            "is_listening": is_voice_listening
        }), 200

@voice_bp.route("/reset", methods=["POST"])
def reset_transcription():
    global current_transcription, transcription_complete
    with lock:
        current_transcription = ""
        transcription_complete = False
    return jsonify({"message": "Transcription reset"}), 200
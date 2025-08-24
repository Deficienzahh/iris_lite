from flask import Blueprint, jsonify
from utils.run_applescript import run_applescript
import subprocess

music_bp = Blueprint("music", __name__, url_prefix="/api/music")

@music_bp.route("/playpause", methods=["POST"])
def playpause():
    run_applescript('tell application "Spotify" to playpause')
    return {"success": True}

@music_bp.route("/next", methods=["POST"])
def next_track():
    run_applescript('tell application "Spotify" to next track')
    return {"success": True}

@music_bp.route("/prev", methods=["POST"])
def previous_track():
    run_applescript('tell application "Spotify" to previous track')
    return {"success": True}

@music_bp.route("/status", methods=["GET"])
def music_status():
    try:
        result = subprocess.run(
            ["osascript", "-e", 'tell application "Spotify" to return player state as string'],
            capture_output=True,
            text=True
        )
        is_playing = result.stdout.strip() == "playing"
        return jsonify({"isPlaying": is_playing, "success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

@music_bp.route("/current", methods=["GET"])
def current_track():
    try:
        track_script = '''
        tell application "Spotify"
            set trackName to name of current track
            set artistName to artist of current track
            set albumName to album of current track
            return trackName & "|" & artistName & "|" & albumName
        end tell
        '''
        result = subprocess.run(["osascript", "-e", track_script], capture_output=True, text=True)
        if result.stdout.strip():
            parts = result.stdout.strip().split("|")
            return jsonify({
                "name": parts[0] if len(parts) > 0 else "Unknown",
                "artist": parts[1] if len(parts) > 1 else "Unknown",
                "album": parts[2] if len(parts) > 2 else "Unknown",
                "success": True
            })
        else:
            return jsonify({"success": False, "error": "No track playing"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
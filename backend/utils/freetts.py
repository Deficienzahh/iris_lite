import subprocess
import json
import threading

def _speak_thread(text, voce, velocita):
    try:
        subprocess.run(["say", "-v", voce, "-r", str(velocita), text])
    except Exception as e:
        print(f"Errore durante la sintesi vocale: {e}")

def speak(text):
    voce = "Luca"
    velocita = "180"
    try:
        with open("config.json", "r") as f:
            config = json.load(f)
        if config.get("audio", False):
            threading.Thread(target=_speak_thread, args=(text, voce, velocita), daemon=True).start()
    except Exception as e:
        print(f"Errore nella configurazione della sintesi vocale: {e}")
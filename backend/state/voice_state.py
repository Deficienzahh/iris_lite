# voice_state.py
import threading

# Stato globale della voce
is_voice_listening = False
current_transcription = ""
transcription_complete = False
voice_thread = None
lock = threading.Lock()  # Per accesso thread-safe
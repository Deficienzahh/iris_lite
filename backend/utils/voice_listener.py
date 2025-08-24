# voice_listener.py
import threading
from vosk_recognition import input_utente_web
from state.voice_state import is_voice_listening, current_transcription, transcription_complete, lock
from api.ws_manager import ws_manager
import main
import time

def listen_and_send():
    """
    Thread per l'ascolto vocale e invio al WebSocket.
    """
    global is_voice_listening, current_transcription, transcription_complete

    print("🎤 Avvio ascolto vocale...")
    try:
        risultato = input_utente_web()
        with lock:
            if risultato:
                current_transcription = risultato
                transcription_complete = True
                is_voice_listening = False
                print(f"🗣️ Trascrizione completata: {risultato}")

                # Invia a tutti i WebSocket attivi
                for ws in ws_manager.connections:
                    try:
                        main.groq_for_websocket(risultato, ws)
                    except Exception as e:
                        print(f"❌ Errore invio frase a WS: {e}")
            else:
                print("🔇 Nessun comando riconosciuto o ascolto interrotto")
                is_voice_listening = False

    except Exception as e:
        print(f"❌ Errore ascolto vocale: {e}")
        with lock:
            is_voice_listening = False

def start_listener_thread():
    """Avvia il thread di ascolto in background"""
    global voice_thread
    voice_thread = threading.Thread(target=listen_and_send, daemon=True)
    voice_thread.start()
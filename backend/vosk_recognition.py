from playsound import playsound
import queue
import sounddevice as sd
from vosk import Model, KaldiRecognizer
import json
import os
import threading
import zipfile
import requests
from utils.config_loader import get_config

wakeword = get_config("wake_word")

def scarica_modello_vosk(url, destinazione_zip, cartella_estrazione):
    print("⬇️ Scaricamento del modello Vosk in corso...")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()

        with open(destinazione_zip, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        print("✅ Modello scaricato. Estrazione in corso...")
        with zipfile.ZipFile(destinazione_zip, 'r') as zip_ref:
            zip_ref.extractall(cartella_estrazione)

        os.remove(destinazione_zip)
        print("✅ Estrazione completata.")
    except Exception as e:
        print(f"❌ Errore durante il download o l'estrazione del modello: {e}")

# Percorsi
default_model_dir = os.path.join(os.path.dirname(__file__), 'vosk-model-it-small')
config_model_path = get_config("vosk_model_path")
model_path = config_model_path or default_model_dir

# Controlla se il modello esiste, altrimenti scarica
if not os.path.exists(model_path):
    print("⚠️ Modello Vosk non trovato. Inizio download...")
    modello_url = get_config("vosk_model_url")  # Inserisci nel config.json
    zip_path = os.path.join(os.path.dirname(__file__), "vosk_model.zip")
    scarica_modello_vosk(modello_url, zip_path, os.path.dirname(model_path))

model = Model(model_path)
recognizer = KaldiRecognizer(model, 16000)
q = queue.Queue()

listening_active = True

def callback(indata, frames, time, status):
    if listening_active:
        q.put(bytes(indata))

def input_utente():
    global listening_active
    listening_active = True
    
    with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype='int16',
                        channels=1, callback=callback):
        while listening_active:
            try:
                data = q.get(timeout=1)
                if recognizer.AcceptWaveform(data):
                    risultato = json.loads(recognizer.Result())
                    testo = risultato.get("text", "").strip().lower()

                    if not testo:
                        continue

                    print("🗣️ Hai detto:", testo)

                    if wakeword in testo:
                        comando = testo.replace(wakeword, "", 1).strip()
                        if comando:
                            return comando
            except queue.Empty:
                continue
            except Exception as e:
                print(f"❌ Errore nell'ascolto: {e}")
                break
    
    return None

def input_utente_web():
    global listening_active
    listening_active = True
    
    print("🎤 Avvio ascolto per interfaccia web...")
    try:
        threading.Thread(target=playsound, args=("../sound/lightson.wav",), daemon=True).start()
    except:
        pass
    
    with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype='int16',
                        channels=1, callback=callback):
        
        timeout_counter = 0
        max_timeout = 30
        
        while listening_active and timeout_counter < max_timeout:
            try:
                data = q.get(timeout=1)
                if recognizer.AcceptWaveform(data):
                    risultato = json.loads(recognizer.Result())
                    testo = risultato.get("text", "").strip().lower()

                    if not testo:
                        continue

                    print("🗣️ Riconosciuto:", testo)

                    if len(testo) > 2:
                        return testo
            except queue.Empty:
                timeout_counter += 1
                continue
            except Exception as e:
                print(f"❌ Errore nell'ascolto web: {e}")
                break
    
    print("⏰ Timeout dell'ascolto o ascolto fermato")
    return None

def stop_listening():
    global listening_active
    listening_active = False
    print("⏸️ Ascolto fermato dall'esterno")

def is_listening():
    return listening_active

def input_check():
    return input_utente()
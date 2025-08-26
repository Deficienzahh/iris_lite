import os
import requests
import zipfile

MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-it-0.22.zip"
MODEL_DIR = "models/vosk-model-small-it-0.22"

def setup_vosk_model():
    if not os.path.exists(MODEL_DIR):
        print("📥 Scarico il modello Vosk...")
        os.makedirs("models", exist_ok=True)
        zip_path = "models/model.zip"

        # Scarica file
        r = requests.get(MODEL_URL, stream=True)
        with open(zip_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

        # Estrai
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall("models")

        os.remove(zip_path)
        print("✅ Modello Vosk pronto!")
    else:
        print("ℹ️ Modello Vosk già presente.")
from vosk_recognition import input_utente
import json


def input_check():
    with open("config.json","r") as f: 
        config = json.load(f)
    if config.get("mic", False):
        messaggio = input_utente()
        return messaggio
    else:
        messaggio = input("🗣️ TU: ")
        return messaggio
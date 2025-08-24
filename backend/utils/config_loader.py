import os
import json

# Percorso corretto: dalla cartella utils sali in backend e prendi config.json
config_path = os.path.join(os.path.dirname(__file__), '..', 'config.json')
config_path = os.path.abspath(config_path)  # normalizza il percorso

if os.path.exists(config_path):
    with open(config_path) as f:
        config_data = json.load(f)
else:
    config_data = {}

def get_config(key: str, default=None):
    """
    Restituisce la variabile d'ambiente `key`, altrimenti la prende da config.json,
    altrimenti restituisce `default` se non trovata.
    """
    return os.getenv(key) or config_data.get(key, default)
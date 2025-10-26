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
    Restituisce la variabile d'ambiente (tentando prima KEY_MAIUSCOLO), 
    altrimenti la prende da config.json (tentando prima key_minuscola),
    altrimenti restituisce `default`.
    
    Priority: ENV (MAIUSC) -> JSON (minuscolo) -> Default
    """
    
    # 1. Tenta di leggere la variabile d'ambiente in MAIUSCOLO (convenzione cloud)
    key_maiusc = key.upper()
    env_value = os.getenv(key_maiusc)
    if env_value is not None:
        return env_value
    
    # 2. Tenta di leggere dal file config.json in minuscolo (vecchia convenzione)
    key_minusc = key.lower()
    json_value = config_data.get(key_minusc)
    if json_value is not None:
        return json_value
        
    # 3. Restituisce il valore di default
    return default
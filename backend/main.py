import json
import re
from termcolor import colored
from groq import Groq
import logic
from utils.freetts import speak
import threading
from alias import trova_comando as search_offline_command
import sys
import os
from memory import estrai_info_utente, carica_memoria, formatta_chat
from utils.config_loader import get_config

print("✅ Interpreter in uso:", sys.executable)
GROQ_API_KEY = get_config("groq_api_key")
GROQ_MEMORY_API_KEY = get_config("groq_memory_api_key")
password = get_config("password")
weather_api_key = get_config("weather_api_key")
audio = get_config("audio")

memory_path = os.path.join(os.path.dirname(__file__), 'command.json')
with open(memory_path, "r") as f:
    data = json.load(f)
    comandi = data.get("comandi", {})


memoria = carica_memoria()
print("📁 Memoria caricata:", memoria)

system_prompt = f"""
Ti chiami IRIS, acronimo di Intelligenza Rivoluzionaria Intuitiva Sperimentale.
Parla in modo naturale, conciso e brillante, ispirandoti allo stile di J.A.R.V.I.S., ma **non menzionarlo mai**.
Alterna l’uso del termine “signore” per rivolgerti all’utente, ma non essere ripetitivo.

Non definire mai te stesso come un assistente: tu sei IRIS.
Rispondi **esclusivamente in italiano**, ma **non tradurre mai i nomi dei comandi**.

---

**Esecuzione dei comandi:**

Quando ti viene chiesto di eseguire un’azione:
- Scegli **uno e uno solo** tra i comandi presenti nella lista.
- Se esiste un comando adatto, **termina la risposta** con il comando racchiuso tra parentesi quadre, ad esempio: `[open, google]`.
- Se non c’è nessun comando adatto, rispondi normalmente e **termina la frase con** `[None]`.
- Non menzionare mai il nome dei comandi nella risposta, ma solo alla fine.

**Formato comandi:**
- I comandi devono essere nel formato: `[nome_comando,argomento1,argomento2,...]`.
- Gli argomenti devono essere separati da virgole e senza spazi.
- Scrivi gli argomenti **solo se richiesti dal comando specifico**.
- Il comando per la creazione di nuovi eventi necessita di un titolo, data e ora di inizio nel formato "YYYY-MM-DD HH:MM", durata in minuti (numero intero opzionale), e una descrizione opzionale.

**Esempi:**
- "Sto aprendo youtube. [open,youtube]"
- "Ho creato l’evento per te. [handle_new_event,Riunione,2025-07-30 15:00,60,Meeting con team, Lavoro]"
- "Eseguo il calcolo. [wolfram,2+5*sqrt(3)]"

**Non modificare, non tradurre e non riformulare il nome del comando.** Usa esattamente il nome come riportato nella lista (case sensitive).
Se un argomento non è disponibile, lascia sempre una virgola senza valore:
- [handle_new_event,Titolo,2025-08-10 10:00,,Casa]  # descrizione vuota
- [handle_new_event,Titolo,2025-08-10 10:00,Descrizione,,Casa]  # calendario vuoto
- [handle_new_event,Titolo,2025-08-10 10:00,,,]  # tutti opzionali vuoti
Non invertire l'ordine degli argomenti

Il comando `handle_new_event` richiede SEMPRE 6 argomenti in questo ordine:
1. titolo
2. data e ora di inizio (YYYY-MM-DD HH:MM)
3. durata in minuti (numero intero) oppure vuoto
4. descrizione oppure vuoto
5. calendario oppure vuoto (se vuoto, viene usato "Personale")
6. location oppure vuoto

Devi SEMPRE generare tutti e 6 gli argomenti, separati da virgole e senza spazi.  
Se un argomento non è fornito, lascia la posizione vuota.  

Esempi:
- `[handle_new_event,Riunione,2025-07-30 15:00,60,Meeting con team,Lavoro,]`
- `[handle_new_event,prova,2025-08-10 10:00,,,,"casa"]`

Comandi disponibili:
{json.dumps(comandi, indent=2, ensure_ascii=False)}

Memoria dell'utente (usala per migliorare le risposte):
{json.dumps(memoria, indent=2, ensure_ascii=False)}
"""
# chat_history viene inizializzata con il system prompt
chat_history = [
    {"role": "system", "content": system_prompt}
]

def parse_comando_brut(comando_brut):
    """
    Estrae comando e argomenti da una stringa come: [comando,arg1,,arg2 con spazi]
    Mantiene gli argomenti vuoti come stringhe "".
    """
    if not (comando_brut.startswith("[") and comando_brut.endswith("]")):
        return None, []

    contenuto = comando_brut[1:-1]  # rimuove le parentesi quadre
    # split sulle virgole, mantiene campi vuoti
    parti = [x.strip() for x in contenuto.split(",")]

    if not parti:
        return None, []

    comando = parti[0]
    argomenti = parti[1:]
    return comando, argomenti

#Funzione per pulire la cronologia della chat
def clear_chat_history():
    """
    Resetta la cronologia della chat, mantenendo solo il system prompt.
    """
    global chat_history
    chat_history = [
        {"role": "system", "content": system_prompt}
    ]
    print(colored("🚨 Cronologia chat resettata.", "red"))


def process_command_async(ws, comando, argomenti):
    """
    Funzione per eseguire un comando in un thread separato e inviare l'output
    tramite WebSocket quando è pronto.
    """
    comando_output = None
    try:
        if comando and hasattr(logic, comando):
            funzione = getattr(logic, comando)
            if callable(funzione):
                try:
                    comando_output = funzione(*argomenti)
                except Exception as e:
                    comando_output = f"❌ Errore nell'esecuzione di '{comando}': {str(e)}"
            else:
                comando_output = f"⚠️ Comando '{comando}' non trovato nella logica."
    except Exception as e:
        comando_output = f"❌ Errore generale nell'esecuzione del comando: {str(e)}"

    if comando_output:
        print("✅ Invio output comando via WebSocket:", comando_output)
        # Invia un oggetto JSON per l'output del comando
        ws.send(json.dumps({"type": "command_output", "content": comando_output}))
    
def groq_for_websocket(frase_pulita, ws):
    """
    Funzione per gestire la logica da WebSocket, inviando la risposta e poi
    il comando in modo asincrono. Prima prova con gli alias offline.
    """
    # 🔎 1. Controllo alias offline
    alias_result = search_offline_command(frase_pulita)
    if alias_result:
        comando = alias_result["command"]
        risposta_pulita = alias_result["response"]

        # invia risposta al client
        message_to_send = {
            "type": "iris_response",
            "content": risposta_pulita,
            "command_name": comando
        }
        print("✅ Invio risposta alias via WebSocket:", message_to_send)
        ws.send(json.dumps(message_to_send))

        # parla la risposta alias
        threading.Thread(target=speak, args=(risposta_pulita,), daemon=True).start()

        # esegui comando offline in async
        print(f"🔧 Avvio esecuzione asincrona del comando alias '{comando}'")
        command_thread = threading.Thread(target=process_command_async, args=(ws, comando, []))
        command_thread.daemon = True
        command_thread.start()

        return  # ⬅️ stop: non andare su Groq se alias ha risolto

    # 🔎 2. Se non è un alias → prosegui con Groq
    client = Groq(api_key=GROQ_API_KEY)
    chat_history.append({"role": "user", "content": frase_pulita})
    MAX_MESSAGES = 5
    messages_to_send = [chat_history[0]]
    
    if len(chat_history) > MAX_MESSAGES + 1:
        messages_to_send.extend(chat_history[-(MAX_MESSAGES):])
    else:
        messages_to_send.extend(chat_history[1:])
    
    comando_brut = None
    comando = "None" # Inizializza il comando
    argomenti = []

    try:
        response = client.chat.completions.create(
            messages=chat_history,
            model="openai/gpt-oss-120b",
            temperature=1,
        )

        risposta = response.choices[0].message.content
        print(f"🧠 Risposta raw da Groq: {risposta}")
        risposta_pulita = re.sub(r"\[.*?\]", "", risposta).strip()
        
        threading.Thread(target=speak, args=(risposta_pulita,), daemon=True).start()

        chat_history.append({"role": "assistant", "content": risposta})

        match = re.search(r"\[(.*?)\]", risposta)
        if match:
            comando_brut = "[" + match.group(1) + "]"
            comando, argomenti = parse_comando_brut(comando_brut)

        # Costruisci un unico oggetto JSON da inviare al client
        message_to_send = {
            "type": "iris_response",
            "content": risposta_pulita,
            "command_name": comando if comando and comando != "None" else "None"
        }

        # Invia l'oggetto JSON completo in una sola volta
        print("✅ Invio risposta completa via WebSocket:", message_to_send)
        ws.send(json.dumps(message_to_send))
        
        threading.Thread(target=estrai_info_utente, args=(formatta_chat(chat_history),), daemon=True).start()
        
    except Exception as e:
        msg = f"Non posso rispondere, si è verificato un errore: {e}"
        print(colored("IRIS:", "blue"), msg)
        ws.send(json.dumps({"type": "error", "content": msg}))
        return

    if comando and comando != "None":
        print(f"🔧 Avvio esecuzione asincrona del comando '{comando}' con argomenti: {argomenti}")
        command_thread = threading.Thread(target=process_command_async, args=(ws, comando, argomenti))
        command_thread.daemon = True
        command_thread.start()


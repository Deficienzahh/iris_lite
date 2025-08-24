import json
from groq import Groq
import os
from utils.config_loader import get_config

GROQ_API_KEY = get_config("groq_api_key")
GROQ_MEMORY_API_KEY = get_config("groq_memory_api_key")
if not GROQ_API_KEY:
    raise ValueError("❌ Errore: chiave 'groq_api_key' non trovata nel file config.json.")


def formatta_chat(chat_history):
    return "\n".join([f"{m['role']}: {m['content']}" for m in chat_history if m['role'] in ["user", "assistant"]])

def carica_memoria():
    if not os.path.exists("memory.json"):
        with open("memory.json", "w") as f:
            f.write("{}")  # Scrive un JSON vuoto valido
        return {}

    with open("memory.json", "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            print("⚠️ memory.json è vuoto o corrotto. Sovrascrivo.")
            with open("memory.json", "w") as fw:
                fw.write("{}")
            return {}
        
def salva_memoria(memoria):
    with open("memory.json", "w") as f:
        json.dump(memoria, f, indent=2, ensure_ascii=False)

def aggiorna_memoria(nuove_info):
    memoria = carica_memoria()

    modificato = False
    for chiave, valore in nuove_info.items():
        if chiave not in memoria or memoria[chiave] != valore:
            memoria[chiave] = valore
            modificato = True

    if modificato:
        with open("memory.json", "w") as f:
            json.dump(memoria, f, indent=2, ensure_ascii=False)

        print("✅ Memoria aggiornata:")
        print(json.dumps(memoria, indent=2, ensure_ascii=False))
    else:
        print("ℹ️  Nessun cambiamento nella memoria.")

    with open("memory.json", "w", encoding="utf-8") as f:
        json.dump(memoria, f, indent=2, ensure_ascii=False)

def estrai_info_utente(conversazione: str, memory_path="memory.json"):
    client = Groq(api_key=GROQ_MEMORY_API_KEY)
    messaggi = [
        {
            "role": "system",
            "content": (
                "Hai il compito di analizzare una conversazione tra un utente e un assistente."
                "Estrai tutte le informazioni importanti dall'input dell'utente che dovrebbero essere ricordate per future interazioni. Concentrati solo su dettagli personali, preferenze, piani e relazioni. "
                "Non includere informazioni generiche, non pertinenti o relative ai discorsi tra l'utente e l'assistente, il tuo compito è di salvare informazioni personali dell'utente."
                "Non fare supposizioni, usa solo le informazioni fornite nella conversazione."
                "Non ripetere informazioni già presenti nella memoria."
                "Restituisci SOLO un JSON strutturato valido con le informazioni. "
                "Esempio:\n"
                "{\n"
                "  \"nome\": \"Lorenzo\",\n"
                "  \"interessi\": [\"programmazione\", \"robotica\"],\n"
                "  \"progetti\": [\"assistente virtuale chiamato IRIS\"]\n"
                "}"

                "Questa è la memoria acquisita fino ad ora, tienila in conto per non inserire informazioni piu volte:\n"
                f"{carica_memoria()}"

            )
        },
        {
            "role": "user",
            "content": conversazione
        }
    ]

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # o il modello corretto che usi
            messages=messaggi,
            temperature=0.3,
        )
        
        risposta = response.choices[0].message.content
        print("🧠 Risposta raw da Groq:", repr(risposta))

        # Proviamo a estrarre JSON dalla risposta
        import re
        match = re.search(r'\{.*\}', risposta, re.DOTALL)
        if not match:
            print("⚠️ Nessun JSON trovato nella risposta Groq.")
            return
        
        nuova_memoria = json.loads(match.group(0))

        if os.path.exists(memory_path) and os.path.getsize(memory_path) > 0:
            with open(memory_path, "r", encoding="utf-8") as f:
                memoria_esistente = json.load(f)
        else:
            memoria_esistente = {}

        memoria_aggiornata = {**memoria_esistente, **nuova_memoria}

        with open(memory_path, "w", encoding="utf-8") as f:
            json.dump(memoria_aggiornata, f, ensure_ascii=False, indent=2)

        print("✅ Memoria aggiornata correttamente.")

    except Exception as e:
        print("❌ Errore estrazione memoria:", e)
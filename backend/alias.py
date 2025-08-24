import random

comandi_alias = {
    "audio_switch": {
        "variants": [
            "attiva voce",
            "disattiva voce",
            "attiva audio",
            "disattiva audio",
            "attiva la voce",
            "disattiva la voce",
            "muto",
            "togli il suono",
            "non parlarmi",
            "parlami",
            "zitto",
            "spegni voce",
            "riattiva voce"
        ],
        "responses": [
            "Ho cambiato lo stato della voce.",
            "Va bene, ho modificato l’audio.",
            "Ho attivato/disattivato la voce come richiesto."
        ]
    },

    "stop": {
        "variants": [
            "fermati",
            "esci",
            "chiudi",
            "spegniti",
            "basta",
            "stop"
        ],
        "responses": [
            "Ho interrotto quello che stavo facendo.",
            "Ok, mi fermo subito.",
            "Va bene, smetto qui."
        ]
    }
}


def trova_comando(frase: str):
    frase = frase.lower().strip()
    print(f"Frase ricevuta: '{frase}'")

    for comando, dati in comandi_alias.items():
        for chiave in dati["variants"]:
            if chiave in frase:
                risposta = random.choice(dati["responses"])
                print(f"Trovato comando: {comando} con chiave: {chiave} → risposta: {risposta}")
                return {
                    "command": comando,
                    "response": risposta
                }

    print("Nessun comando trovato")
    return None
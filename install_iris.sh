#!/bin/bash

echo "🚀 Avvio IRIS con Python 3.11..."

cd "$(dirname "$0")"

PYTHON="/opt/homebrew/bin/python3.11"

# 1. Controlla se python3.11 esiste
if [ ! -x "$PYTHON" ]; then
  echo "❌ Python 3.11 non trovato in $PYTHON. Installa con: brew install python@3.11"
  exit 1
fi

# 2. Crea l’ambiente virtuale se non esiste
if [ ! -d "venv" ]; then
  echo "🛠️  Creo ambiente virtuale..."
  "$PYTHON" -m venv venv
fi

# 3. Attiva il venv
source venv/bin/activate

# 4. Installa i pacchetti necessari
echo "📦 Installo/modifico pacchetti..."
pip install --upgrade pip > /dev/null
pip install groq termcolor playsound freetts > /dev/null

# 5. Avvia IRIS
echo "✅ IRIS in esecuzione!"
python main.py
import threading
import json

class WebSocketManager:
    def __init__(self):
        self.connections = set()
        self.lock = threading.Lock()
    
    def add_connection(self, ws):
        with self.lock:
            self.connections.add(ws)
            print(f"🔗 Nuova connessione WebSocket. Totale: {len(self.connections)}")
    
    def remove_connection(self, ws):
        with self.lock:
            self.connections.discard(ws)
            print(f"❌ Connessione WebSocket rimossa. Totale: {len(self.connections)}")
    
    def broadcast(self, message):
        with self.lock:
            dead_connections = set()
            for ws in self.connections:
                try:
                    ws.send(json.dumps(message) if isinstance(message, dict) else message)
                except Exception as e:
                    print(f"❌ Errore invio messaggio: {e}")
                    dead_connections.add(ws)
            for ws in dead_connections:
                self.connections.discard(ws)

ws_manager = WebSocketManager()
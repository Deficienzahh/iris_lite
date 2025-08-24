import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import Draggable from 'react-draggable';


const TimerWidget = ({ onDoubleClick, zIndex, onStartDrag }: { onDoubleClick: () => void; zIndex: number; onStartDrag: () => void }) => {
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [newTimerName, setNewTimerName] = useState("");
  const [newTimerHours, setNewTimerHours] = useState(0);
  const [newTimerMinutes, setNewTimerMinutes] = useState(1);
  const [newTimerSecondsInput, setNewTimerSecondsInput] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoadingTimers, setIsLoadingTimers] = useState(true);
  const [notifiedTimers, setNotifiedTimers] = useState<Set<string>>(new Set());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nodeRef = useRef(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [timerCounter, setTimerCounter] = useState(1);
  

  const showTimerNotification = (timerName: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Scaduto! ⏰', {
        body: `Il timer "${timerName}" è terminato!`,
        icon: '⏰',
        tag: `timer-${timerName}`,
        requireInteraction: true
      });
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(e => console.log('Impossibile riprodurre audio:', e));
    }
  };

  const updateTimersStatus = async () => {
    try {
      const response = await fetch('/api/timers');
      if (response.ok) {
        const data = await response.json();
        
        // Controlla per nuovi timer scaduti
        Object.entries(data).forEach(([name, seconds]) => {
          if (seconds === 0 && !notifiedTimers.has(name)) {
            // Timer appena scaduto
            showTimerNotification(name);
            playNotificationSound();
            setNotifiedTimers(prev => new Set(prev).add(name));
          }
        });
        
        setTimers(data);
      }
    } catch (error) {
      console.error("Errore aggiornamento timer:", error);
    }
  };

  useEffect(() => {
    const loadInitialStatus = async () => {
      setIsLoadingTimers(true);
      await updateTimersStatus();
      setIsLoadingTimers(false);
    };

    // Inizializza audio
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCSuF0fPYiDYIF2m98OScTgwOUarm7blmVjdfn9v2wmMhCSd2x/Deik0EDlCq5e2yZCYEZI4s');
    setTimerCounter(1);
    // Richiesta permessi notifiche
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    loadInitialStatus();
    intervalRef.current = setInterval(updateTimersStatus, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [notifiedTimers]);

  const createTimer = async () => {
    const totalSeconds = (newTimerHours * 3600) + (newTimerMinutes * 60) + newTimerSecondsInput;
    
    if (!totalSeconds || totalSeconds < 1) return;
    
    try {
      const response = await fetch('/api/timers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTimerName.trim() || `Timer ${timerCounter}`,
          seconds: totalSeconds
        })
      });
      
      if (response.ok) {
        setNewTimerName("");
        setNewTimerHours(0);
        setNewTimerMinutes(1);
        setNewTimerSecondsInput(0);
        setShowAddForm(false);
        setTimerCounter(prev => prev + 1);
        await updateTimersStatus();
      }
    } catch (error) {
      console.error("Errore creazione timer:", error);
    }
  };

  const deleteTimer = async (name: string) => {
    try {
      const response = await fetch(`/api/timers/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Rimuovi dalle notifiche quando viene eliminato
        setNotifiedTimers(prev => {
          const newSet = new Set(prev);
          newSet.delete(name);
          return newSet;
        });
        await updateTimersStatus();
      }
    } catch (error) {
      console.error("Errore cancellazione timer:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    } else {
      return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
  };

  const activeTimers = Object.entries(timers).filter(([_, seconds]) => seconds > 0);
  const expiredTimers = Object.entries(timers).filter(([_, seconds]) => seconds === 0);
  const totalTimers = activeTimers.length + expiredTimers.length;

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" onStart={onStartDrag}>
      <div 
        ref={nodeRef}
        className="relative border border-white p-4 rounded-xl text-white font-orbitron w-96 shadow-lg bg-black/50 backdrop-blur-sm"
        onDoubleClick={onDoubleClick}
        style={{ zIndex: zIndex }}
      >
        <div className="handle w-3/4 h-12 cursor-grab absolute top-0 left-0"></div>
        
        <h2 className="text-lg font-bold mb-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div> 
            TIMER
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowAddForm(!showAddForm); }}
            onDoubleClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full transition-colors bg-white/10 hover:bg-cyan-500 group"
            title="Aggiungi nuovo timer"
            aria-label="Aggiungi nuovo timer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white transition-colors group-hover:text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </h2>

        {showAddForm && (
          <div className="bg-black/50 p-4 rounded mb-4 border" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Nome timer (opzionale)"
                value={newTimerName}
                onChange={(e) => setNewTimerName(e.target.value)}
                className="w-full p-2 bg-black/50 border border-white/30 rounded text-sm text-white placeholder-white/50 focus:border-cyan-400 focus:outline-none"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              />
              
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-white/70 mb-1">ORE</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={newTimerHours}
                    onChange={(e) => setNewTimerHours(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-black/50 border border-white/30 rounded text-sm text-white focus:border-cyan-400 focus:outline-none text-center"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70 mb-1">MIN</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={newTimerMinutes}
                    onChange={(e) => setNewTimerMinutes(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-black/50 border border-white/30 rounded text-sm text-white focus:border-cyan-400 focus:outline-none text-center"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/70 mb-1">SEC</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={newTimerSecondsInput}
                    onChange={(e) => setNewTimerSecondsInput(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-black/50 border border-white/30 rounded text-sm text-white focus:border-cyan-400 focus:outline-none text-center"
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-white/50 mb-2">
                  Durata totale: {Math.floor(((newTimerHours * 3600) + (newTimerMinutes * 60) + newTimerSecondsInput) / 3600)}h {Math.floor((((newTimerHours * 3600) + (newTimerMinutes * 60) + newTimerSecondsInput) % 3600) / 60)}m {((newTimerHours * 3600) + (newTimerMinutes * 60) + newTimerSecondsInput) % 60}s
                </div>
              </div>
              
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={(e) => { e.stopPropagation(); createTimer(); }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 rounded border-2 border-cyan-400 text-black bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 transition-colors font-bold text-sm"
                  disabled={((newTimerHours * 3600) + (newTimerMinutes * 60) + newTimerSecondsInput) < 1}
                >
                  AVVIA TIMER
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowAddForm(false); }}
                  onDoubleClick={(e) => e.stopPropagation()}
                  className="px-3 py-2 rounded border border-white/50 text-white hover:border-white hover:bg-white/10 transition-all duration-200 text-sm"
                >
                  ANNULLA
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-black/50 p-4 rounded mb-4 border">
          <div className="mb-4 text-center max-h-48 overflow-y-auto">
            {isLoadingTimers ? (
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded"></div>
              </div>
            ) : totalTimers > 0 ? (
              <div className="space-y-2">
                {/* Timer attivi */}
                {activeTimers.map(([name, seconds]) => (
                  <div key={name} className="flex items-center justify-between p-2 bg-black/30 rounded border border-white/20">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <div className="text-left">
                        <div className="text-sm font-bold text-cyan-300 truncate max-w-32">{name}</div>
                        <div className="text-xs text-white/70">{formatTime(seconds)}</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTimer(name); }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-full transition-colors bg-white/10 hover:bg-red-500 group"
                      title="Elimina timer"
                      aria-label="Elimina timer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white transition-colors group-hover:text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                {/* Timer scaduti */}
                {expiredTimers.map(([name, _]) => (
                  <div key={name} className="flex items-center justify-between p-2 bg-red-500/20 rounded border border-red-500/50">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-400 rounded-full animate-pulse"></div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-red-300 truncate max-w-32">{name}</div>
                        <div className="text-xs text-red-200">SCADUTO!</div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTimer(name); }}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-full transition-colors bg-white/10 hover:bg-red-500 group"
                      title="Elimina timer scaduto"
                      aria-label="Elimina timer scaduto"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white transition-colors group-hover:text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-white/50 italic">Nessun timer attivo</div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${activeTimers.length > 0 ? 'bg-green-400 animate-pulse' : expiredTimers.length > 0 ? 'bg-red-400 animate-pulse' : 'bg-gray-400'}`}></div>
          <span className="text-xs text-white/70">
            {activeTimers.length > 0 ? `${activeTimers.length} TIMER ATTIVI` : expiredTimers.length > 0 ? `${expiredTimers.length} SCADUTI` : 'NESSUN TIMER'}
          </span>
        </div>
      </div>
    </Draggable>
  );
};

export default TimerWidget;
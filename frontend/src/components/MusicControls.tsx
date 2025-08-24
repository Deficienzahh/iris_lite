import { useState, useEffect, useRef } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import Draggable from 'react-draggable';

interface TrackInfo {
  name: string;
  artist: string;
  album?: string;
}

const MusicControls = ({ onDoubleClick, zIndex, onStartDrag }: { onDoubleClick: () => void; zIndex: number; onStartDrag: () => void }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<TrackInfo | null>(null);
  const [isLoadingTrack, setIsLoadingTrack] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const nodeRef = useRef(null);

  const updateMusicStatus = async () => {
    try {
      const playerRes = await fetch('api/music/status');
      if (playerRes.ok) {
        const playerData = await playerRes.json();
        if (playerData.success) {
          setIsPlaying(playerData.isPlaying);
        }
      }

      const trackRes = await fetch('api/music/current');
      if (trackRes.ok) {
        const trackData = await trackRes.json();
        if (trackData.success && trackData.name && trackData.artist) {
          setCurrentTrack(prevTrack => {
            if (!prevTrack || 
                prevTrack.name !== trackData.name || 
                prevTrack.artist !== trackData.artist) {
              return {
                name: trackData.name,
                artist: trackData.artist,
                album: trackData.album
              };
            }
            return prevTrack;
          });
        }
      }
    } catch (error) {
      console.error("Errore aggiornamento stato Spotify:", error);
    }
  };

  useEffect(() => {
    const loadInitialStatus = async () => {
      setIsLoadingTrack(true);
      await updateMusicStatus();
      setIsLoadingTrack(false);
    };

    loadInitialStatus();
    intervalRef.current = setInterval(updateMusicStatus, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const sendCommand = async (cmd: "playpause" | "next" | "prev") => {
    try {
      await fetch(`api/music/${cmd}`, { method: "POST" });
      
      if (cmd === "playpause") {
        setIsPlaying((prev) => !prev);
      } else if (cmd === "next" || cmd === "prev") {
        setTimeout(updateMusicStatus, 300);
      }
    } catch (error) {
      console.error("Errore comando musica:", error);
    } 
  };

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" onStart={onStartDrag}>
      <div 
        ref={nodeRef}
        className="relative border border-white p-4 rounded-xl text-white font-orbitron w-96 shadow-lg bg-black/50 backdrop-blur-sm"
        onDoubleClick={onDoubleClick}
        style={{ zIndex: zIndex }}
      >
        <div className="handle w-full h-12 cursor-grab absolute top-0 left-0"></div>
        <h2 className="text-lg font-bold mb-2 flex items-center">
          <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div> 
          MUSICA
        </h2>
        <div className="bg-black/50 p-4 rounded mb-4 border">
          <div className="mb-4 text-center">
            {isLoadingTrack ? (
              <div className="animate-pulse">
                <div className="h-4 bg-white/20 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded"></div>
              </div>
            ) : currentTrack ? (
              <div>
                <div className="text-sm font-bold text-cyan-300 mb-1 truncate">{currentTrack.name}</div>
                <div className="text-xs text-white/70 truncate">{currentTrack.artist}{currentTrack.album && ` • ${currentTrack.album}`}</div>
              </div>
            ) : (
              <div className="text-xs text-white/50 italic">Nessun brano in riproduzione</div>
            )}
          </div>
          <div className="flex justify-center items-center space-x-4">
            <button 
              onClick={() => sendCommand("prev")} 
              className="p-2 rounded-full transition-colors bg-white/10 hover:bg-cyan-500 group"
              title="Brano precedente"
              aria-label="Brano precedente"
            >
              <SkipBack className="w-5 h-5 text-white transition-colors group-hover:text-white" />
            </button>
            <button 
              onClick={() => sendCommand("playpause")} 
              className="px-4 py-2 rounded border-2 border-cyan-400 text-black bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 transition-colors font-bold text-sm"
              title={isPlaying ? "Pausa" : "Play"}
              aria-label={isPlaying ? "Pausa" : "Play"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => sendCommand("next")} 
              className="p-2 rounded-full transition-colors bg-white/10 hover:bg-cyan-500 group"
              title="Brano successivo"
              aria-label="Brano successivo"
            >
              <SkipForward className="w-5 h-5 text-white transition-colors group-hover:text-white" />
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          <span className="text-xs text-white/70">{isPlaying ? 'IN RIPRODUZIONE' : 'IN PAUSA'}</span>
        </div>
      </div>
    </Draggable>
  );
};

export default MusicControls;
import TimeWidget from "@/components/TimeWidget";
import WeatherWidget from "@/components/WeatherWidget";
import ChatInterface from "@/components/ChatInterface";
import CoreStatus from "@/components/CoreStatus";
import FooterSystemBar from "@/components/FooterSystemBar";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import MusicControls from "@/components/MusicControls";
import SummaryWidget from '@/components/SummaryWidget';
import TimerWidget from "@/components/TimerWidget";

type WidgetVisibility = {
  weather: boolean;
  music: boolean;
  time: boolean;
  timer: boolean;
  summary: boolean;
};

type ZIndex = {
  weather: number;
  music: number;
  time: number;
  chat: number;
  summary: number;
  timer: number;
};

type CommandState = {
  name: string;
  timestamp: number;
};

const Index = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [headerLoaded, setHeaderLoaded] = useState(false);
  const [coreLoaded, setCoreLoaded] = useState(false);
  const [otherComponentsLoaded, setOtherComponentsLoaded] = useState(false);
  
  const [currentCommand, setCurrentCommand] = useState<CommandState | null>(null);

  const [widgetsVisibility, setWidgetsVisibility] = useState<WidgetVisibility>({
    weather: false,
    music: false,
    time: false,
    summary: false,
    timer: false,
  });

  const [isTimeMounted, setIsTimeMounted] = useState(false);
  const [isWeatherMounted, setIsWeatherMounted] = useState(false);
  const [isMusicMounted, setIsMusicMounted] = useState(false);
  const [isSummaryMounted, setIsSummaryMounted] = useState(false);
  const [isTimerMounted, setIsTimerMounted] = useState(false);
  
  // Z-index molto più alti e con spaziatura maggiore - sopra tutti gli altri elementi
  const [zIndex, setZIndex] = useState<ZIndex>({
    weather: 10000,
    music: 11000,
    time: 12000,
    chat: 13000,
    summary: 14000,
    timer: 15000,
  });
  const [videoSummary, setVideoSummary] = useState('');

  const bringToFront = (widgetName: keyof ZIndex) => {
    console.log(`Bringing ${widgetName} to front`);
    setZIndex(prevState => {
      // Trova il valore z-index massimo attuale
      const maxZ = Math.max(...Object.values(prevState));
      const newZIndex = maxZ + 1000; // Incremento significativo
      
      console.log(`Current z-indexes:`, prevState);
      console.log(`New z-index for ${widgetName}:`, newZIndex);
      
      return {
        ...prevState,
        [widgetName]: newZIndex,
      };
    });
  };

  const toggleWidget = (widgetName: keyof WidgetVisibility) => {
    setWidgetsVisibility(prevState => ({
      ...prevState,
      [widgetName]: !prevState[widgetName],
    }));

    if (widgetName === 'time') {
      if (!widgetsVisibility.time) {
        setIsTimeMounted(true);
      }
    } else if (widgetName === 'weather') {
      if (!widgetsVisibility.weather) {
        setIsWeatherMounted(true);
      }
    } else if (widgetName === 'music') {
      if (!widgetsVisibility.music) {
        setIsMusicMounted(true);
      }
    } else if (widgetName === 'summary') {
      if (!widgetsVisibility.summary) {
        setIsSummaryMounted(true);
      }
    } else if (widgetName === 'timer') {
      if (!widgetsVisibility.timer) {
        setIsTimerMounted(true);
      }
    }
  };

  useEffect(() => {
    const headerTimer = setTimeout(() => {
      setHeaderLoaded(true);
    }, 100);

    const coreTimer = setTimeout(() => {
      setCoreLoaded(true);
    }, 800);

    const otherComponentsTimer = setTimeout(() => {
      setOtherComponentsLoaded(true);
    }, 1400);

    const resetTimer = () => {
      const newExpiry = Date.now() + 10 * 60 * 1000;
      sessionStorage.setItem("expiresAt", newExpiry.toString());
    };

    window.addEventListener("click", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("mousemove", resetTimer);

    return () => {
      clearTimeout(headerTimer);
      clearTimeout(coreTimer);
      clearTimeout(otherComponentsTimer);
      window.removeEventListener("click", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("mousemove", resetTimer);
    };
  }, [navigate]);

  const handleListeningChange = useCallback((listening: boolean) => {
    setIsListening(listening);
  }, []);

  const handleCommandReceived = useCallback((commandName: string) => {
    setCurrentCommand({ name: commandName, timestamp: Date.now() });
  }, []);
  
  const handleSummaryReceived = useCallback((summary: string) => {
    console.log("handleSummaryReceived chiamato con il riassunto:", summary);
    setVideoSummary(summary);
    setIsSummaryMounted(true);
    setWidgetsVisibility(prevState => ({ ...prevState, summary: true }));
    console.log("Stato aggiornato per il riassunto: isSummaryMounted =", true, ", widgetsVisibility.summary =", true);
  }, []);

  
  const handleAccessTerminal = () => {
    sessionStorage.removeItem("loggedIn");
    sessionStorage.removeItem("expiresAt");
    navigate("/login");
  };

  const handleWidgetTransitionEnd = (widgetName: 'time' | 'weather' | 'music' | 'summary' | 'timer') => {
    console.log(`Transizione finita per il widget: ${widgetName}`);
    if (widgetName === 'time' && !widgetsVisibility.time) {
      setIsTimeMounted(false);
      console.log("isTimeMounted impostato su false.");
    } else if (widgetName === 'weather' && !widgetsVisibility.weather) {
      setIsWeatherMounted(false);
      console.log("isWeatherMounted impostato su false.");
    } else if (widgetName === 'music' && !widgetsVisibility.music) {
      setIsMusicMounted(false);
      console.log("isMusicMounted impostato su false.");
    } else if (widgetName === 'summary' && !widgetsVisibility.summary) {
      setIsSummaryMounted(false);
      console.log("isSummaryMounted impostato su false.");
    } else if (widgetName === 'timer' && !widgetsVisibility.timer) {
      setIsTimerMounted(false);
      console.log("isTimerMounted impostato su false.");
    }
  };

  useEffect(() => {
    console.log("currentCommand:", currentCommand);
    if (currentCommand) {
      const { name } = currentCommand;
      if (name === 'weather') {
        setIsWeatherMounted(true);
        setTimeout(() => setWidgetsVisibility(prevState => ({ ...prevState, weather: true })), 50);
      }
      
      const musicCommands = ['s_playpause', 's_next', 's_previous', 's_current'];
      if (musicCommands.includes(name)) {
        setIsMusicMounted(true);
        setTimeout(() => setWidgetsVisibility(prevState => ({ ...prevState, music: true })), 50);
      }

      if (name === 'orario') {
        setIsTimeMounted(true);
        setTimeout(() => setWidgetsVisibility(prevState => ({ ...prevState, time: true })), 50);
      }
      const timerCommands = ['start_timer', 'list_timers', 'cancel_timer'];
      if (timerCommands.includes(name)) {
        setIsTimerMounted(true);
        setTimeout(() => setWidgetsVisibility(prevState => ({ ...prevState, timer: true })), 50);
      }
    }
  }, [currentCommand]);

  return (
    <div className="min-h-screen bg-black text-white font-orbitron flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-irisBlue rounded-full opacity-30 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <header
        className={`relative z-10 text-irisBlue text-xl font-bold p-6 border-b border-irisBlue/30 bg-black/50 backdrop-blur-sm transition-all duration-1000 ${
          headerLoaded ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <span className="hidden md:block">
            IRIS - Intelligenza Rivoluzionaria Intuitiva Sperimentale
        </span>
        <span className="block md:hidden">
            IRIS
        </span>
        
        <div className="absolute top-4 right-6 z-50">
            <button
                className="border border-cyan-400 text-cyan-300 hover:text-white hover:border-white px-4 py-2 rounded-md font-orbitron text-sm tracking-wider transition duration-300"
                onClick={handleAccessTerminal}
            >
                ACCESS TERMINAL
            </button>
        </div>
      </header>

      <main className="relative flex-1 flex items-center justify-center px-8 py-6 gap-8">
        {/* Container per i widget con z-index molto alto e stacking context isolato */}
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex-col gap-6 hidden md:flex" style={{ zIndex: 15000 }}>
          {/* Ogni widget è posizionato absolutely all'interno del container per creare un nuovo stacking context */}
          
          {isTimeMounted && (
            <div 
              className={`absolute transform transition-all duration-500 ease-in-out ${widgetsVisibility.time ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
              style={{ 
                zIndex: zIndex.time,
                position: 'relative' // Questo crea un nuovo stacking context
              }}
              onTransitionEnd={() => handleWidgetTransitionEnd('time')}
            >
              <TimeWidget 
                zIndex={zIndex.time} 
                onStartDrag={() => bringToFront('time')}
                onDoubleClick={() => toggleWidget('time')}
              />
            </div>
          )}
          
          {isWeatherMounted && (
            <div 
              className={`absolute transform transition-all duration-500 ease-in-out ${widgetsVisibility.weather ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
              style={{ 
                zIndex: zIndex.weather,
                position: 'relative'
              }}
              onTransitionEnd={() => handleWidgetTransitionEnd('weather')}
            >
              <WeatherWidget 
                zIndex={zIndex.weather}
                onDoubleClick={() => toggleWidget('weather')} 
                onStartDrag={() => bringToFront('weather')}
              />
            </div>
          )}

          {isMusicMounted && (
            <div 
              className={`absolute transform transition-all duration-500 ease-in-out ${widgetsVisibility.music ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
              style={{ 
                zIndex: zIndex.music,
                position: 'relative'
              }}
              onTransitionEnd={() => handleWidgetTransitionEnd('music')}
            >
              <MusicControls 
                zIndex={zIndex.music}
                onDoubleClick={() => toggleWidget('music')} 
                onStartDrag={() => bringToFront('music')}
              />
            </div>
          )}
          
          {isSummaryMounted && (
            <div
              className={`absolute transform transition-all duration-500 ease-in-out ${widgetsVisibility.summary ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
              style={{ 
                zIndex: zIndex.summary,
                position: 'relative'
              }}
              onTransitionEnd={() => handleWidgetTransitionEnd('summary')}
            >
              <SummaryWidget 
                summary={videoSummary} 
                onClose={() => toggleWidget('summary')} 
                onStartDrag={() => bringToFront('summary')}
                onDoubleClick={() => toggleWidget('summary')}
                zIndex={zIndex.summary}
              />
            </div>
          )}

          {isTimerMounted && (
            <div
              className={`absolute transform transition-all duration-500 ease-in-out ${widgetsVisibility.timer ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}
              style={{ 
                zIndex: zIndex.timer,
                position: 'relative'
              }}
              onTransitionEnd={() => handleWidgetTransitionEnd('timer')}
            >
              <TimerWidget 
                zIndex={zIndex.timer}
                onDoubleClick={() => toggleWidget('timer')}
                onStartDrag={() => bringToFront('timer')}
              />
            </div>
          )}
        </div>

        <div
          className={`transition-all duration-1200 ${
            coreLoaded ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          style={{ zIndex: 1000 }} // Z-index più basso rispetto ai widget
        >
          <CoreStatus isListening={isListening} isBackendOnline={isBackendOnline} />
        </div>

        <div
          className={`absolute right-8 top-1/2 -translate-y-1/2 transition-all duration-1000 ${
            otherComponentsLoaded ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
          style={{ zIndex: 2000 }} // Z-index per ChatInterface
        >
          <ChatInterface 
            onListeningChange={handleListeningChange}
            onCommandReceived={handleCommandReceived}
            onSummaryReceived={handleSummaryReceived}
            zIndex={zIndex.chat}
            onStartDrag={() => bringToFront('chat')}
            isAppLoaded={otherComponentsLoaded}
          />
        </div>
      </main>

      <div
        className={`transition-all duration-1000 ${
          otherComponentsLoaded ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        }`}
      >
        <FooterSystemBar 
          onBackendStatusChange={setIsBackendOnline}
          currentCommand={currentCommand?.name || null}
        />
      </div>
    </div>
  );
};

export default Index;
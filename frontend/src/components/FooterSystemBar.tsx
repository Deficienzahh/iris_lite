import { useEffect, useState } from "react";

interface FooterSystemBarProps {
  onBackendStatusChange?: (isOnline: boolean) => void;
  currentCommand: string | null;
}

const FooterSystemBar = ({ onBackendStatusChange, currentCommand }: FooterSystemBarProps) => {
  const [cpu, setCpu] = useState<number | null>(null);
  const [ram, setRam] = useState<number | null>(null);
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      console.log("🔄 Tentativo di fetch system stats...");
      try {
        const res = await fetch("api/system_stats", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        console.log("📡 Risposta ricevuta:", res.status, res.ok);
        
        if (res.ok) {
          const data = await res.json();
          console.log("✅ Dati ricevuti:", data);
          setCpu(data.cpu);
          setRam(data.ram);
          setIsBackendOnline(true);
          onBackendStatusChange?.(true);
          setLastUpdate(new Date());
          setError(null);
        } else {
          const errorText = await res.text();
          console.error("❌ Errore HTTP:", res.status, errorText);
          setError(`HTTP ${res.status}: ${errorText}`);
          setIsBackendOnline(false);
          onBackendStatusChange?.(false);
        }
      } catch (err) {
        console.error("💥 Errore fetching system stats:", err);
        setError(err instanceof Error ? err.message : String(err));
        setIsBackendOnline(false);
        onBackendStatusChange?.(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);

    return () => clearInterval(interval);
  }, [onBackendStatusChange]);

  const getSystemStatus = () => {
    if (isBackendOnline) {
      return {
        text: "System Online",
        color: "text-green-500",
        indicator: "●"
      };
    } else {
      return {
        text: "Backend Offline",
        color: "text-red-500",
        indicator: "●"
      };
    }
  };

  const status = getSystemStatus();

  // Logica per analizzare il comando e mostrare il testo corretto
  let commandText = "© Stark Industries - All Rights Reserved";
  if (currentCommand && currentCommand !== "None") {
    try {
      const parsedCommand = JSON.parse(currentCommand);
      commandText = `[${parsedCommand.response}]`;
    } catch (e) {
      commandText = `[${currentCommand}]`;
    }
  }

  return (
    <footer className="w-full text-xs text-cyan-400 font-orbitron border-t border-cyan-800 px-4 py-2 flex justify-between items-center bg-black/70">
      <div className="flex items-center gap-4">
        <span className={status.color}>
          {status.indicator} {status.text}
        </span>
        <span className={isBackendOnline ? "text-cyan-400" : "text-gray-500"}>
          CPU: {cpu !== null ? `${cpu}%` : "--"}
        </span>
        <span className={isBackendOnline ? "text-cyan-400" : "text-gray-500"}>
          Memory: {ram !== null ? `${ram}%` : "--"}
        </span>
        {!isBackendOnline && lastUpdate && (
          <span className="text-orange-400 text-[10px]">
            Last: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
        {error && (
          <span className="text-red-400 text-[10px]" title={error}>
            Error: {error.substring(0, 100)}...
          </span>
        )}
      </div>
      <div className="text-right text-[10px] text-cyan-700">
        {commandText}
      </div>
    </footer>
  );
};

export default FooterSystemBar;
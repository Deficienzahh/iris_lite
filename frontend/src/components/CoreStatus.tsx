import { useState, useEffect } from 'react'

type StatoIris = "idle" | "listening" | "server_offline" | "no_internet"

interface CoreStatusProps {
  isListening?: boolean
  isBackendOnline?: boolean
}

const CoreStatus: React.FC<CoreStatusProps> = ({ 
  isListening = false,
  isBackendOnline = true
}) => {
  const [stato, setStato] = useState<StatoIris>("idle")
  const [hasInternet, setHasInternet] = useState(true)

  const checkInternetConnection = async (): Promise<boolean> => {
    try {
      await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      const online = await checkInternetConnection()
      setHasInternet(online)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!hasInternet) {
      setStato("no_internet")
    } else if (!isBackendOnline) {
      setStato("server_offline")
    } else if (isListening) {
      setStato("listening")
    } else {
      setStato("idle")
    }
  }, [hasInternet, isBackendOnline, isListening])

  const stateConfig = {
    idle: {
      coreColor: "bg-cyan-500",
      borderColor: "border-cyan-400",
      glowColor: "rgba(34, 211, 238, 0.8)",
      textColor: "text-cyan-400",
      status: "ACTIVE",
      network: "Neural Network",
      connection: "",
      pulseClass: "animate-pulse-stronger"
    },
    listening: {
      coreColor: "bg-cyan-400",
      borderColor: "border-cyan-300",
      glowColor: "rgba(34, 211, 238, 1)",
      textColor: "text-cyan-300",
      status: "IN ASCOLTO",
      network: "Neural Network",
      connection: "Listening...",
      pulseClass: "animate-ping"
    },
    server_offline: {
      coreColor: "bg-red-600",
      borderColor: "border-red-400",
      glowColor: "rgba(239, 68, 68, 0.8)",
      textColor: "text-red-400",
      status: "SERVER OFFLINE",
      network: "Flask Server",
      connection: "Disconnected",
      pulseClass: "animate-pulse-slow"
    },
    no_internet: {
      coreColor: "bg-gray-500",
      borderColor: "border-gray-400",
      glowColor: "rgba(107, 114, 128, 0.6)",
      textColor: "text-gray-400",
      status: "NO CONNECTION",
      network: "Internet",
      connection: "Offline",
      pulseClass: "animate-pulse-slow"
    }
  }

  const config = stateConfig[stato]
  
  return (
    <div 
      className={`flex flex-col items-center justify-center w-96 h-auto`}
    >
      <div className="relative w-96 h-96 flex items-center justify-center mb-4">
        <div 
          className={`absolute w-full h-full rounded-full border ${config.borderColor} opacity-5 animate-spin-slow`} 
        />
        <div 
          className={`absolute w-80 h-80 rounded-full border ${config.borderColor} opacity-10 animate-spin-reverse`} 
        />
        <div 
          className={`absolute w-40 h-40 rounded-full ${config.coreColor} opacity-50 ${config.pulseClass}`}
          style={{
            boxShadow: `0 0 80px ${config.glowColor}, 0 0 180px ${config.glowColor.replace('0.8', '0.6')}, inset 0 0 40px ${config.glowColor.replace('0.8', '0.4')}`
          }} 
        />
        <div 
          className={`absolute top-8 left-1/2 w-3 h-3 ${config.coreColor} rounded-full transform -translate-x-1/2 animate-ping-slow`}
          style={{ boxShadow: `0 0 10px ${config.glowColor}` }} 
        />
        <div 
          className={`absolute bottom-8 left-1/2 w-3 h-3 ${config.coreColor} rounded-full transform -translate-x-1/2 animate-ping-slow`}
          style={{ boxShadow: `0 0 10px ${config.glowColor}` }} 
        />
        <div 
          className={`absolute top-1/2 left-8 w-3 h-3 ${config.coreColor} rounded-full transform -translate-y-1/2 animate-ping-slow`}
          style={{ boxShadow: `0 0 10px ${config.glowColor}` }} 
        />
        <div 
          className={`absolute top-1/2 right-8 w-3 h-3 ${config.coreColor} rounded-full transform -translate-y-1/2 animate-ping-slow`}
          style={{ boxShadow: `0 0 10px ${config.glowColor}` }} 
        />
        <div 
          className={`absolute w-24 h-24 rounded-full border-2 ${config.borderColor} opacity-20 animate-expand-fade`} 
        />
        <div 
          className={`absolute w-32 h-32 rounded-full border-2 ${config.borderColor} opacity-20 animate-expand-fade`}
          style={{ animationDelay: '1s' }}
        />
        <div 
          className={`absolute w-40 h-40 rounded-full border-2 ${config.borderColor} opacity-20 animate-expand-fade`}
          style={{ animationDelay: '2s' }}
        />
        {stato === "listening" && (
          <div 
            className="absolute w-48 h-48 rounded-full border-4 border-cyan-300 opacity-30 animate-ping"
            style={{ animationDuration: '1s' }}
          />
        )}
      </div>

      <div className={`text-center ${config.textColor} font-orbitron mt-4`}>
        <div className="text-3xl font-bold mb-2 tracking-wider">CORE</div>
        <div className="text-2xl font-semibold mb-4 tracking-wider">{config.status}</div>
        <div className="text-lg opacity-80">{config.network}</div>
        <div className="text-sm opacity-80">{config.connection}</div>
      </div>
    </div>
  );
};

export default CoreStatus;
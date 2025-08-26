import { useState, useEffect } from "react";
import { LogIn } from 'lucide-react'
import { Lock } from 'lucide-react'
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState("");
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const navigate = useNavigate();

  // Hook per verificare lo stato del backend
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const res = await fetch("/api/system_stats", {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (res.ok) {
          setIsBackendOnline(true);
        } else {
          setIsBackendOnline(false);
        }
      } catch (err) {
        console.error("Backend status check failed:", err);
        setIsBackendOnline(false);
      }
    };

    // Controlla subito all'avvio
    checkBackendStatus();
    
    // Poi controlla ogni 10 secondi
    const interval = setInterval(checkBackendStatus, 10000);

    return () => clearInterval(interval);
  }, []);

  const login = async (e?: React.FormEvent) => {
    e?.preventDefault(); // <-- impedisce il reload

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("loggedIn", "true");
        navigate("/");
      } else {
        setErrore(data.error || "Errore generico");
      }
    } catch {
      setErrore("Errore di connessione");
    }
  };

  const getBackendStatus = () => {
    if (isBackendOnline) {
      return {
        text: "ONLINE",
        color: "text-green-500",
        bgColor: "bg-green-500"
      };
    } else {
      return {
        text: "OFFLINE",
        color: "text-red-500",
        bgColor: "bg-red-500"
      };
    }
  };

  const status = getBackendStatus();

  return (
    <div className="min-h-screen bg-black text-white font-orbitron flex flex-col items-center justify-center p-4">
      {/* Contenitore principale della login box */}
      <div className="bg-black backdrop-blur-sm border border-white p-8 rounded-xl shadow-lg w-full max-w-md">
        
        {/* Icona o freccia (come nella reference) */}
        <div className="flex justify-center mb-6">
          <LogIn className="size-12 text-cyan-300"/>
        </div>

        {/* Titolo e Sottotitolo */}
        <h1 className="text-3xl font-bold text-center mb-2 tracking-wider">ACCESS TERMINAL</h1>
        <p className="text-sm text-center opacity-70 mb-8">Inserisci la password</p>

        <form onSubmit={(e) => login(e)} autoComplete="off">
          {/* Campo Security Code */}
          <div className="mb-6">
            <label htmlFor="securityCode" className="block text-sm text-white mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="w-5 h-5 text-white/50"/>
              </div>
              <input
                type="password" // Per mascherare l'input del codice
                id="securityCode"
                name="access_code"
                className="w-full bg-black/50 bg-opacity-70 border border-white/50 border-opacity-20 rounded text-white placeholder:text-white/50 text-sm focus:outline-none pl-10 pr-3 py-2"
                placeholder="************" // Placeholder visivo
                autoComplete="new-password" // Per evitare che il browser suggerisca password salvate
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
                required
              />
            </div>
          </div>

          {/* Pulsante INITIALIZE ACCESS */}
          <button
            type="submit"
            disabled={!isBackendOnline}
            className={`w-full font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2 text-lg tracking-wide ${
              isBackendOnline 
                ? "bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700 text-white" 
                : "bg-gray-600 text-gray-400 cursor-not-allowed"
            }`}
          >
            <LogIn className="w-5 h-5"/>
            ACCEDI
          </button>
        </form>
        {errore && (
          <p className="text-red-500 mt-4 text-sm text-center">{errore}</p>
        )}

        {/* Status Security Level */}
        <div className="flex items-center justify-between text-xs mt-8 pt-4 border-t border-white/50 opacity-80">
          <span>Version 2.0</span>
          <div className="flex items-center">
            <span className={`w-2 h-2 ${status.bgColor} rounded-full mr-1 ${isBackendOnline ? 'animate-pulse' : ''}`}></span>
            <span className={status.color}>{status.text}</span>
          </div>
        </div>
      </div>

      {/* Copyright in basso */}
      <div className="text-xs text-gray-500 mt-12 opacity-70">
        © Stark Industries - Authorized Personnel Only
      </div>
    </div>
  );
};

export default LoginPage;
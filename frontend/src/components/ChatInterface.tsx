import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import Draggable from 'react-draggable';

interface ChatMessage {
  sender: "user" | "iris" | "system";
  content: string;
}

interface ChatInterfaceProps {
  onListeningChange?: (isListening: boolean) => void;
  onCommandReceived?: (commandName: string) => void;
  onSummaryReceived?: (summary: string) => void;
  zIndex: number;
  onStartDrag: () => void;
  isAppLoaded: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  onListeningChange,
  onCommandReceived,
  onSummaryReceived,
  zIndex,
  onStartDrag,
  isAppLoaded,
}) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [canAutoScroll, setCanAutoScroll] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const transcriptionInterval = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const nodeRef = useRef<HTMLDivElement>(null);

  // ================= UTILITIES =================

  const extractText = (children: React.ReactNode): string => {
    if (typeof children === "string") return children;
    if (typeof children === "number") return children.toString();
    if (Array.isArray(children)) return children.map(extractText).join("");
    if (React.isValidElement(children)) {
      const element = children as React.ReactElement<{ children?: React.ReactNode }>;
      return element.props.children ? extractText(element.props.children) : "";
    }
    return "";
  };

  const handleClearChat = useCallback(async () => {
    try {
      await fetch("/api/chat/clear", { method: "POST" });
      setCurrentMessages([{ sender: "system", content: "Chat cleared." }]);
    } catch {
      setCurrentMessages([{ sender: "system", content: "Failed to clear chat." }]);
    }
  }, []);

  const fetchAudioState = useCallback(async () => {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        setIsAudioOn(config.audio ?? false);
      }
    } catch (error) {
      console.error("Errore nel caricamento dello stato audio:", error);
    }
  }, []);

  const handleAudioToggle = useCallback(async () => {
    try {
      await fetch('/api/audio/toggle', { method: 'POST' });
      setIsAudioOn(prev => !prev);
    } catch (error) {
      console.error("Errore nel toggle dell'audio:", error);
    }
  }, []);

  const stopVoiceListening = useCallback(async () => {
    setIsListening(false);
    onListeningChange?.(false);
    if (transcriptionInterval.current) {
      clearInterval(transcriptionInterval.current);
      transcriptionInterval.current = null;
    }
    await fetch("api/voice/stop-listening", { method: "POST" });
  }, [onListeningChange]);

  const checkTranscription = useCallback(async (handleSubmit: (text?: string) => void) => {
    try {
      const res = await fetch("/api/voice/transcription");
      const data = await res.json();

      if (data.transcription && data.transcription.trim() !== "") {
        setCurrentMessages(prev => [...prev, { sender: "user", content: data.transcription }]);
      }

      if (data.is_complete) {
        clearInterval(transcriptionInterval.current!);
        transcriptionInterval.current = null;

        setIsListening(false);
        onListeningChange?.(false);

        handleSubmit(data.transcription);
        await fetch("/api/voice/reset", { method: "POST" });
      }

    } catch (error) {
      console.error("Transcription error:", error);
    }
  }, [onListeningChange]);

  const startVoiceListening = useCallback((handleSubmit: (text?: string) => void) => async () => {
    try {
      setIsListening(true);
      onListeningChange?.(true);

      const res = await fetch("/api/voice/start-listening", { method: "POST" });
      if (!res.ok) throw new Error("Failed to start listening");

      transcriptionInterval.current = setInterval(() => checkTranscription(handleSubmit), 500);

      const timeoutRef = setTimeout(() => {
        if (transcriptionInterval.current) {
          clearInterval(transcriptionInterval.current);
          transcriptionInterval.current = null;
        }
        setIsListening(false);
        onListeningChange?.(false);
        fetch("/api/voice/stop-listening", { method: "POST" });
      }, 30000);

      return () => clearTimeout(timeoutRef);

    } catch (error) {
      console.error("Voice listening error:", error);
      setIsListening(false);
      onListeningChange?.(false);
    }
  }, [checkTranscription, onListeningChange]);

  // ================= EFFECTS =================

  useEffect(() => {
    fetchAudioState();
    setCurrentMessages([]);
  }, [fetchAudioState]);

  useEffect(() => {
    const timer = setTimeout(() => setCanAutoScroll(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (canAutoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [currentMessages, isProcessing, canAutoScroll]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  useEffect(() => {
    return () => {
      if (transcriptionInterval.current) clearInterval(transcriptionInterval.current);
    };
  }, []);

  // ================= INPUT HANDLERS =================

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      onListeningChange?.(e.target.value.trim().length > 0);
    },
    [onListeningChange]
  );

  const handleSubmit = useCallback(async (text?: string) => {
    const content = text ?? input.trim();
    if (!content) return;

    setCurrentMessages(prev => [...prev, { sender: "user", content }]);
    setInput("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/iris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      const data = await res.json();

      if (data.content) setCurrentMessages(prev => [...prev, { sender: "iris", content: data.content }]);
      if (data.command_name) onCommandReceived?.(data.command_name);
      if (data.type === "show_summary") onSummaryReceived?.(data.content);

    } catch (err) {
      console.error("Errore invio input a IRIS:", err);
      setCurrentMessages(prev => [...prev, { sender: "system", content: "Errore nella richiesta." }]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, onCommandReceived, onSummaryReceived]);

  // ================= RENDERING =================

  const renderMessage = (msg: ChatMessage, index: number) => (
    <div
      key={index}
      className={`max-w-[80%] px-3 py-2 rounded whitespace-pre-wrap break-words ${
        msg.sender === "user"
          ? "self-end bg-cyan-500 text-black"
          : msg.sender === "system"
          ? "self-center bg-white/5 text-cyan-300 italic"
          : "self-start bg-white/10 text-white"
      }`}
    >
      {msg.sender === "iris" ? (
        <ReactMarkdown
          rehypePlugins={[rehypeHighlight]}
          components={{
            pre({ children }) {
              const codeContent = extractText(children).trim();
              const copyToClipboard = async (e: React.MouseEvent) => {
                e.preventDefault(); e.stopPropagation();
                const originalText = (e.currentTarget as HTMLButtonElement).textContent;
                try {
                  await navigator.clipboard.writeText(codeContent);
                  (e.currentTarget as HTMLButtonElement).textContent = '✓';
                  setTimeout(() => { (e.currentTarget as HTMLButtonElement).textContent = originalText; }, 1000);
                } catch (err) {
                  console.error("Errore copia:", err);
                }
              };
              return (
                <div className="relative group overflow-x-auto rounded-lg bg-[#0d1117] border border-white/20 p-3 my-2 w-full font-mono text-sm">
                  <button onClick={copyToClipboard} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white bg-cyan-600 hover:bg-cyan-500 px-2 py-1 rounded z-10">Copia</button>
                  <pre className="whitespace-pre w-full overflow-x-auto [&>code]:!bg-transparent [&_*]:!bg-transparent">{children}</pre>
                </div>
              );
            },
            code({ className, children, ...props }) {
              const code = String(children).trim();
              if (!className) return <code className="bg-black/50 px-1 py-0.5 rounded text-xs font-mono border border-white/10" {...props}>{code}</code>;
              return <code className={className} {...props}>{children}</code>;
            },
            p({ children }) { return <p className="whitespace-pre-wrap break-words">{children}</p> }
          }}
        >
          {String(msg.content)}
        </ReactMarkdown>
      ) : String(msg.content)}
    </div>
  );

  const renderVoiceButton = () => (
    <button
      className={`p-2 rounded-full ${isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-cyan-500 hover:bg-cyan-600"} transition-colors`}
      onClick={isListening ? stopVoiceListening : startVoiceListening(handleSubmit)}
      disabled={isProcessing}
      title={isListening ? "Stop listening" : "Start voice input"}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
      </svg>
    </button>
  );

  const renderAudioButton = () => (
    <button className={`p-2 rounded-full transition-colors ${isAudioOn ? "bg-cyan-500 hover:bg-cyan-600" : "bg-white/10 hover:bg-white/20"}`} onClick={handleAudioToggle} title={isAudioOn ? "Audio ON" : "Audio OFF"}>
      {isAudioOn ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a.5.5 0 01.5.5v13a.5.5 0 01-1 0v-13a.5.5 0 01.5-.5z" />
          <path d="M14.5 5a.5.5 0 01.5.5v9a.5.5 0 01-1 0v-9a.5.5 0 01.5-.5z" />
          <path d="M5.5 5a.5.5 0 01.5.5v9a.5.5 0 01-1 0v-9a.5.5 0 01.5-.5z" />
          <path d="M17.5 7a.5.5 0 01.5.5v5a.5.5 0 01-1 0v-5a.5.5 0 01.5-.5z" />
          <path d="M2.5 7a.5.5 0 01.5.5v5a.5.5 0 01-1 0v-5a.5.5 0 01.5-.5z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 3a.5.5 0 01.5.5v13a.5.5 0 01-1 0v-13a.5.5 0 01.5-.5z" />
          <path d="M14.5 5a.5.5 0 01.5.5v9a.5.5 0 01-1 0v-9a.5.5 0 01.5-.5z" />
          <path d="M5.5 5a.5.5 0 01.5.5v9a.5.5 0 01-1 0v-9a.5.5 0 01.5-.5z" />
          <path d="M17.5 7a.5.5 0 01.5.5v5a.5.5 0 01-1 0v-5a.5.5 0 01.5-.5z" />
          <path d="M2.5 7a.5.5 0 01.5.5v5a.5.5 0 01-1 0v-5a.5.5 0 01.5-.5z" />
        </svg>
      )}
    </button>
  );

  const renderClearChatButton = () => (
    <button className="p-2 rounded-full transition-colors bg-white/10 hover:bg-red-500 group" onClick={handleClearChat} title="Clear chat">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white transition-colors group-hover:text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    </button>
  );

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" onStart={onStartDrag}>
      <div ref={nodeRef} className="relative border border-white p-4 rounded-xl text-white font-orbitron w-96 shadow-lg bg-black/50 backdrop-blur-sm" style={{ zIndex }}>
        <header className="handle mb-4 flex items-center justify-between cursor-grab">
          <div className="flex-grow">
            <h2 className="text-lg font-bold flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${isListening ? "bg-red-500 animate-pulse" : "bg-cyan-400"}`} />
              IRIS INTERFACE
            </h2>
          </div>
          <div className="flex gap-2">{renderAudioButton()}{renderClearChatButton()}</div>
        </header>

        <div className="bg-black/50 border border-white/30 p-3 rounded mb-4 text-sm min-h-[60px] max-h-[400px] overflow-y-auto flex flex-col gap-2">
          {currentMessages.length === 0 && !isProcessing ? <div className="opacity-60">Waiting for input...</div> : currentMessages.map(renderMessage)}
          {isProcessing && <div className="self-start text-white/70 italic">Processing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2 items-center">
          {renderVoiceButton()}
          <textarea
            ref={textareaRef}
            className="flex-1 bg-black/50 border border-white/50 px-3 py-2 rounded text-white placeholder:text-white/50 text-sm focus:outline-none focus:border-white resize-none overflow-hidden max-h-40"
            placeholder={isListening ? "Listening..." : "Type or speak to IRIS..."}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
            disabled={isListening || isProcessing}
          />
        </div>
      </div>
    </Draggable>
  );
};

export default ChatInterface;
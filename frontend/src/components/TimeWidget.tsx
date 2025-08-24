import { useEffect, useState, useRef } from "react";
import Draggable from 'react-draggable';

const TimeWidget = ({ onDoubleClick, zIndex, onStartDrag }: { onDoubleClick?: () => void; zIndex: number; onStartDrag: () => void }) => {
  const [time, setTime] = useState(new Date());
  const nodeRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const day = time.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const clock = time.toLocaleTimeString("it-IT");
  const [timezoneOffset, setTimezoneOffset] = useState("");

  useEffect(() => {
    const offsetMinutes = new Date().getTimezoneOffset();
    const sign = offsetMinutes <= 0 ? "+" : "-";
    const absMinutes = Math.abs(offsetMinutes);
    const hours = Math.floor(absMinutes / 60)
      .toString()
      .padStart(2, "0");
    const minutes = (absMinutes % 60).toString().padStart(2, "0");
    setTimezoneOffset(`UTC${sign}${hours}:${minutes}`);
  }, []);

  return (
    <Draggable nodeRef={nodeRef} handle=".handle" onStart={onStartDrag}>
      <div 
        ref={nodeRef}
        className="relative border border-white p-4 rounded-xl w-80 shadow-lg bg-black/50 backdrop-blur-sm"
        onDoubleClick={onDoubleClick}
        style={{ zIndex: zIndex }}
      >
        <div className="handle absolute top-0 left-0 w-full h-12 cursor-grab"></div>
        <div className="flex items-center mb-2">
          <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
          <h2 className="text-lg font-bold">ORARIO</h2>
        </div>
        
        <div className="text-3xl font-semibold mb-1 font-orbitron">
          {clock}
        </div>
        
        <div className="text-sm mb-2">
          {day}
        </div>
        
        <div className="text-xs opacity-70 border-t pt-2">
          {timezoneOffset}
        </div>
      </div>
    </Draggable>
  );
};

export default TimeWidget;
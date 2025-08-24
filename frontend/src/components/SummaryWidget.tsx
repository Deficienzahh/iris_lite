// SummaryWidget.tsx

import React, { useRef } from 'react';
import Draggable from 'react-draggable';

interface SummaryWidgetProps {
    summary: string;
    onClose: () => void;
    zIndex: number;
    onStartDrag: () => void;
    onDoubleClick: () => void;
}

const SummaryWidget: React.FC<SummaryWidgetProps> = ({ summary, zIndex, onStartDrag, onDoubleClick }) => {
    const nodeRef = useRef(null);

    return (
        <Draggable nodeRef={nodeRef} handle=".handle" onStart={onStartDrag}>
            <div 
                ref={nodeRef}
                className="relative border border-white p-4 rounded-xl w-80 shadow-lg bg-black/50 backdrop-blur-sm flex flex-col h-96 font-orbitron text-white"
                style={{ zIndex }}
                onDoubleClick={onDoubleClick}
            >
                {/* Handle per il trascinamento */}
                <div className="handle absolute top-0 left-0 w-full h-12 cursor-grab"></div>

                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
                        <h2 className="text-lg font-bold">RIASSUNTO VIDEO</h2>
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 text-sm whitespace-pre-wrap leading-relaxed border-t border-white/30 pt-4">
                    <p>{summary}</p>
                </div>
            </div>
        </Draggable>
    );
};

export default SummaryWidget;
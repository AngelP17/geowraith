import React, { useState } from 'react';

interface IntelligenceBriefCardProps {
  brief: string;
  generatedAt: string;
  model: string;
}

export const IntelligenceBriefCard: React.FC<IntelligenceBriefCardProps> = ({
  brief,
  generatedAt,
  model,
}) => {
  const [expanded, setExpanded] = useState(false);

  const formattedDate = new Date(generatedAt).toLocaleString();
  const isFallback = model.includes('fallback');

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-blue-400">📄</span>
          <span className="text-sm font-medium text-white/90">Intelligence Brief</span>
          {isFallback && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
              Fallback
            </span>
          )}
        </div>
        <span className="text-white/50">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-white/10">
          <p className="text-sm text-white/80 leading-relaxed mt-3">{brief}</p>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-white/40">
              <span>🤖</span>
              <span>{model}</span>
            </div>
            <span className="text-xs text-white/40">{formattedDate}</span>
          </div>
        </div>
      )}
    </div>
  );
};

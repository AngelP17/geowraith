import React from 'react';

interface AnomalyBannerProps {
  message: string;
  level: 'low' | 'medium' | 'high';
  signalsCount: number;
}

const LEVEL_CONFIG = {
  low: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    icon: '⚠️',
  },
  medium: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    icon: '🔶',
  },
  high: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: '🔴',
  },
};

export const AnomalyBanner: React.FC<AnomalyBannerProps> = ({
  message,
  level,
  signalsCount,
}) => {
  const config = LEVEL_CONFIG[level];

  return (
    <div className={`rounded-lg border ${config.bg} ${config.border} p-3 mb-4`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.text} text-lg`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.text}`}>
            {message}
          </p>
          <p className="text-xs text-white/50 mt-1">
            {signalsCount} signal{signalsCount !== 1 ? 's' : ''} detected within 50km radius
          </p>
        </div>
        <div className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
          {level.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'motion/react';

interface ConfidenceIndicatorProps {
  confidence: number;
  tier: 'high' | 'medium' | 'low';
}

const TIER_CONFIG = {
  high: {
    color: 'emerald',
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    label: 'High Confidence',
    description: 'Strong match quality with good consensus',
  },
  medium: {
    color: 'amber',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    label: 'Medium Confidence',
    description: 'Reasonable match but verify with other sources',
  },
  low: {
    color: 'rose',
    bg: 'bg-rose-500/20',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    label: 'Low Confidence',
    description: 'Weak match quality - treat as approximate only',
  },
};

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  tier,
}) => {
  const config = TIER_CONFIG[tier];
  const percentage = Math.round(confidence * 100);

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`w-2 h-2 rounded-full ${config.text.replace('text-', 'bg-')}`}
          />
          <span className={`text-xs font-medium ${config.text}`}>
            {config.label}
          </span>
        </div>
        <span className="text-xs text-white/60">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1.5 rounded-full bg-black/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${config.text.replace('text-', 'bg-')}`}
        />
      </div>

      <p className="mt-2 text-[10px] text-white/50 leading-relaxed">
        {config.description}
      </p>
    </div>
  );
};

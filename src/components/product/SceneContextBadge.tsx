import React from 'react';
import { Building2, HelpCircle, Landmark, Mountain, Trees } from 'lucide-react';
import type { SceneType, CohortHint } from '../../lib/api';

interface SceneContextBadgeProps {
  sceneType?: SceneType;
  cohortHint?: CohortHint;
  confidenceCalibration?: string;
}

const sceneConfig: Record<
  SceneType,
  { icon: React.ElementType; label: string; accentClass: string }
> = {
  landmark: {
    icon: Landmark,
    label: 'Iconic Landmark',
    accentClass: 'text-[var(--gw-accent)]',
  },
  nature: {
    icon: Mountain,
    label: 'Natural Terrain',
    accentClass: 'text-emerald-300',
  },
  urban: {
    icon: Building2,
    label: 'Urban Sector',
    accentClass: 'text-sky-300',
  },
  rural: {
    icon: Trees,
    label: 'Rural Area',
    accentClass: 'text-lime-300',
  },
  unknown: {
    icon: HelpCircle,
    label: 'Unclassified Scene',
    accentClass: 'text-white/45',
  },
};

export const SceneContextBadge: React.FC<SceneContextBadgeProps> = ({
  sceneType = 'unknown',
  cohortHint,
  confidenceCalibration,
}) => {
  const config = sceneConfig[sceneType];
  const Icon = config.icon;
  const precisionText = cohortHint === 'iconic_landmark' ? 'High Precision' : 'Moderate Precision';

  return (
    <div
      className="group relative px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.08]
                 backdrop-blur-md transition-all duration-300 hover:border-white/[0.16]"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <Icon className={`w-4 h-4 ${config.accentClass}`} strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium tracking-[-0.01em] text-white">{config.label}</p>
          <p className="text-[11px] font-mono tracking-[0.08em] uppercase text-white/45">
            {precisionText}
          </p>
          {confidenceCalibration && (
            <p className="mt-2 text-[11px] leading-snug text-white/62">
              {confidenceCalibration}
            </p>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent
                   via-white/12 to-transparent"
      />
    </div>
  );
};


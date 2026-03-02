import { motion } from 'motion/react';
import type { Mode } from '../product';
import { demoScenarios, type DemoKey } from '../../lib/demo';

interface DemoScenarioStripProps {
  activeScenarioId: DemoKey;
  onSelect: (scenarioId: DemoKey, mode?: Mode) => void;
}

export function DemoScenarioStrip({
  activeScenarioId,
  onSelect,
}: DemoScenarioStripProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-[rgba(9,10,14,0.88)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[var(--gw-text-muted)]">
            Scenario Launcher
          </p>
          <h3 className="mt-2 font-display text-xl text-white">Curated mission replays</h3>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--gw-accent)]">
          6 Scenarios
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {demoScenarios.map((scenario) => {
          const active = scenario.id === activeScenarioId;

          return (
            <motion.button
              key={scenario.id}
              type="button"
              onClick={() => onSelect(scenario.id, scenario.defaultMode)}
              whileHover={{ y: -2 }}
              className={`group overflow-hidden rounded-[22px] border text-left transition-all duration-300 ${
                active
                  ? 'border-[rgba(243,184,97,0.34)] bg-[rgba(243,184,97,0.08)]'
                  : 'border-white/8 bg-white/[0.02] hover:border-white/16 hover:bg-white/[0.04]'
              }`}
            >
              <div className="relative h-28 overflow-hidden border-b border-white/8">
                <img
                  src={scenario.imageSrc}
                  alt={scenario.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.18em] text-white/70 backdrop-blur">
                  {scenario.defaultMode}
                </div>
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h4 className="font-display text-lg text-white">{scenario.title}</h4>
                  <p className="mt-1 text-sm leading-relaxed text-white/55">
                    {scenario.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {scenario.featureHighlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/58"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, Database, Radio, ShieldCheck } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { DemoWorkbench } from '../components/demo/DemoWorkbench';
import { usePredictionWorkbench } from '../components/demo/usePredictionWorkbench';
import { parseDemoSearch } from '../lib/demo';

export function DemoPage() {
  const workbench = usePredictionWorkbench();
  const [searchParams, setSearchParams] = useSearchParams();
  const { scenarioId, mode } = parseDemoSearch(`?${searchParams.toString()}`);

  useEffect(() => {
    if (
      workbench.activeScenarioId !== scenarioId ||
      (mode && workbench.mode !== mode)
    ) {
      workbench.applyScenario(scenarioId, mode);
    }
  }, [
    mode,
    scenarioId,
    workbench.activeScenarioId,
    workbench.applyScenario,
    workbench.mode,
  ]);

  const runtimeLabel =
    workbench.dataSource === 'live' ? 'Live Local Inference' : 'Replay Mode';

  const handleScenarioSelect = (nextScenarioId: typeof scenarioId, nextMode?: typeof mode) => {
    const params = new URLSearchParams();
    params.set('scenario', nextScenarioId);
    params.set('mode', nextMode ?? workbench.mode);
    setSearchParams(params, { replace: false });
    workbench.applyScenario(nextScenarioId, nextMode ?? workbench.mode);
  };

  return (
    <div className="min-h-screen bg-[#050607] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(243,184,97,0.1),transparent_22%),radial-gradient(circle_at_85%_10%,rgba(95,141,181,0.14),transparent_22%),linear-gradient(180deg,#070708_0%,#050607_60%,#040506_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.28) 1px, transparent 1px)',
          backgroundSize: '88px 88px',
        }}
      />

      <div className="relative z-10 px-5 py-8 md:px-[72px] md:py-10">
        <header className="mx-auto flex max-w-[1520px] flex-col gap-6 rounded-[34px] border border-white/10 bg-[rgba(9,10,14,0.82)] px-6 py-6 shadow-[0_24px_100px_rgba(0,0,0,0.42)] backdrop-blur md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
                Back to Site
              </Link>
              <img src="/logo-wordmark.png" alt="GeoWraith" className="h-8 w-auto select-none" />
              <span className="rounded-full border border-[rgba(243,184,97,0.22)] bg-[rgba(243,184,97,0.08)] px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-[var(--gw-accent)]">
                Mission Console
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/#docs"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/72 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                Docs
              </a>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-white/58">
                <span className={`h-2 w-2 rounded-full ${
                  workbench.liveApiStatus === 'online'
                    ? 'bg-emerald-400'
                    : workbench.liveApiStatus === 'checking'
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                }`} />
                {workbench.liveStatusText}
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
            <div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-mono uppercase tracking-[0.28em] text-[var(--gw-text-muted)]"
              >
                Dedicated Hybrid Surface
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="mt-3 max-w-4xl font-display text-4xl leading-[0.94] text-white md:text-6xl"
              >
                Mission-grade replay and live inference,
                <span className="block text-[var(--gw-accent)]">without turning the landing page into a cockpit.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="mt-5 max-w-3xl text-base leading-relaxed text-white/58 md:text-lg"
              >
                Inspect replay scenarios, flip into live local inference when the backend is ready,
                and surface verifier traces, anomaly overlays, contextual layers, and shareable
                reports from a single operator-facing surface.
              </motion.p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--gw-accent)]" />
                  Mode
                </div>
                <p className="mt-3 text-sm text-white/85">{runtimeLabel}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
                  <Database className="h-3.5 w-3.5 text-[var(--gw-accent)]" />
                  Corpus
                </div>
                <p className="mt-3 text-sm text-white/85">
                  {workbench.healthData?.services.hnsw_index.catalog ?? 'replay catalog'}
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
                  <Radio className="h-3.5 w-3.5 text-[var(--gw-accent)]" />
                  Scenario
                </div>
                <p className="mt-3 text-sm text-white/85">{workbench.activeScenario.title}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto mt-6 max-w-[1520px]">
          <DemoWorkbench
            workbench={workbench}
            onScenarioSelect={handleScenarioSelect}
          />
        </div>
      </div>
    </div>
  );
}

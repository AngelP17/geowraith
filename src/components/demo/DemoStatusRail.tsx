import { AlertTriangle, Bell, Brain, Database, Radio, ShieldCheck } from 'lucide-react';
import type { ApiHealthResponse, ApiReadinessResponse, PredictResponse } from '../../lib/api';
import type { DemoScenario } from '../../lib/demo';
import type {
  DataSource,
  LiveApiStatus,
  LiveReadinessState,
} from './usePredictionWorkbench';

interface DemoStatusRailProps {
  activeScenario: DemoScenario;
  dataSource: DataSource;
  healthData: ApiHealthResponse | null;
  liveApiStatus: LiveApiStatus;
  liveReadiness: LiveReadinessState;
  readinessData: ApiReadinessResponse | null;
  result: PredictResponse | null;
}

function getToneClasses(status: 'good' | 'warn' | 'muted' | 'bad') {
  if (status === 'good') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  if (status === 'warn') {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }

  if (status === 'bad') {
    return 'border-red-500/20 bg-red-500/10 text-red-300';
  }

  return 'border-white/10 bg-white/[0.03] text-white/55';
}

export function DemoStatusRail({
  activeScenario,
  dataSource,
  healthData,
  liveApiStatus,
  liveReadiness,
  readinessData,
  result,
}: DemoStatusRailProps) {
  const isLiveSelected = dataSource === 'live';
  const isLiveReady =
    isLiveSelected && liveApiStatus === 'online' && liveReadiness === 'ready';
  const runtimeLabel = isLiveSelected ? 'Live Local Inference' : 'Replay Mode';

  const backendTone =
    liveApiStatus === 'online'
      ? 'good'
      : liveApiStatus === 'checking'
        ? 'warn'
        : 'bad';

  const hnswTone =
    healthData?.services.hnsw_index.status === 'healthy'
      ? 'good'
      : healthData?.services.hnsw_index.status === 'warming'
        ? 'warn'
        : 'muted';

  return (
    <aside data-testid="demo-status-rail" className="space-y-4">
      <section className="rounded-[28px] border border-white/10 bg-[rgba(9,10,14,0.88)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[var(--gw-text-muted)]">
          Mission Status
        </p>
        <h3 className="mt-2 font-display text-2xl text-white">{runtimeLabel}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          {isLiveReady
            ? 'Backend, corpus, and readiness checks are green. The console is running local inference.'
            : isLiveSelected
              ? 'Live mode is selected, but the local stack is still offline or warming. Replay data remains available while services stabilize.'
            : 'Curated replay data stays available while the local stack is offline or still warming.'}
        </p>

        <div className="mt-5 grid gap-3">
          <div className={`rounded-2xl border px-4 py-3 ${getToneClasses(backendTone)}`}>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
              <Radio className="h-3.5 w-3.5" />
              Backend
            </div>
            <p className="mt-2 text-sm font-medium">
              {liveApiStatus === 'online'
                ? 'Online'
                : liveApiStatus === 'checking'
                  ? 'Checking'
                  : 'Offline'}
            </p>
          </div>

          <div className={`rounded-2xl border px-4 py-3 ${getToneClasses(hnswTone)}`}>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
              <Database className="h-3.5 w-3.5" />
              HNSW Corpus
            </div>
            <p className="mt-2 text-sm font-medium">
              {healthData?.services.hnsw_index.status ?? 'unknown'}
            </p>
            <p className="mt-1 text-xs text-white/55">
              {healthData?.services.hnsw_index.vectors ?? 0} vectors •{' '}
              {healthData?.services.hnsw_index.catalog ?? 'no catalog'}
            </p>
          </div>

          <div
            className={`rounded-2xl border px-4 py-3 ${getToneClasses(
              liveReadiness === 'ready' ? 'good' : liveReadiness === 'warming' ? 'warn' : 'muted'
            )}`}
          >
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Readiness
            </div>
            <p className="mt-2 text-sm font-medium">
              {liveReadiness === 'ready' ? 'Ready' : liveReadiness.replace('_', ' ')}
            </p>
            {readinessData?.reason && (
              <p className="mt-1 text-xs text-white/55">{readinessData.reason}</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[rgba(9,10,14,0.88)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[var(--gw-text-muted)]">
              Feature Flags
            </p>
            <h3 className="mt-2 font-display text-xl text-white">Hybrid stack exposure</h3>
          </div>
          <Bell className="h-5 w-5 text-[var(--gw-accent)]" />
        </div>

        <div className="mt-4 grid gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
              Verifier
            </p>
            <p className="mt-1 text-sm text-white/80">
              {healthData?.features.verifier_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
              Intelligence Briefs
            </p>
            <p className="mt-1 text-sm text-white/80">
              {healthData?.features.intelligence_brief_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
              Anomaly Detection
            </p>
            <p className="mt-1 text-sm text-white/80">
              {healthData?.features.anomaly_detection_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[rgba(9,10,14,0.88)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[var(--gw-text-muted)]">
              Active Scenario
            </p>
            <h3 className="mt-2 font-display text-xl text-white">{activeScenario.title}</h3>
          </div>
          <img
            src={activeScenario.imageSrc}
            alt={activeScenario.title}
            className="h-14 w-14 rounded-2xl border border-white/10 object-cover"
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          {activeScenario.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {activeScenario.featureHighlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-white/58"
            >
              {highlight}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[rgba(9,10,14,0.88)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-[var(--gw-accent)]" />
          <p className="text-[11px] font-mono uppercase tracking-[0.28em] text-[var(--gw-text-muted)]">
            Runtime Evidence
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
              Result State
            </p>
            <p className="mt-1 text-sm text-white/80">
              {result?.status === 'low_confidence' ? 'Withheld / low confidence' : 'Actionable result'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
              Verifier Stage
            </p>
            <p className="mt-1 text-sm text-white/80">
              {result?.diagnostics?.verifier_stage ?? 'not invoked'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
              Alert Layer
            </p>
            <p className="mt-1 text-sm text-white/80">
              {result?.anomaly_alert
                ? `${result.anomaly_alert.signals_count} signals • ${result.anomaly_alert.level}`
                : 'No active anomaly card'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/38">
              Brief Status
            </p>
            <p className="mt-1 text-sm text-white/80">
              {result?.intelligence_brief ? 'Generated' : 'Not present'}
            </p>
          </div>
          {result?.notes && (
            <div className="rounded-2xl border border-amber-500/18 bg-amber-500/8 px-4 py-3">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Analyst Note
              </div>
              <p className="mt-2 text-sm leading-relaxed text-amber-100/90">{result.notes}</p>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

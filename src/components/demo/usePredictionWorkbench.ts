import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type DragEvent,
  type SetStateAction,
} from 'react';
import {
  fetchApiHealth,
  fetchApiReadiness,
  predictImage,
  type ApiHealthResponse,
  type ApiReadinessResponse,
  type PredictResponse,
} from '../../lib/api';
import {
  DEFAULT_DEMO_SCENARIO,
  getDemoResult,
  getDemoScenario,
  type DemoKey,
  type DemoScenario,
} from '../../lib/demo';
import { readFileAsDataUrl } from '../product';
import type { AnalysisPhase, DisplayMode, Mode } from '../product';

export type DataSource = 'demo' | 'live';
export type LiveApiStatus = 'checking' | 'online' | 'offline';
export type LiveReadinessState =
  | 'idle'
  | 'checking'
  | 'ready'
  | 'warming'
  | 'not_ready'
  | 'offline';

function getErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Request cancelled.';
  }

  if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
    return 'Live API unavailable on http://localhost:8080. Start both services with "npm run start".';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Live inference request failed.';
}

function resolveReadinessState(
  health: ApiHealthResponse | null,
  readiness: ApiReadinessResponse | null,
  online: boolean
): LiveReadinessState {
  if (!online) {
    return 'offline';
  }

  if (readiness?.ready) {
    return 'ready';
  }

  if (health?.services.hnsw_index.status === 'warming') {
    return 'warming';
  }

  return readiness ? 'not_ready' : 'idle';
}

interface RefreshEnvironmentOptions {
  checkReadiness?: boolean;
  markChecking?: boolean;
}

export interface PredictionWorkbench {
  activeScenario: DemoScenario;
  activeScenarioId: DemoKey;
  copied: boolean;
  dataSource: DataSource;
  displayMode: DisplayMode;
  errorMsg: string;
  file: File | null;
  healthData: ApiHealthResponse | null;
  liveApiStatus: LiveApiStatus;
  liveReadiness: LiveReadinessState;
  liveStatusText: string;
  mode: Mode;
  phase: AnalysisPhase;
  previewUrl: string | null;
  readinessData: ApiReadinessResponse | null;
  result: PredictResponse | null;
  scanProgress: number;
  warningMsg: string;
  applyScenario: (scenarioId: DemoKey, modeOverride?: Mode) => void;
  copyCoords: () => void;
  clearAll: () => void;
  handleAnalyze: () => Promise<void>;
  handleDataSourceChange: (value: DataSource) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
  processFile: (selected: File) => void;
  setDisplayMode: Dispatch<SetStateAction<DisplayMode>>;
  setMode: Dispatch<SetStateAction<Mode>>;
  toggleDisplayMode: () => void;
}

export function usePredictionWorkbench(): PredictionWorkbench {
  const [healthData, setHealthData] = useState<ApiHealthResponse | null>(null);
  const [readinessData, setReadinessData] = useState<ApiReadinessResponse | null>(null);
  const [liveApiStatus, setLiveApiStatus] = useState<LiveApiStatus>('checking');
  const [liveReadiness, setLiveReadiness] = useState<LiveReadinessState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('accurate');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('operator-safe');
  const [dataSource, setDataSource] = useState<DataSource>('demo');
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeScenarioId, setActiveScenarioId] = useState<DemoKey>(DEFAULT_DEMO_SCENARIO);
  const abortRef = useRef<AbortController | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const previewIsObjectRef = useRef(false);

  const replacePreviewUrl = useCallback((nextUrl: string | null, isObjectUrl: boolean) => {
    if (previewUrlRef.current && previewIsObjectRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    previewUrlRef.current = nextUrl;
    previewIsObjectRef.current = isObjectUrl;
    setPreviewUrl(nextUrl);
  }, []);

  const activeScenario = getDemoScenario(activeScenarioId);

  const liveStatusText =
    liveApiStatus === 'offline'
      ? 'Backend offline'
      : liveReadiness === 'ready'
        ? 'Live API ready'
        : liveReadiness === 'warming'
          ? 'Index warming'
          : liveReadiness === 'checking'
            ? 'Checking readiness'
            : liveReadiness === 'not_ready'
              ? 'Backend online, not ready'
              : 'Backend online';

  const applyScenario = useCallback((scenarioId: DemoKey, modeOverride?: Mode) => {
    const scenario = getDemoScenario(scenarioId);
    const scenarioMode = modeOverride ?? scenario.defaultMode;

    abortRef.current?.abort();
    setActiveScenarioId(scenario.id);
    setDataSource('demo');
    setFile(null);
    replacePreviewUrl(scenario.imageSrc, false);
    setMode(scenarioMode);
    setDisplayMode('operator-safe');
    setPhase('complete');
    setErrorMsg('');
    setWarningMsg('Replay mode active. Switch to Live API to test local inference.');
    setResult(getDemoResult(scenario.id, scenarioMode));
  }, [replacePreviewUrl]);

  const refreshEnvironment = useCallback(async ({
    checkReadiness = false,
    markChecking = false,
  }: RefreshEnvironmentOptions = {}) => {
    try {
      const health = await fetchApiHealth();
      setHealthData(health);
      setLiveApiStatus('online');

      if (!checkReadiness) {
        return {
          online: true,
          readiness: 'idle' as const,
        };
      }

      if (markChecking) {
        setLiveReadiness((current) => (current === 'ready' ? current : 'checking'));
      }
      try {
        const readiness = await fetchApiReadiness();
        setReadinessData(readiness);
        const nextReadiness = resolveReadinessState(health, readiness, true);
        setLiveReadiness(nextReadiness);
        return {
          online: true,
          readiness: nextReadiness,
        };
      } catch (error) {
        setReadinessData({
          ready: false,
          reason: getErrorMessage(error),
        });
        const nextReadiness = resolveReadinessState(health, { ready: false }, true);
        setLiveReadiness(nextReadiness);
        return {
          online: true,
          readiness: nextReadiness,
        };
      }
    } catch {
      setHealthData(null);
      setReadinessData(null);
      setLiveApiStatus('offline');
      setLiveReadiness('offline');
      return {
        online: false,
        readiness: 'offline' as const,
      };
    }
  }, []);

  useEffect(() => {
    if (phase === 'scanning' || phase === 'processing') {
      const interval = window.setInterval(() => {
        setScanProgress((prev) => {
          const next = prev + Math.random() * 15;
          return next >= 100 ? 100 : next;
        });
      }, 200);
      return () => window.clearInterval(interval);
    }

    setScanProgress(0);
    return undefined;
  }, [phase]);

  useEffect(() => {
    applyScenario(DEFAULT_DEMO_SCENARIO);

    return () => {
      abortRef.current?.abort();
      if (previewUrlRef.current && previewIsObjectRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, [applyScenario]);

  useEffect(() => {
    void refreshEnvironment({ checkReadiness: dataSource === 'live' });
    const interval = window.setInterval(() => {
      void refreshEnvironment({ checkReadiness: dataSource === 'live' });
    }, 5000);

    return () => window.clearInterval(interval);
  }, [dataSource, refreshEnvironment]);

  const processFile = useCallback((selected: File) => {
    if (selected.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds 10MB limit');
      setPhase('error');
      return;
    }

    const objectUrl = URL.createObjectURL(selected);
    setDataSource('live');
    setFile(selected);
    setPhase('idle');
    setResult(null);
    setErrorMsg('');
    setWarningMsg(
      liveApiStatus === 'online'
        ? 'Live image ready. Run local inference when the stack is ready.'
        : 'Live image staged. Start the backend to run local inference.'
    );
    replacePreviewUrl(objectUrl, true);
  }, [liveApiStatus, replacePreviewUrl]);

  const clearAll = useCallback(() => {
    abortRef.current?.abort();

    if (dataSource === 'demo') {
      applyScenario(activeScenarioId, mode);
      return;
    }

    setFile(null);
    replacePreviewUrl(null, false);
    setPhase('idle');
    setErrorMsg('');
    setWarningMsg('Live image cleared. Replay mode is still available below.');
    setResult(null);
  }, [activeScenarioId, applyScenario, dataSource, mode, replacePreviewUrl]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = e.dataTransfer.files[0];

    if (dropped?.type.startsWith('image/')) {
      processFile(dropped);
      return;
    }

    setErrorMsg('Please upload a valid image file (JPEG, PNG, WebP)');
    setPhase('error');
  }, [processFile]);

  const handleDataSourceChange = useCallback((value: DataSource) => {
    setErrorMsg('');
    setDataSource(value);

    if (value === 'demo') {
      applyScenario(activeScenarioId, mode);
      return;
    }

    setPhase('idle');
    setResult(null);
    if (!file) {
      replacePreviewUrl(null, false);
    }
    setWarningMsg('Checking local services...');
    void refreshEnvironment({ checkReadiness: true, markChecking: true }).then((environment) => {
      if (!environment?.online) {
        setWarningMsg('Backend offline. Replay mode remains available.');
        return;
      }

      if (environment.readiness === 'ready') {
        setWarningMsg('Live API connected. Ready for local inference.');
        return;
      }

      setWarningMsg('Backend online but still warming. Replay mode remains available.');
    });
  }, [activeScenarioId, applyScenario, file, mode, refreshEnvironment, replacePreviewUrl]);

  const handleAnalyze = useCallback(async () => {
    if (dataSource === 'demo') {
      applyScenario(activeScenarioId, mode);
      return;
    }

    if (liveApiStatus !== 'online' || liveReadiness !== 'ready') {
      setErrorMsg('Live API is not ready yet. Wait for readiness or use replay mode.');
      setPhase('error');
      return;
    }

    if (!file) {
      setErrorMsg('Upload an image to begin analysis');
      setPhase('error');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('uploading');
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    setPhase('scanning');
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setPhase('processing');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const base64 = dataUrl.split(',')[1] ?? '';
      const response = await predictImage(
        { image_base64: base64, options: { mode } },
        controller.signal
      );

      setResult(response);
      setPhase('complete');
      setErrorMsg('');
      setWarningMsg(
        response.status === 'low_confidence'
          ? response.notes ?? 'Low-confidence prediction. Try another image or clearer landmarks.'
          : ''
      );
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setResult(null);
      setWarningMsg('');
      setErrorMsg(getErrorMessage(error));
      setPhase('error');
    }
  }, [activeScenarioId, applyScenario, dataSource, file, liveApiStatus, liveReadiness, mode]);

  const copyCoords = useCallback(() => {
    if (!result) {
      return;
    }

    const text = `${result.location.lat.toFixed(6)}, ${result.location.lon.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((prev) => (prev === 'operator-safe' ? 'review' : 'operator-safe'));
  }, []);

  return {
    activeScenario,
    activeScenarioId,
    copied,
    dataSource,
    displayMode,
    errorMsg,
    file,
    healthData,
    liveApiStatus,
    liveReadiness,
    liveStatusText,
    mode,
    phase,
    previewUrl,
    readinessData,
    result,
    scanProgress,
    warningMsg,
    applyScenario,
    copyCoords,
    clearAll,
    handleAnalyze,
    handleDataSourceChange,
    handleDragOver,
    handleDrop,
    processFile,
    setDisplayMode,
    setMode,
    toggleDisplayMode,
  };
}

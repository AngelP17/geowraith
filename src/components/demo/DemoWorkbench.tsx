import { MapView, ResultsPanel, ImageUploadPanel } from '../product';
import { DemoScenarioStrip } from './DemoScenarioStrip';
import { DemoStatusRail } from './DemoStatusRail';
import type { DemoKey } from '../../lib/demo';
import type { Mode } from '../product';
import type { PredictionWorkbench } from './usePredictionWorkbench';

interface DemoWorkbenchProps {
  workbench: PredictionWorkbench;
  onScenarioSelect: (scenarioId: DemoKey, mode?: Mode) => void;
}

export function DemoWorkbench({ workbench, onScenarioSelect }: DemoWorkbenchProps) {
  return (
    <div data-testid="demo-workbench" className="grid gap-5 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,1.14fr)_340px]">
      <div className="order-1 space-y-5">
        <ImageUploadPanel
          file={workbench.file}
          previewUrl={workbench.previewUrl}
          mode={workbench.mode}
          dataSource={workbench.dataSource}
          liveApiStatus={workbench.liveApiStatus}
          liveReadiness={workbench.liveReadiness}
          liveStatusText={workbench.liveStatusText}
          phase={workbench.phase}
          errorMsg={workbench.errorMsg}
          warningMsg={workbench.warningMsg}
          scanProgress={workbench.scanProgress}
          onFileSelect={workbench.processFile}
          onModeChange={workbench.setMode}
          onDataSourceChange={workbench.handleDataSourceChange}
          onAnalyze={workbench.handleAnalyze}
          onClear={workbench.clearAll}
          onDragOver={workbench.handleDragOver}
          onDrop={workbench.handleDrop}
        />
        <DemoScenarioStrip
          activeScenarioId={workbench.activeScenarioId}
          onSelect={onScenarioSelect}
        />
      </div>

      <div className="order-2 flex flex-col gap-5">
        <div className="order-2 xl:order-1">
          <MapView
            result={workbench.result}
            displayMode={workbench.displayMode}
          />
        </div>
        <div className="order-1 xl:order-2">
          <ResultsPanel
            mode={workbench.mode}
            displayMode={workbench.displayMode}
            phase={workbench.phase}
            result={workbench.result}
            originalImage={workbench.previewUrl ?? undefined}
            copied={workbench.copied}
            onCopy={workbench.copyCoords}
            onToggleDisplayMode={workbench.toggleDisplayMode}
            showMap={false}
          />
        </div>
      </div>

      <div className="order-3">
        <DemoStatusRail
          activeScenario={workbench.activeScenario}
          dataSource={workbench.dataSource}
          healthData={workbench.healthData}
          liveApiStatus={workbench.liveApiStatus}
          liveReadiness={workbench.liveReadiness}
          readinessData={workbench.readinessData}
          result={workbench.result}
        />
      </div>
    </div>
  );
}

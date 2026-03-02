import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((module) => ({ default: module.LandingPage }))
);
const DemoPage = lazy(() =>
  import('./pages/DemoPage').then((module) => ({ default: module.DemoPage }))
);

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050607] text-sm font-mono uppercase tracking-[0.28em] text-white/45">
          Loading GeoWraith
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

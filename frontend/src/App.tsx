import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SessionPage } from './pages/SessionPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/s/:token" element={<LandingPage />} />
        <Route path="/session/:token" element={<SessionPage />} />
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-zinc-100 mb-2">The Thinking Foundry</h1>
              <p className="text-zinc-500">You need a session link to get started.</p>
              <p className="text-zinc-600 text-sm mt-4">Ask your session host for a link.</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

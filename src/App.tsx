import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthGate } from './components/AuthGate';
import { useStorageRevision } from './hooks/useStorageRevision';
import { HomePage } from './pages/HomePage';
import { ReaderPage } from './pages/ReaderPage';
import { SettingsPage } from './pages/SettingsPage';
import { getSettings, settingsStorageKey } from './services/settings';

function ThemeController() {
  useStorageRevision(settingsStorageKey);
  const [systemDark, setSystemDark] = useState(matchMedia('(prefers-color-scheme: dark)').matches);
  const settings = getSettings();

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme === 'system' ? (systemDark ? 'dark' : 'light') : settings.theme;
  }, [settings.theme, systemDark]);
  return null;
}

export default function App() {
  return <AuthGate>
    <ThemeController />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/category/*" element={<HomePage />} />
      <Route path="/reader/*" element={<ReaderPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AuthGate>;
}

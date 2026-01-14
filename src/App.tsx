import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import {
  Dashboard,
  Bills,
  Income,
  Expenses,
  Savings,
  Loans,
  Analytics,
  Reports,
  Settings,
} from './pages';
import { PinLock } from './components/shared/PinLock';
import { useAppStore } from './stores/useAppStore';
import './index.css';

function App() {
  const [hydrated, setHydrated] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const { settings } = useAppStore();

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Apply dark mode on load
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <p style={{ color: '#475569' }}>Loading MoneyTrunk...</p>
      </div>
    );
  }

  // Show PIN lock if enabled and not unlocked
  if (settings.pinEnabled && !unlocked) {
    return <PinLock onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="bills" element={<Bills />} />
          <Route path="income" element={<Income />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="savings" element={<Savings />} />
          <Route path="loans" element={<Loans />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;

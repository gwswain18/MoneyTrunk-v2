import { useState, useEffect, useRef } from 'react';
import { Lock, Delete } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useAppStore } from '../../stores/useAppStore';

interface PinLockProps {
  onUnlock: () => void;
}

export const PinLock: React.FC<PinLockProps> = ({ onUnlock }) => {
  const { settings } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');

      // Check PIN when 4 digits entered
      if (newPin.length === 4) {
        const hashedInput = CryptoJS.SHA256(newPin).toString();
        if (hashedInput === settings.pinHash) {
          onUnlock();
        } else {
          setShake(true);
          setError('Incorrect PIN');
          setTimeout(() => {
            setPin('');
            setShake(false);
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      handleDigit(e.key);
    } else if (e.key === 'Backspace') {
      handleDelete();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900">
      <div className="w-full max-w-sm p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MoneyTrunk</h1>
          <p className="mt-2 text-slate-400">Enter your PIN to unlock</p>
        </div>

        {/* PIN dots */}
        <div
          className={`mb-8 flex justify-center gap-4 ${shake ? 'animate-shake' : ''}`}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-all ${
                pin.length > i
                  ? 'bg-emerald-500 scale-110'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <p className="mb-4 text-center text-sm text-red-400">{error}</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(
            (key) => {
              if (key === '') return <div key="empty" />;
              if (key === 'del') {
                return (
                  <button
                    key="del"
                    onClick={handleDelete}
                    className="flex h-16 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-800"
                  >
                    <Delete className="h-6 w-6" />
                  </button>
                );
              }
              return (
                <button
                  key={key}
                  onClick={() => handleDigit(key)}
                  className="flex h-16 items-center justify-center rounded-full bg-slate-800 text-2xl font-semibold text-white transition-colors hover:bg-slate-700 active:bg-emerald-600"
                >
                  {key}
                </button>
              );
            }
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-10px); }
          40%, 80% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

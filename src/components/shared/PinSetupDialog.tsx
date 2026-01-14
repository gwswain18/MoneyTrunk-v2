import { useState } from 'react';
import CryptoJS from 'crypto-js';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useAppStore } from '../../stores/useAppStore';

interface PinSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PinSetupDialog: React.FC<PinSetupDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { settings, updateSettings } = useAppStore();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const isDisabling = settings.pinEnabled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isDisabling) {
      // Verify current PIN to disable
      const hashedInput = CryptoJS.SHA256(pin).toString();
      if (hashedInput === settings.pinHash) {
        updateSettings({ pinEnabled: false, pinHash: undefined });
        onOpenChange(false);
        resetForm();
      } else {
        setError('Incorrect PIN');
      }
    } else if (step === 'enter') {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        setError('PIN must be exactly 4 digits');
        return;
      }
      setStep('confirm');
    } else {
      if (pin !== confirmPin) {
        setError('PINs do not match');
        return;
      }
      const hashedPin = CryptoJS.SHA256(pin).toString();
      updateSettings({ pinEnabled: true, pinHash: hashedPin });
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setStep('enter');
    setPin('');
    setConfirmPin('');
    setError('');
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogClose onClose={handleClose} />
      <DialogHeader>
        <DialogTitle>
          {isDisabling ? 'Disable PIN Lock' : step === 'enter' ? 'Set Up PIN Lock' : 'Confirm PIN'}
        </DialogTitle>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isDisabling
              ? 'Enter your current PIN to disable the lock.'
              : step === 'enter'
              ? 'Create a 4-digit PIN to secure your app.'
              : 'Enter your PIN again to confirm.'}
          </p>

          <Input
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            placeholder="••••"
            value={step === 'confirm' ? confirmPin : pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              if (step === 'confirm') {
                setConfirmPin(val);
              } else {
                setPin(val);
              }
              setError('');
            }}
            error={error}
            autoFocus
            className="text-center text-2xl tracking-widest"
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {isDisabling ? 'Disable PIN' : step === 'enter' ? 'Next' : 'Enable PIN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

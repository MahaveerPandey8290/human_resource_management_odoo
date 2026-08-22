import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, AlertCircle } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import * as authService from '@/services/auth.service';
import { useToast } from '@/context/ToastContext';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!oldPw || !newPw) { setError('All fields are required.'); return; }
    if (newPw.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const res = await authService.changePassword(oldPw, newPw);
    setLoading(false);
    if (res.success) {
      toast('Password changed successfully.', 'success');
      navigate('/employees');
    } else {
      setError(res.error?.message || 'Could not change password.');
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-h2 sm:text-h1 font-bold text-ink-primary tracking-tight">Change your password</h1>
          <p className="text-body text-ink-secondary mt-1.5">
            Your temporary password must be replaced before you can continue.
          </p>
        </div>

        <div className="flex gap-2.5 items-start bg-warning-tint border border-warning/20 rounded-xl px-3.5 py-3 mb-5">
          <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-small text-ink-secondary">
            For security, your system-generated password expires on first use.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Current password" type="password" icon={Lock} value={oldPw} onChange={(e) => setOldPw(e.target.value)} autoFocus />
          <Input label="New password" type="password" icon={Lock} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          <Input label="Confirm new password" type="password" icon={Lock} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-small text-danger bg-danger-tint border border-danger/20 rounded-input px-3.5 py-2.5"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-2 py-2.5 text-body font-semibold">
            Update password
          </Button>
        </form>
      </motion.div>
    </AuthLayout>
  );
}

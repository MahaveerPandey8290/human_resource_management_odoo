/**
 * Sign In page — handles employee and admin authentication.
 *
 * Accepts either a Login ID (e.g. OIJODO20220001) or a work email.
 * Wrong credentials shake the card horizontally and show an inline error.
 *
 * After a successful sign-in, users who must change their password
 * (first login) are redirected to /change-password automatically.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import BackgroundBlobs from '@/components/BackgroundBlobs';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export default function SignInPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast }  = useToast();

  const [identifier,    setIdentifier]    = useState('');
  const [password,      setPassword]      = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [error,         setError]         = useState('');
  const [shake,         setShake]         = useState(false);
  const [loading,       setLoading]       = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier.trim() || !password) {
      setError('Please enter your Login ID / Email and password.');
      triggerShake();
      return;
    }

    setError('');
    setLoading(true);

    const res = await signIn(identifier.trim(), password);

    setLoading(false);

    if (res.success) {
      toast('Welcome back!', 'success');

      // If the user must change their password on first login, send them there
      const mustChange = res.data?.user?.mustChangePassword;
      navigate(mustChange ? '/change-password' : '/employees');
    } else {
      setError(res.error?.message || 'Invalid credentials. Please try again.');
      triggerShake();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <BackgroundBlobs />

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <span className="font-semibold text-ink-primary text-h3">Dayflow</span>
      </Link>

      {/* Card — shakes horizontally on wrong credentials */}
      <motion.div
        animate={shake ? { x: [0, -12, 12, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="bg-surface border border-border rounded-card shadow-lg p-8">
          <h1 className="text-h2 font-semibold text-ink-primary text-center">Sign in</h1>
          <p className="text-body text-ink-secondary text-center mt-1.5 mb-7">
            Enter your Login ID or work email to continue.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Login ID or Email */}
            <Input
              label="Login ID / Email"
              placeholder="OIJODO20220001 or john@company.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              icon={Mail}
              autoFocus
              autoComplete="username"
            />

            {/* Password with show/hide toggle */}
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-[34px] text-ink-muted hover:text-ink-primary transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4" />
                  : <Eye className="w-4 h-4" />
                }
              </button>
            </div>

            {/* Inline error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-small text-danger bg-danger-tint rounded-input px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-1">
              Sign in
            </Button>
          </form>

          <p className="text-center text-small text-ink-muted mt-5">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

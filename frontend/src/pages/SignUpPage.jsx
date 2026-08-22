import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, User, Mail, Phone, Lock, UploadCloud, Check } from 'lucide-react';
import BackgroundBlobs from '@/components/BackgroundBlobs';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

function strengthScore(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

const strengthLabels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColors = ['#EF4444', '#F59E0B', '#F59E0B', '#0EA5E9', '#16A34A'];

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    companyName: '', name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required.';
    if (!form.name.trim()) e.name = 'Your name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    if (!form.password) e.password = 'Password is required.';
    else if (strengthScore(form.password) < 3) e.password = 'Use at least 8 characters with a number and symbol.';
    if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const res = await signUp(form);
    setLoading(false);
    if (res.success) {
      toast('Company account created. Welcome!', 'success');
      navigate('/employees');
    } else {
      toast(res.error?.message || 'Sign up failed.', 'error');
    }
  };

  const strength = strengthScore(form.password);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <BackgroundBlobs />

      <Link to="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-white font-bold">D</span>
        </div>
        <span className="font-semibold text-ink-primary text-h3">Dayflow</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-card shadow-lg p-8">
          <h1 className="text-h2 font-semibold text-ink-primary text-center">Create your company</h1>
          <p className="text-body text-ink-secondary text-center mt-2 mb-6">
            Register your company and become its first admin. Employees are added from inside the app.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Logo dropzone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-label font-medium uppercase tracking-wide text-ink-secondary">Company logo</label>
              <label className="flex items-center gap-3 p-3 border-2 border-dashed border-border-strong rounded-input cursor-pointer hover:border-primary/50 hover:bg-sunken/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary-tint flex items-center justify-center overflow-hidden">
                  {logo ? <img src={logo} alt="" className="w-full h-full object-cover" /> : <UploadCloud className="w-5 h-5 text-primary" />}
                </div>
                <span className="text-small text-ink-secondary">{logo ? 'Logo selected' : 'Click to upload (optional)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) setLogo(URL.createObjectURL(f));
                  }}
                />
              </label>
            </div>

            <Input label="Company name" placeholder="Odoo India" icon={Building2} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} error={errors.companyName} />
            <Input label="Your name" placeholder="Adarsh Reddy" icon={User} value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
            <Input label="Email" type="email" placeholder="you@company.com" icon={Mail} value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
            <Input label="Phone" placeholder="+91 98450 00000" icon={Phone} value={form.phone} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />

            <div>
              <Input label="Password" type="password" placeholder="Min 8 characters" icon={Lock} value={form.password} onChange={(e) => set('password', e.target.value)} error={errors.password} />
              <AnimatePresence>
                {form.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{ background: i < strength ? strengthColors[strength] : '#ECEEF3' }}
                        />
                      ))}
                    </div>
                    <p className="text-small text-ink-muted mt-1">{strengthLabels[strength]}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Input label="Confirm password" type="password" placeholder="Re-enter password" icon={Lock} value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} error={errors.confirmPassword} />

            <Button type="submit" loading={loading} className="w-full mt-2">Create company account</Button>
          </form>

          <p className="text-center text-small text-ink-muted mt-5">
            Already have an account?{' '}
            <Link to="/signin" className="text-primary font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

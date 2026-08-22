import { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Users, CalendarClock, CalendarOff, Wallet, ShieldCheck, Zap, ArrowRight } from 'lucide-react';
import BackgroundBlobs from '@/components/BackgroundBlobs';
import { ScrollReveal, ScrollRevealItem } from '@/components/ScrollReveal';
import AnimatedCounter from '@/components/AnimatedCounter';
import { easeOut } from '@/lib/motion';
import { useEffect, useState } from 'react';

const features = [
  { icon: Users, title: 'Employee directory', desc: 'A clean, searchable grid of everyone in your company with live presence status.' },
  { icon: CalendarClock, title: 'Attendance tracking', desc: 'Daily check-ins, work hours and extra hours calculated automatically.' },
  { icon: CalendarOff, title: 'Time off & approvals', desc: 'Leave requests with allocations, year calendar and one-click approvals.' },
  { icon: Wallet, title: 'Salary structure', desc: 'Components recompute live as wages change, with PF and tax deductions.' },
  { icon: ShieldCheck, title: 'Role-based access', desc: 'Admin, HR and employee roles see exactly what they should — nothing more.' },
  { icon: Zap, title: 'Instant onboarding', desc: 'Generate a Login ID and temporary password the moment a new employee joins.' },
];

const stats = [
  { value: 10, suffix: 'employees', label: 'Seed team' },
  { value: 4, suffix: 'departments', label: 'Organised' },
  { value: 3, suffix: 'leave types', label: 'Allocated' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const previewRotate = useTransform(scrollYProgress, [0, 1], [6, 0]);
  const previewY = useTransform(scrollYProgress, [0, 1], [60, -20]);
  const previewScale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen relative">
      <BackgroundBlobs />

      {/* Scroll progress */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent z-50 scroll-progress"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled ? 'bg-white/85 backdrop-blur-md border-b border-border shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-shell mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-ink-primary">Dayflow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/signin" className="text-body font-medium text-ink-secondary hover:text-ink-primary px-4 py-2 transition-colors">
              Sign in
            </Link>
            <button
              onClick={() => navigate('/signup')}
              className="h-9 px-4 rounded-input bg-primary text-white text-body font-medium hover:bg-primary-hover transition-colors shadow-sm"
            >
              Get started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="max-w-shell mx-auto px-6 pt-20 pb-12 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill bg-primary-tint text-primary text-small font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            HRMS · Frontend demo
          </span>
          <h1 className="text-display font-semibold text-ink-primary max-w-3xl mx-auto leading-[1.1]">
            Every workday, perfectly aligned.
          </h1>
          <p className="text-h3 text-ink-secondary mt-6 max-w-2xl mx-auto font-normal leading-relaxed">
            Onboarding, attendance, time off and payroll — all in one calm, beautiful place.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => navigate('/signup')}
              className="h-12 px-6 rounded-input bg-gradient-to-r from-primary to-accent text-white text-body font-medium hover:opacity-90 transition-opacity shadow-md"
            >
              Get started free
            </button>
            <Link
              to="/signin"
              className="h-12 px-6 rounded-input bg-white border border-border-strong text-ink-primary text-body font-medium hover:bg-sunken transition-colors"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        {/* Floating product preview */}
        <motion.div
          style={{ rotate: previewRotate, y: previewY, scale: previewScale }}
          className="mt-16 mx-auto max-w-4xl"
        >
          <div className="bg-white rounded-card border border-border shadow-lg overflow-hidden">
            <div className="h-9 bg-raised border-b border-border flex items-center gap-1.5 px-4">
              <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
            </div>
            <div className="p-4 bg-page grid grid-cols-2 sm:grid-cols-3 gap-3">
              {['Adarsh Reddy', 'Nipun Uniyal', 'Ananya Nair', 'Kabir Joseph', 'Riya Kapoor', 'Dev Iyer'].map((name, i) => (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.4, ease: easeOut }}
                  className="bg-white rounded-card border border-border p-3 flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold">
                    {name.split(' ').map((p) => p[0]).join('')}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-small font-medium text-ink-primary truncate">{name}</p>
                    <p className="text-[11px] text-ink-muted truncate">{['CEO', 'HR Manager', 'Engineer', 'Engineer', 'Sales Lead', 'Sales'][i]}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${['bg-success', 'bg-success', 'bg-success', 'bg-info', 'bg-success', 'bg-success'][i]}`} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-shell mx-auto px-6 py-20">
        <ScrollReveal>
          <ScrollRevealItem>
            <div className="text-center mb-12">
              <h2 className="text-h1 font-semibold text-ink-primary">Everything for your people</h2>
              <p className="text-body text-ink-secondary mt-3">Six core modules, one consistent interface.</p>
            </div>
          </ScrollRevealItem>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <ScrollRevealItem key={f.title}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2, ease: easeOut }}
                  className="h-full bg-surface border border-border rounded-card p-6 hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-card bg-primary-tint flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-h3 font-semibold text-ink-primary mb-2">{f.title}</h3>
                  <p className="text-body text-ink-secondary leading-relaxed">{f.desc}</p>
                </motion.div>
              </ScrollRevealItem>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Stats strip */}
      <section className="max-w-shell mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-primary to-accent rounded-card p-10 flex flex-col sm:flex-row items-center justify-around gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center text-white">
              <div className="text-h1 font-semibold">
                <AnimatedCounter value={s.value} /> <span className="text-h3 font-normal opacity-90">{s.suffix}</span>
              </div>
              <div className="text-small uppercase tracking-wide opacity-80 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-shell mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-h1 font-semibold text-ink-primary">How it works</h2>
        </div>
        <div className="relative">
          <motion.div
            className="absolute top-7 left-[16%] right-[16%] h-0.5 bg-primary/20"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: easeOut }}
            style={{ originX: 0 }}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              { n: '01', title: 'Create your company', desc: 'Sign up with your company name and invite your first admin.' },
              { n: '02', title: 'Add your team', desc: 'Onboard employees with auto-generated Login IDs and temp passwords.' },
              { n: '03', title: 'Manage every day', desc: 'Track attendance, approve time off and manage payroll — all in one place.' },
            ].map((step, i) => (
              <ScrollRevealItem key={step.n}>
                <div className="text-center">
                  <motion.div
                    className="w-14 h-14 rounded-full bg-white border-2 border-primary text-primary font-semibold text-h3 flex items-center justify-center mx-auto relative z-10"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {step.n}
                  </motion.div>
                  <h3 className="text-h3 font-semibold text-ink-primary mt-5">{step.title}</h3>
                  <p className="text-body text-ink-secondary mt-2 max-w-xs mx-auto">{step.desc}</p>
                </div>
              </ScrollRevealItem>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-surface/60">
        <div className="max-w-shell mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="font-semibold text-ink-primary">Dayflow</span>
          </div>
          <p className="text-small text-ink-muted">Every workday, perfectly aligned.</p>
        </div>
      </footer>
    </div>
  );
}

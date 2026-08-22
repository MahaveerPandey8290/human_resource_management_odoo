import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundBlobs from '@/components/BackgroundBlobs';

export default function AuthLayout({
  children,
  bannerImage = '/auth-banner.jpg',
  bannerAlt = 'Dayflow - Human Resource Management',
  cardMaxWidth = 'max-w-5xl',
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 relative selection:bg-primary selection:text-white">
      <BackgroundBlobs />

      {/* Main Dual-Column Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={`w-full ${cardMaxWidth} bg-surface border border-border rounded-3xl shadow-xl overflow-hidden`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
          {/* Left Column: Graphic Showcase */}
          <div className="lg:col-span-6 bg-gradient-to-br from-[#EBF4F6] via-[#E4EFF2] to-[#D5E6EB] relative flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-border/80">
            {/* Ambient decorative background glow */}
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-teal-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-primary-tint/50 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full h-full relative flex items-center justify-center p-4 sm:p-6 lg:p-8">
              <img
                src={bannerImage}
                alt={bannerAlt}
                className="w-full h-full max-h-[480px] lg:max-h-[680px] object-contain rounded-2xl shadow-sm select-none"
                loading="eager"
              />
            </div>
          </div>

          {/* Right Column: Form Area */}
          <div className="lg:col-span-6 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-surface">
            {/* Header / Brand */}
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <Link to="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <span className="font-semibold text-ink-primary text-h3 tracking-tight">Dayflow</span>
              </Link>

              <Link
                to="/"
                className="text-xs font-medium text-ink-muted hover:text-ink-primary transition-colors px-2.5 py-1 rounded-full border border-border hover:border-border-strong bg-sunken/50"
              >
                Back to home
              </Link>
            </div>

            {/* Form Slot */}
            <div className="flex-1 flex flex-col justify-center">
              {children}
            </div>

            {/* Bottom branding / security badge */}
            <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-ink-muted">
              <span>Dayflow HRMS &copy; {new Date().getFullYear()}</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Secure Enterprise Portal
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

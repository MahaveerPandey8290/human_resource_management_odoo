import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundBlobs from '@/components/BackgroundBlobs';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <BackgroundBlobs />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-[120px] font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-accent leading-none"
        >
          404
        </motion.div>
        <h1 className="text-h2 font-semibold text-ink-primary mt-2">Page not found</h1>
        <p className="text-body text-ink-secondary mt-2 mb-6">The page you're looking for doesn't exist or has moved.</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-input bg-primary text-white text-body font-medium hover:bg-primary-hover transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          Back home
        </Link>
      </motion.div>
    </div>
  );
}

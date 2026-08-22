import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useReducer } from 'react';
import TopNav from '@/components/TopNav';
import BackgroundBlobs from '@/components/BackgroundBlobs';

export default function AppShell() {
  const location = useLocation();
  const [search, setSearch] = useReducer((_, v) => v, '');

  return (
    <div className="min-h-screen flex flex-col">
      <BackgroundBlobs dimmed />
      <TopNav search={search} onSearchChange={setSearch} />
      <main className="flex-1 max-w-shell w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet context={{ search, setSearch }} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Search, User, LogOut, Menu, X, Users, CalendarClock, CalendarOff } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown';
import CheckInWidget from '@/components/CheckInWidget';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

const navItems = [
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: CalendarClock },
  { to: '/time-off', label: 'Time Off', icon: CalendarOff },
];

export default function TopNav({ search, onSearchChange }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(search || '');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => onSearchChange?.(localSearch), 200);
    return () => clearTimeout(t);
  }, [localSearch, onSearchChange]);

  const handleSignOut = async () => {
    await signOut();
    toast('Signed out successfully.', 'info');
    navigate('/signin');
  };

  // The backend /auth/me returns the employee fields directly on the user object
  const employee = user;

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled ? 'bg-white/85 backdrop-blur-md border-b border-border shadow-sm' : 'bg-white/60 backdrop-blur-sm border-b border-transparent'
        }`}
      >
        <div className="max-w-shell mx-auto px-6 h-16 flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-ink-primary hidden sm:block">Dayflow</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 relative">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-body font-medium rounded-input transition-colors ${
                    isActive ? 'text-primary' : 'text-ink-secondary hover:text-ink-primary hover:bg-sunken/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-primary-tint rounded-input"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1" />

          {/* Search */}
          <div className="hidden lg:block w-48 xl:w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-9 pl-10 pr-3 rounded-input bg-sunken border border-transparent text-small text-ink-primary placeholder:text-ink-muted focus-ring focus:bg-white focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Check-in widget */}
          {employee && <div className="hidden sm:block">          <CheckInWidget /></div>}

          {/* Avatar dropdown */}
          {employee && (
            <Dropdown
              trigger={
                <button className="flex items-center gap-2 p-1 pr-2 rounded-pill hover:bg-sunken transition-colors focus-ring">
                  <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.avatarUrl} size="sm" />
                  <span className="hidden sm:block text-small font-medium text-ink-primary max-w-[100px] truncate">
                    {employee.firstName}
                  </span>
                </button>
              }
            >
              <div className="px-3.5 py-2.5 border-b border-border mb-1">
                <p className="text-body font-medium text-ink-primary">{employee.firstName} {employee.lastName}</p>
                <p className="text-small text-ink-muted">{employee.workEmail}</p>
              </div>
              <DropdownItem icon={User} onClick={() => navigate('/me')}>My Profile</DropdownItem>
              <DropdownItem icon={LogOut} onClick={handleSignOut} danger>Log Out</DropdownItem>
            </Dropdown>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-lg text-ink-secondary hover:bg-sunken"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-ink-primary/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-surface flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-semibold text-ink-primary">Menu</span>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-sunken">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex flex-col p-3 gap-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-input text-body font-medium transition-colors ${
                        isActive ? 'bg-primary-tint text-primary' : 'text-ink-secondary hover:bg-sunken'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              {employee && (
                <div className="mt-auto p-4 border-t border-border flex flex-col gap-3">
                            <CheckInWidget />
                  <button onClick={handleSignOut} className="flex items-center gap-2 text-body text-danger font-medium">
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

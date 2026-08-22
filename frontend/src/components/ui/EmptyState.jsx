import { PackageOpen } from 'lucide-react';

export default function EmptyState({ icon: Icon = PackageOpen, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-16 px-6 ${className}`}>
      <div className="w-16 h-16 rounded-card bg-sunken flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-ink-muted" />
      </div>
      <h3 className="text-h3 font-semibold text-ink-primary mb-1">{title}</h3>
      {description && <p className="text-body text-ink-secondary max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

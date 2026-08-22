export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-surface border border-border rounded-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

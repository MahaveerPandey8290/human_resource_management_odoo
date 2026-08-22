export default function Skeleton({ className = '', rounded = 'rounded-lg' }) {
  return <div className={`skeleton-shimmer ${rounded} ${className}`} />;
}

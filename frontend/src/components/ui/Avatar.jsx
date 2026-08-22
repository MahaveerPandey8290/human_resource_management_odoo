import { useId } from 'react';

const palettes = [
  ['#6D5EF8', '#A78BFA'],
  ['#0EA5E9', '#38BDF8'],
  ['#16A34A', '#4ADE80'],
  ['#F59E0B', '#FBBF24'],
  ['#EF4444', '#F87171'],
  ['#E879F9', '#F0ABFC'],
  ['#0891B2', '#22D3EE'],
  ['#7C3AED', '#A78BFA'],
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

export function getAvatarColors(name) {
  const idx = hash(name) % palettes.length;
  return palettes[idx];
}

export function getInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const sizes = { sm: 32, md: 40, lg: 56, xl: 80, '2xl': 120 };

export default function Avatar({ name = '', src, size = 'md', className = '', ring = false }) {
  const initials = getInitials(name);
  const [c1, c2] = getAvatarColors(name);
  const px = sizes[size] || 40;

  if (src && !src.includes('dicebear')) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: px, height: px }}
        className={`rounded-full object-cover ${ring ? 'ring-2 ring-white shadow-sm' : ''} ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: px, height: px, background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      className={`rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${ring ? 'ring-2 ring-white shadow-sm' : ''} ${className}`}
    >
      <span style={{ fontSize: px * 0.36 }}>{initials}</span>
    </div>
  );
}

export default function BackgroundBlobs({ dimmed = false }) {
  const opacity = dimmed ? '0.04' : '0.10';
  const opacityB = dimmed ? '0.035' : '0.08';
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div
        className="blob-a absolute"
        style={{
          top: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, #6D5EF8 0%, transparent 70%)',
          filter: 'blur(120px)', opacity,
        }}
      />
      <div
        className="blob-b absolute"
        style={{
          top: '20%', right: '-10%', width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, #E879F9 0%, transparent 70%)',
          filter: 'blur(120px)', opacity: opacityB,
        }}
      />
      <div
        className="blob-c absolute"
        style={{
          bottom: '-15%', left: '30%', width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, #0EA5E9 0%, transparent 70%)',
          filter: 'blur(120px)', opacity,
        }}
      />
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}

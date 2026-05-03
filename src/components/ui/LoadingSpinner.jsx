export function LoadingSpinner({ size = 'md', className = '' }) {
  const dotClass = size === 'sm'
    ? 'w-1 h-1'
    : size === 'lg'
    ? 'w-2.5 h-2.5'
    : 'w-1.5 h-1.5';

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`rounded-full bg-current ${dotClass}`}
          style={{ animation: `dot-bounce 1s ease-in-out ${i * 0.16}s infinite` }}
        />
      ))}
    </span>
  );
}

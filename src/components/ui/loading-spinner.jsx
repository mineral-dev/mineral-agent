"use client";

export function LoadingSpinner({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-[3px] ${className}`}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="block w-[5px] h-[5px] bg-current rounded-sm"
          style={{
            animation: `agent-spark 1s ease-in-out ${i * 0.14}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

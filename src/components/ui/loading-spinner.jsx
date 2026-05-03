"use client";

export function LoadingSpinner({ size = "md", className = "" }) {
  const dotClass =
    size === "sm"
      ? "h-1 w-1"
      : size === "lg"
        ? "h-2.5 w-2.5"
        : "h-1.5 w-1.5";

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`rounded-full bg-current ${dotClass}`}
          style={{
            animation: `dot-bounce 1s ease-in-out ${index * 0.16}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

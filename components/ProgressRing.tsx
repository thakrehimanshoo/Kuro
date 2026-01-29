'use client';

interface ProgressRingProps {
  progress: number; // 0-1
  size?: number | string;
  strokeWidth?: number;
}

export default function ProgressRing({
  progress,
  size = "100%",
  strokeWidth = 3
}: ProgressRingProps) {
  // Use viewBox for scalability - SVG will scale to container
  const viewBoxSize = 280;
  const radius = (viewBoxSize - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      className="transform -rotate-90"
      style={{ willChange: 'transform' }}
    >
      {/* Background circle */}
      <circle
        cx={viewBoxSize / 2}
        cy={viewBoxSize / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.05)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={viewBoxSize / 2}
        cy={viewBoxSize / 2}
        r={radius}
        fill="none"
        stroke="white"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-linear"
        style={{ willChange: 'stroke-dashoffset' }}
      />
    </svg>
  );
}

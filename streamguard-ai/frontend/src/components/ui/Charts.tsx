import React, { useState } from 'react';

interface VolumeDataPoint {
  time: string;
  volume: number;
  fraud: number;
}

interface AreaChartProps {
  data: VolumeDataPoint[];
  height?: number;
}

export const NativeAreaChart: React.FC<AreaChartProps> = ({ data, height = 240 }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const maxVolume = Math.max(...data.map(d => d.volume), 1000);
  const width = 800;
  const paddingX = 40;
  const paddingY = 20;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * chartWidth;
    const y = height - paddingY - (d.volume / maxVolume) * chartHeight;
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    // Bezier curve smoothing
    const prev = points[i - 1];
    const cx1 = prev.x + (p.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (p.x - prev.x) / 2;
    const cy2 = p.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        className="w-full h-auto overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartCyanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.22" />
            <stop offset="90%" stopColor="#06B6D4" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle Horizontal Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = height - paddingY - pct * chartHeight;
          return (
            <g key={i}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="rgba(148, 163, 184, 0.05)"
                strokeDasharray="4 4"
              />
              <text
                x={paddingX - 10}
                y={y + 3}
                fill="#475569"
                fontSize="10"
                fontFamily="JetBrains Mono"
                textAnchor="end"
              >
                {Math.round(pct * maxVolume)}
              </text>
            </g>
          );
        })}

        {/* Area Gradient Fill */}
        <path d={areaD} fill="url(#chartCyanGrad)" />

        {/* Smooth Cyan Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#06B6D4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Hover Nodes */}
        {points.map((p, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Invisible touch target */}
              <circle cx={p.x} cy={p.y} r="18" fill="transparent" />

              {/* Dot shown on hover */}
              {isHovered && (
                <>
                  <circle cx={p.x} cy={p.y} r="6" fill="#06B6D4" />
                  <circle cx={p.x} cy={p.y} r="12" fill="none" stroke="#06B6D4" strokeOpacity="0.4" />
                  <line
                    x1={p.x}
                    y1={paddingY}
                    x2={p.x}
                    y2={height - paddingY}
                    stroke="rgba(6, 182, 212, 0.4)"
                    strokeDasharray="2 2"
                  />
                </>
              )}
            </g>
          );
        })}

        {/* X Axis Time Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 4}
            fill={hoveredIdx === i ? '#22D3EE' : '#475569'}
            fontSize="10"
            fontFamily="JetBrains Mono"
            textAnchor="middle"
          >
            {p.time}
          </text>
        ))}
      </svg>

      {/* Floating Tooltip Box */}
      {hoveredIdx !== null && (
        <div
          className="absolute bg-surface-300 border border-border-300 rounded px-2.5 py-1.5 shadow-md pointer-events-none text-xs font-mono z-20 -translate-x-1/2 -translate-y-full mb-2 animate-in fade-in duration-fast"
          style={{
            left: `${(points[hoveredIdx].x / width) * 100}%`,
            top: `${(points[hoveredIdx].y / height) * 100}%`,
          }}
        >
          <div className="text-text-primary font-bold">
            {points[hoveredIdx].volume.toLocaleString()} evals
          </div>
          <div className="text-status-block text-[11px]">
            {points[hoveredIdx].fraud} blocked
          </div>
        </div>
      )}
    </div>
  );
};

interface DonutDataPoint {
  name: string;
  value: number;
  color: string;
}

export const NativeDonutChart: React.FC<{ data: DonutDataPoint[]; size?: number }> = ({
  data,
  size = 180,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
        {data.map((slice, i) => {
          const percent = slice.value / total;
          const strokeDashoffset = circumference - percent * circumference;
          const rotation = accumulatedPercent * 360;
          accumulatedPercent += percent;

          const isHovered = hoveredIdx === i;

          return (
            <circle
              key={slice.name}
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={isHovered ? 20 : 16}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(${rotation} 80 80)`}
              className="transition-all duration-fast cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
        })}
      </svg>

      {/* Center Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-xs font-mono text-text-tertiary">
          {hoveredIdx !== null ? data[hoveredIdx].name : 'Attacks'}
        </span>
        <span className="text-sm font-bold font-mono text-text-primary">
          {hoveredIdx !== null ? `${data[hoveredIdx].value}%` : '100%'}
        </span>
      </div>
    </div>
  );
};

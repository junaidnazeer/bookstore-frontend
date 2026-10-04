import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../../lib/admin";

// Small dependency-free area/line chart. `points` = [{ label, value }].
// It measures its own width so the height stays a steady ~260px at any size.
const H = 260;
const M = { top: 16, right: 16, bottom: 30, left: 58 };

function niceMax(max) {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

// Indian-style short amounts: ₹850, ₹12k, ₹1.5L, ₹2Cr (never "T", which reads as trillion).
const trim = (x) => String(Math.round(x * 10) / 10);
function shortMoney(n) {
  if (n >= 1e7) return `₹${trim(n / 1e7)}Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)}L`;
  if (n >= 1e3) return `₹${trim(n / 1e3)}k`;
  return `₹${Math.round(n)}`;
}

export default function SalesChart({ points }) {
  const wrapRef = useRef(null);
  const [W, setW] = useState(640);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setW(Math.max(280, Math.round(el.clientWidth)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(Math.max(...points.map((p) => p.value), 0));
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const x = (i) =>
    M.left +
    (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v) => M.top + innerH - (v / max) * innerH;

  const line = points
    .map(
      (p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`,
    )
    .join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${M.top + innerH} L${x(0).toFixed(1)},${M.top + innerH} Z`;
  const ticks = [0, 1, 2, 3, 4].map((i) => (max / 4) * i);
  const active = hover !== null ? points[hover] : null;
  // On narrow screens with many months, label every other month so they never collide.
  const labelEvery = innerW / points.length < 44 ? 2 : 1;

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="block max-w-full"
        role="img"
        aria-label="Sales overview chart"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3d32" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1e3d32" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={y(t)}
              y2={y(t)}
              stroke="#e5e0d5"
              strokeDasharray="3 4"
            />
            <text
              x={M.left - 10}
              y={y(t) + 4}
              textAnchor="end"
              fontSize="11"
              fill="#8a8578"
            >
              {shortMoney(t)}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#salesFill)" />
        <path
          d={line}
          fill="none"
          stroke="#1e3d32"
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <g key={p.label + i}>
            {i % labelEvery === 0 && (
              <text
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#8a8578"
              >
                {p.label}
              </text>
            )}
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={hover === i ? 5 : 3.5}
              fill="#fff"
              stroke="#1e3d32"
              strokeWidth="2"
            />
            <rect
              data-point={i}
              x={x(i) - innerW / points.length / 2}
              y={M.top}
              width={innerW / points.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}
      </svg>

      {active && (
        <div
          role="tooltip"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{
            left: Math.min(Math.max(x(hover), 64), W - 64),
            top: y(active.value) - 10,
          }}
        >
          <span className="text-white/70">{active.label}: </span>
          {formatCurrency(active.value)}
        </div>
      )}
    </div>
  );
}

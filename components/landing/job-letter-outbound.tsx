"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { FileText, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };

type Geometry = {
  start: Point;
  targets: Point[];
  width: number;
  height: number;
};

export type LandingCompanyWordmark = {
  name: string;
  className: string;
};

function easeOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return 1 - (1 - x) ** 3;
}

function cubicBezier(
  t: number,
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
): Point {
  const u = 1 - t;
  const u2 = u * u;
  const u3 = u2 * u;
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
    y: u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
  };
}

function controlPoints(start: Point, end: Point, spread: number): [Point, Point] {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.max(40, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  const bend = Math.min(120, len * 0.35) * spread;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  return [
    { x: midX + nx * bend, y: midY + ny * bend },
    { x: midX - nx * bend * 0.35, y: midY - ny * bend * 0.35 },
  ];
}

export type JobLetterOutboundProps = {
  companies: LandingCompanyWordmark[];
  className?: string;
};

export function JobLetterOutbound({
  companies,
  className,
}: JobLetterOutboundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const laptopRef = useRef<HTMLDivElement>(null);
  const companyRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [geometry, setGeometry] = useState<Geometry | null>(null);
  const [progress, setProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const measure = useCallback(() => {
    const container = containerRef.current;
    const laptopEl = laptopRef.current;
    if (!container || !laptopEl) return;

    const cr = container.getBoundingClientRect();
    const lr = laptopEl.getBoundingClientRect();
    const start: Point = {
      x: lr.left + lr.width / 2 - cr.left,
      y: lr.top + lr.height / 2 - cr.top,
    };

    const targets: Point[] = [];
    for (const el of companyRefs.current) {
      if (!el) continue;
      const r = el.getBoundingClientRect();
      targets.push({
        x: r.left + r.width / 2 - cr.left,
        y: r.top + r.height / 2 - cr.top,
      });
    }

    if (targets.length === 0) {
      setGeometry(null);
      return;
    }

    setGeometry({
      start,
      targets,
      width: cr.width,
      height: cr.height,
    });
  }, []);

  useLayoutEffect(() => {
    companyRefs.current.length = companies.length;
    const run = () => measure();
    run();
    const raf = requestAnimationFrame(run);
    const container = containerRef.current;

    if (container) {
      const ro = new ResizeObserver(() => measure());
      ro.observe(container);
      window.addEventListener("resize", measure);
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        window.removeEventListener("resize", measure);
      };
    }

    return () => {
      cancelAnimationFrame(raf);
    };
  }, [measure, companies.length]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setProgress(1);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const updateProgress = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const enter = vh * 0.88;
      const exit = -rect.height * 0.12;
      const denom = enter - exit + rect.height * 0.35;
      const raw = (enter - rect.top) / denom;
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [reducedMotion]);

  const p = reducedMotion ? 1 : progress;
  const n = Math.min(companies.length, geometry?.targets.length ?? 0);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto w-full max-w-5xl px-6 pb-2 pt-6 md:pb-4 md:pt-10",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl bg-linear-to-br from-jade/[0.06] via-transparent to-terracotta/[0.05]" />

      <div className="relative z-10 flex justify-center md:justify-start">
        <div ref={laptopRef} className="flex w-[min(100%,280px)] flex-col">
          <div className="relative flex flex-col rounded-2xl border border-border/80 bg-card/90 p-5 warm-shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <Monitor className="size-3.5 text-jade" aria-hidden />
              Your desk
            </div>
            <div
              className="mt-4 flex aspect-[4/3] items-center justify-center rounded-xl border border-border/60 bg-linear-to-b from-secondary/80 to-secondary/40"
              aria-hidden
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-jade/15 text-jade ring-4 ring-jade/10">
                  <FileText className="size-5" />
                </div>
                <p className="font-(family-name:--font-bricolage) text-sm font-semibold text-foreground">
                  Your applications
                </p>
                <p className="max-w-[200px] text-xs text-muted-foreground">
                  Scroll and watch each packet route out to real companies.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:mt-12 md:justify-between md:gap-8">
        {companies.map((company, i) => (
          <span
            key={company.name}
            ref={(el) => {
              companyRefs.current[i] = el;
            }}
            className={cn(
              "select-none text-muted-foreground/40 transition-all duration-500 hover:text-muted-foreground/70",
              company.className,
              p >= 0.5 + i * 0.08 &&
                "text-jade/90 drop-shadow-[0_0_12px_rgba(48,164,108,0.25)]",
            )}
          >
            {company.name}
          </span>
        ))}
      </div>

      <p className="relative z-10 mx-auto mt-8 max-w-lg pb-8 text-center text-sm text-muted-foreground md:pb-10">
        <span className="font-semibold text-foreground">Reach more teams</span>
        — every scroll sends another application on its way. In Jobly, that
        journey is tracked in one calm place.
      </p>

      {geometry && n > 0 && (
        <svg
          className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          aria-hidden
        >
          {geometry.targets.slice(0, n).map((end, i) => {
            const spread = i % 2 === 0 ? 1 : -1;
            const [cp1, cp2] = controlPoints(geometry.start, end, spread);
            const d = `M ${geometry.start.x} ${geometry.start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
            const launch = 0.06 + i * 0.09;
            const flight = 0.32;
            const local = Math.min(1, Math.max(0, (p - launch) / flight));
            const eased = easeOutCubic(local);
            const pathLenEstimate =
              Math.hypot(end.x - geometry.start.x, end.y - geometry.start.y) *
              1.35;
            const dashOffset = pathLenEstimate * (1 - eased * 0.92);

            return (
              <g key={i}>
                <path
                  d={d}
                  fill="none"
                  stroke="var(--jade)"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeOpacity={0.28 + eased * 0.35}
                  strokeDasharray={`${pathLenEstimate}`}
                  strokeDashoffset={dashOffset}
                />
              </g>
            );
          })}
        </svg>
      )}

      {geometry &&
        n > 0 &&
        geometry.targets.slice(0, n).map((end, i) => {
          const spread = i % 2 === 0 ? 1 : -1;
          const [cp1, cp2] = controlPoints(geometry.start, end, spread);
          const launch = 0.06 + i * 0.09;
          const flight = 0.32;
          const local = Math.min(1, Math.max(0, (p - launch) / flight));
          const eased = easeOutCubic(local);
          const pos = cubicBezier(eased, geometry.start, cp1, cp2, end);
          const scale = 0.55 + eased * 0.45;
          const rotate = (1 - eased) * (-8 + i * 3);

          return (
            <div
              key={`letter-${i}`}
              className="pointer-events-none absolute z-[6] flex size-10 items-center justify-center will-change-transform"
              style={{
                left: pos.x,
                top: pos.y,
                transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
                opacity: eased < 0.04 ? 0 : 0.85 + eased * 0.15,
              }}
              aria-hidden
            >
              <div className="flex size-9 items-center justify-center rounded-lg border border-jade/35 bg-card warm-shadow-md shadow-[0_6px_20px_-4px_rgba(48,164,108,0.25)]">
                <FileText className="size-4 text-jade" />
              </div>
            </div>
          );
        })}
    </div>
  );
}

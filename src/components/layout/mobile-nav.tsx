"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";
import type { Department } from "@/lib/catalog";

const PEEK = 72;
const OPEN_SCALE = 0.93;
const OPEN_SHIFT = 16;
const OPEN_RADIUS = 14;
const HYSTERESIS = 10;
const FLICK_PX = 500;
const DECELERATION = 0.998;

type MobileNavContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const MobileNavContext = createContext<MobileNavContextValue | null>(null);

export function useMobileNav() {
  const value = useContext(MobileNavContext);
  if (!value) {
    throw new Error("useMobileNav must be used within StoreShell");
  }
  return value;
}

function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

function project(velocity: number, decelerationRate = DECELERATION) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

function readVelocity(samples: { x: number; t: number }[]) {
  if (samples.length < 2) return 0;
  const first = samples[0];
  const last = samples[samples.length - 1];
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return ((last.x - first.x) / dt) * 1000;
}

function clampDrag(next: number, width: number) {
  if (next > 1) {
    return 1 + rubberband((next - 1) * width, width) / width;
  }
  if (next < 0) {
    return rubberband(next * width, width) / width;
  }
  return next;
}

export function StoreShell({
  departments,
  navbar,
  footer,
  children,
}: {
  departments: Department[];
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const [open, setOpenState] = useState(false);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);

  const stopAnimation = useCallback(() => {
    animationRef.current?.stop();
    animationRef.current = null;
  }, []);

  const springTo = useCallback(
    (target: 0 | 1, velocity = 0) => {
      stopAnimation();
      if (target === 1) setOpenState(true);

      if (reduceMotion) {
        progress.set(target);
        if (target === 0) setOpenState(false);
        return;
      }

      const flicked = Math.abs(velocity) * Math.min(320, window.innerWidth - PEEK) > FLICK_PX;
      animationRef.current = animate(progress, target, {
        type: "spring",
        bounce: flicked ? 0.2 : 0,
        duration: 0.3,
        velocity,
        onComplete: () => {
          if (target === 0) setOpenState(false);
        },
      });
    },
    [progress, reduceMotion, stopAnimation],
  );

  const setOpen = useCallback(
    (next: boolean) => {
      springTo(next ? 1 : 0);
    },
    [springTo],
  );

  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) setOpen(false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    const previousBackground = document.body.style.backgroundColor;
    document.body.style.overflow = "hidden";
    document.body.style.backgroundColor = "var(--color-ink)";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.backgroundColor = previousBackground;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, setOpen]);

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      <PresentingSurface progress={progress} open={open} reduceMotion={Boolean(reduceMotion)}>
        {navbar}
        <main className="flex-1">{children}</main>
        {footer}
      </PresentingSurface>
      <DismissScrim progress={progress} open={open} reduceMotion={Boolean(reduceMotion)} />
      <MobileNavSheet
        departments={departments}
        progress={progress}
        open={open}
        reduceMotion={Boolean(reduceMotion)}
        springTo={springTo}
        stopAnimation={stopAnimation}
      />
    </MobileNavContext.Provider>
  );
}

function PresentingSurface({
  progress,
  open,
  reduceMotion,
  children,
}: {
  progress: MotionValue<number>;
  open: boolean;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(progress, "change", (value) => {
    const surface = surfaceRef.current;
    if (!surface) return;

    if (reduceMotion || value <= 0.001) {
      surface.style.transform = "";
      surface.style.borderRadius = "";
      surface.style.overflow = "";
      surface.style.boxShadow = "";
      surface.style.willChange = "";
      return;
    }

    surface.style.willChange = "transform";
    surface.style.transform = `translateX(${OPEN_SHIFT * value}px) scale(${1 - (1 - OPEN_SCALE) * value})`;
    surface.style.borderRadius = `${OPEN_RADIUS * value}px`;
    surface.style.overflow = "hidden";
    surface.style.boxShadow = `0 12px 40px rgba(31, 27, 24, ${0.28 * value})`;
  });

  return (
    <div
      ref={surfaceRef}
      className="relative flex min-h-dvh flex-col bg-ivory"
      style={{ transformOrigin: "center center" }}
      inert={open ? true : undefined}
    >
      {children}
    </div>
  );
}

function DismissScrim({
  progress,
  open,
  reduceMotion,
}: {
  progress: MotionValue<number>;
  open: boolean;
  reduceMotion: boolean;
}) {
  const scrimRef = useRef<HTMLButtonElement>(null);
  const { setOpen } = useMobileNav();

  useMotionValueEvent(progress, "change", (value) => {
    const scrim = scrimRef.current;
    if (!scrim) return;
    if (reduceMotion) {
      scrim.style.opacity = value > 0 ? "0.18" : "0";
      return;
    }
    scrim.style.opacity = `${0.18 * Math.min(value, 1)}`;
  });

  return (
    <button
      ref={scrimRef}
      type="button"
      tabIndex={-1}
      aria-label="Close menu"
      onClick={() => setOpen(false)}
      className={cn(
        "fixed inset-0 z-40 bg-ink md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      style={{ opacity: 0 }}
    />
  );
}

function MobileNavSheet({
  departments,
  progress,
  open,
  reduceMotion,
  springTo,
  stopAnimation,
}: {
  departments: Department[];
  progress: MotionValue<number>;
  open: boolean;
  reduceMotion: boolean;
  springTo: (target: 0 | 1, velocity?: number) => void;
  stopAnimation: () => void;
}) {
  const { setOpen } = useMobileNav();
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const didDrag = useRef(false);
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startProgress: number;
    width: number;
    mode: "undecided" | "drag" | "scroll";
  } | null>(null);
  const samples = useRef<{ x: number; t: number }[]>([]);
  const roots = departments.filter((department) => department.parentId === null);

  useMotionValueEvent(progress, "change", (value) => {
    const panel = panelRef.current;
    if (!panel) return;

    if (reduceMotion) {
      panel.style.transform = "none";
      panel.style.opacity = value > 0 ? "1" : "0";
      return;
    }

    panel.style.opacity = "1";
    panel.style.transform = `translateX(${(value - 1) * 100}%)`;
  });

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    stopAnimation();
    const width = panelRef.current?.offsetWidth ?? 320;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startProgress: progress.get(),
      width,
      mode: "undecided",
    };
    samples.current = [{ x: event.clientX, t: performance.now() }];
    didDrag.current = false;
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    const session = drag.current;
    if (!session || event.pointerId !== session.pointerId) return;

    const dx = event.clientX - session.startX;
    const dy = event.clientY - session.startY;

    if (session.mode === "undecided") {
      if (Math.abs(dx) < HYSTERESIS && Math.abs(dy) < HYSTERESIS) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        session.mode = "drag";
        event.currentTarget.setPointerCapture(event.pointerId);
        event.currentTarget.style.touchAction = "none";
      } else {
        session.mode = "scroll";
      }
    }

    if (session.mode !== "drag") return;

    didDrag.current = true;
    const now = performance.now();
    samples.current.push({ x: event.clientX, t: now });
    samples.current = samples.current.filter((sample) => now - sample.t < 80);
    progress.set(clampDrag(session.startProgress + dx / session.width, session.width));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const session = drag.current;
    if (!session || event.pointerId !== session.pointerId) return;

    event.currentTarget.style.touchAction = "";
    if (session.mode === "drag") {
      const velocity = readVelocity(samples.current) / session.width;
      const projected = progress.get() + project(velocity);
      const flicked = Math.abs(readVelocity(samples.current)) > FLICK_PX;
      const target: 0 | 1 = flicked ? (velocity < 0 ? 0 : 1) : projected < 0.5 ? 0 : 1;
      springTo(target, velocity);
    }

    drag.current = null;
  };

  return (
    <aside
      ref={panelRef}
      id="mobile-nav"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(event) => {
        if (!didDrag.current) return;
        event.preventDefault();
        event.stopPropagation();
        didDrag.current = false;
      }}
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-[min(20rem,calc(100vw-4.5rem))] flex-col border-r border-white/40 bg-sand/80 shadow-lift backdrop-blur-[40px] backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-sand [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none md:hidden",
        "pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(0px,env(safe-area-inset-left))]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      style={{ transform: "translateX(-100%)" }}
    >
      <header className="flex items-center justify-between px-4 pb-3">
        <BrandLogo className="h-9" size={36} />
        <button
          ref={closeRef}
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="flex h-11 w-11 items-center justify-center active:scale-[0.97]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-ink-muted">
            <X size={15} strokeWidth={2} />
          </span>
        </button>
      </header>

      <nav className="no-rail flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        <p className="px-1 pb-2 text-[13px] text-ink-faint">Shop</p>
        <NavGroup>
          <NavRow href="/shop" active={pathname.startsWith("/shop") && !roots.some((department) => pathname === `/shop/${department.slug}`)}>
            All products
          </NavRow>
          {roots.map((department) => (
            <NavRow
              key={department.id}
              href={`/shop/${department.slug}`}
              active={pathname === `/shop/${department.slug}`}
            >
              {department.name}
            </NavRow>
          ))}
        </NavGroup>

        <div className="mt-4">
          <NavGroup>
            <NavRow href="/about" active={pathname === "/about"}>
              About
            </NavRow>
            <NavRow href="/contact" active={pathname === "/contact"}>
              Support
            </NavRow>
          </NavGroup>
        </div>
      </nav>
    </aside>
  );
}

function NavGroup({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-[10px] bg-cream">{children}</div>;
}

function NavRow({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-11 items-center justify-between gap-3 border-b border-line px-4 text-[17px] leading-none tracking-[-0.01em] last:border-b-0",
        active ? "bg-sand text-ink" : "text-ink active:bg-sand",
      )}
    >
      <span>{children}</span>
      <ChevronRight size={18} strokeWidth={1.75} className="text-ink-faint" />
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
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
import { ChevronRight, Heart, Info, MessageCircle, User, X } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { cn } from "@/lib/utils";
import type { Department } from "@/lib/catalog";

const PEEK = 72;
const OPEN_SCALE = 0.93;
const OPEN_SHIFT = 16;
const OPEN_RADIUS = 14;
const OPEN_BLUR = 6;
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
      <PresentingSurface
        pathname={pathname}
        progress={progress}
        open={open}
        reduceMotion={Boolean(reduceMotion)}
      >
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
  pathname,
  progress,
  open,
  reduceMotion,
  children,
}: {
  pathname: string;
  progress: MotionValue<number>;
  open: boolean;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const clipRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const scrollYRef = useRef(0);
  const pinnedRef = useRef(false);

  const pin = useCallback(() => {
    const clip = clipRef.current;
    const page = pageRef.current;
    if (!clip || !page || pinnedRef.current) return;

    scrollYRef.current = window.scrollY;
    pinnedRef.current = true;
    clip.style.position = "fixed";
    clip.style.inset = "0";
    clip.style.height = "100dvh";
    clip.style.width = "100%";
    clip.style.overflow = "hidden";
    clip.style.zIndex = "30";
    page.style.position = "absolute";
    page.style.top = `${-scrollYRef.current}px`;
    page.style.left = "0";
    page.style.right = "0";
  }, []);

  const unpin = useCallback(() => {
    const clip = clipRef.current;
    const page = pageRef.current;
    if (!clip || !page || !pinnedRef.current) return;

    pinnedRef.current = false;
    clip.style.position = "";
    clip.style.inset = "";
    clip.style.height = "";
    clip.style.width = "";
    clip.style.overflow = "";
    clip.style.zIndex = "";
    clip.style.transform = "";
    clip.style.borderRadius = "";
    clip.style.boxShadow = "";
    clip.style.willChange = "";
    page.style.position = "";
    page.style.top = "";
    page.style.left = "";
    page.style.right = "";
    window.scrollTo(0, scrollYRef.current);
  }, []);

  useLayoutEffect(() => {
    scrollYRef.current = 0;
    if (pageRef.current && pinnedRef.current) {
      pageRef.current.style.top = "0";
    }
  }, [pathname]);

  useLayoutEffect(() => {
    if (open) pin();
    else unpin();
  }, [open, pin, unpin]);

  useMotionValueEvent(progress, "change", (value) => {
    const clip = clipRef.current;
    if (!clip) return;

    if (reduceMotion || value <= 0.001) {
      clip.style.transform = "";
      clip.style.borderRadius = "";
      clip.style.boxShadow = "";
      clip.style.willChange = "";
      return;
    }

    if (!pinnedRef.current) pin();

    clip.style.willChange = "transform";
    clip.style.transform = `translateX(${-OPEN_SHIFT * value}px) scale(${1 - (1 - OPEN_SCALE) * value})`;
    clip.style.borderRadius = `${OPEN_RADIUS * value}px`;
    clip.style.boxShadow = `0 12px 40px rgba(31, 27, 24, ${0.28 * value})`;
  });

  return (
    <div
      ref={clipRef}
      className="relative flex min-h-dvh flex-col bg-ivory"
      style={{ transformOrigin: "center center" }}
      inert={open ? true : undefined}
    >
      <div ref={pageRef} className="flex min-h-dvh flex-1 flex-col">
        {children}
      </div>
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

    const amount = Math.min(Math.max(value, 0), 1);
    const reduceTransparency = window.matchMedia("(prefers-reduced-transparency: reduce)").matches;

    if (reduceMotion) {
      scrim.style.backgroundColor = amount > 0 ? "rgba(31, 27, 24, 0.18)" : "transparent";
      scrim.style.backdropFilter = "none";
      return;
    }

    scrim.style.backgroundColor = `rgba(31, 27, 24, ${0.16 * amount})`;
    scrim.style.backdropFilter = reduceTransparency ? "none" : `blur(${OPEN_BLUR * amount}px)`;
  });

  return (
    <button
      ref={scrimRef}
      type="button"
      tabIndex={-1}
      aria-label="Close menu"
      onClick={() => setOpen(false)}
      className={cn(
        "fixed inset-0 z-40 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      style={{ backgroundColor: "transparent" }}
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
    panel.style.transform = `translateX(${(1 - value) * 100}%)`;
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
    progress.set(clampDrag(session.startProgress - dx / session.width, session.width));
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const session = drag.current;
    if (!session || event.pointerId !== session.pointerId) return;

    event.currentTarget.style.touchAction = "";
    if (session.mode === "drag") {
      const velocity = readVelocity(samples.current) / session.width;
      const projected = progress.get() + project(velocity);
      const flicked = Math.abs(readVelocity(samples.current)) > FLICK_PX;
      const target: 0 | 1 = flicked ? (velocity > 0 ? 0 : 1) : projected < 0.5 ? 0 : 1;
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
        "fixed inset-y-0 right-0 z-50 flex w-[min(20rem,calc(100vw-4.5rem))] flex-col border-l border-white/40 bg-sand/80 shadow-lift backdrop-blur-[40px] backdrop-saturate-150 [@media(prefers-reduced-transparency:reduce)]:bg-sand [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none md:hidden",
        "pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] pr-[max(0px,env(safe-area-inset-right))]",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      style={{ transform: "translateX(100%)" }}
    >
      <header className="flex items-center justify-between px-4 pb-3">
        <BrandLogo className="h-9" size={36} />
        <button
          ref={closeRef}
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="flex h-11 w-11 items-center justify-center text-ink-muted active:scale-[0.97]"
        >
          <X size={18} strokeWidth={1.75} />
        </button>
      </header>

      <nav className="no-rail flex-1 overflow-y-auto overscroll-contain px-4">
        <div className="divide-y divide-line">
          <NavRow
            href="/shop"
            active={pathname.startsWith("/shop") && !roots.some((department) => pathname === `/shop/${department.slug}`)}
          >
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
        </div>
      </nav>

      <div className="grid grid-cols-2 gap-2 px-4 pt-3">
        <UtilityLink href="/account" label="Account" active={pathname === "/account"}>
          <User size={20} strokeWidth={1.5} />
        </UtilityLink>
        <UtilityLink href="/saved" label="Your list" active={pathname === "/saved"}>
          <Heart size={20} strokeWidth={1.5} />
        </UtilityLink>
        <UtilityLink href="/about" label="About" active={pathname === "/about"}>
          <Info size={20} strokeWidth={1.5} />
        </UtilityLink>
        <UtilityLink href="/contact" label="Support" active={pathname === "/contact"}>
          <MessageCircle size={20} strokeWidth={1.5} />
        </UtilityLink>
      </div>
    </aside>
  );
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
        "flex min-h-12 items-center justify-between gap-3 text-[17px] leading-none tracking-[-0.022em] active:opacity-40",
        active ? "text-clay" : "text-ink",
      )}
    >
      <span>{children}</span>
      <ChevronRight size={18} strokeWidth={1.75} className="text-ink-faint" />
    </Link>
  );
}

function UtilityLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-1 flex-col items-center gap-1.5 rounded-[10px] bg-cream py-3 text-ink-muted active:scale-[0.97] active:bg-sand",
        active && "bg-sand text-ink",
      )}
    >
      {children}
      <span className="text-[11px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}

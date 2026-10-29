import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MosqueIcon from "./MosqueIcon";

const INTERVAL_MS = 5000;
const SWIPE_PX = 40;

// One slide per category, in this order. `pd` / `pm` choose which part of the
// photo stays in view on desktop / mobile (CSS object-position).
const SLIDES = [
  {
    slug: "books",
    title: "Qur’an & Islamic Books",
    text: "Timeless knowledge for a better hereafter. Explore our collection of Qur’an, hadith and Islamic literature.",
    image: "/images/hero/books.jpg",
    pd: "50% 70%",
    pm: "50% 80%",
  },
  {
    slug: "attars",
    title: "Attars & Fragrances",
    text: "Pure, natural and traditional attars for a refreshing experience.",
    image: "/images/hero/attars.jpg",
    pd: "50% 50%",
    pm: "50% 45%",
  },
  {
    slug: "caps",
    title: "Caps",
    text: "Comfortable and stylish caps for everyday wear and prayer.",
    image: "/images/hero/caps.jpg",
    pd: "50% 60%",
    pm: "50% 85%",
  },
  {
    slug: "shalwar-kameez",
    title: "Shalwar Kameez",
    text: "Traditional wear for men, combining comfort, modesty and timeless style.",
    image: "/images/hero/shalwar-kameez.jpg",
    pd: "50% 30%",
    pm: "50% 20%",
  },
  {
    slug: "abayas",
    title: "Abayas",
    text: "Elegant and modest abayas for every occasion.",
    image: "/images/hero/abayas.jpg",
    pd: "50% 8%",
    pm: "50% 5%",
  },
  {
    slug: "jilbabs",
    title: "Jilbabs",
    text: "Graceful, modest and comfortable jilbabs for your daily life and worship.",
    image: "/images/hero/jilbabs.jpg",
    pd: "50% 8%",
    pm: "50% 5%",
  },
  {
    slug: "prayer-quran-accessories",
    title: "Prayer & Quran Accessories",
    text: "Complete your spiritual journey with quality prayer mats, Qur’an rehal and more.",
    image: "/images/hero/prayer-quran-accessories.jpg",
    pd: "50% 60%",
    pm: "50% 70%",
  },
];

const COUNT = SLIDES.length;

export default function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [missing, setMissing] = useState({}); // slides whose image file isn't there
  const touch = useRef(null);

  const go = (i) => setIndex(((i % COUNT) + COUNT) % COUNT);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  // People who ask their device for less motion get no auto-rotation.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Auto-advance. The timer restarts after every change (manual or automatic),
  // so each slide gets its full 5 seconds, and it stops while paused.
  useEffect(() => {
    if (paused || reduced) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % COUNT), INTERVAL_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduced]);

  function onTouchStart(e) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
    setPaused(true);
  }
  function onTouchEnd(e) {
    const start = touch.current;
    touch.current = null;
    setPaused(false);
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  }
  function onKeyDown(e) {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  }

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Shop by category highlights"
      className="relative rounded-2xl overflow-hidden mx-4 mt-4 max-w-7xl md:mx-auto md:w-[calc(100%_-_2rem)] bg-[#F3ECDD] border border-[#e6dcc4]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touch.current = null;
        setPaused(false);
      }}
      onKeyDown={onKeyDown}
    >
      <h1 className="sr-only">
        Maktabah Islamiyah: authentic Islamic books, attars and modest clothing
      </h1>

      {/* All slides sit in the same grid cell, so the banner keeps the height
          of the tallest one and nothing jumps when the slide changes. */}
      <div className="grid">
        {SLIDES.map((s, i) => {
          const active = i === index;
          const distance = (i - index + COUNT) % COUNT;
          // Only the current slide and its neighbours load an image.
          const loadImage = distance <= 1 || distance === COUNT - 1;
          const hasImage = loadImage && !missing[s.slug];
          return (
            <div
              key={s.slug}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${COUNT}`}
              aria-hidden={!active}
              className={`[grid-area:1/1] flex flex-col md:block md:relative md:h-[420px] lg:h-[460px] transition-opacity duration-500 motion-reduce:transition-none ${
                active ? "opacity-100" : "opacity-0 invisible"
              }`}
            >
              {/* Photo: on top on phones, on the right on laptops */}
              <div className="relative h-[200px] sm:h-[250px] md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[62%] overflow-hidden bg-[#e9dfc8]">
                {hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.image}
                    alt={s.title}
                    draggable={false}
                    decoding="async"
                    loading={i === 0 ? "eager" : "lazy"}
                    onError={() =>
                      setMissing((m) => ({ ...m, [s.slug]: true }))
                    }
                    style={{ "--pm": s.pm, "--pd": s.pd }}
                    className="absolute inset-0 h-full w-full object-cover object-[var(--pm)] md:object-[var(--pd)] select-none"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#efe6d0] to-[#e1d5b8]">
                    <MosqueIcon size={88} className="text-spine/20" />
                  </div>
                )}
                {/* soft edge into the cream background */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#F3ECDD] to-transparent md:hidden" />
                <div className="hidden md:block absolute inset-y-0 left-0 w-2/5 bg-gradient-to-r from-[#F3ECDD] via-[#F3ECDD]/55 to-transparent" />
              </div>

              {/* Text */}
              <div className="relative px-5 pt-3 pb-14 sm:px-8 md:px-0 md:pb-0 md:pl-16 md:pr-6 md:h-full md:w-[48%] md:flex md:flex-col md:justify-center">
                <p className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-neutral-500 mb-1.5 md:mb-3">
                  Authentic Islamic Essentials
                </p>
                <h2 className="font-serif font-semibold text-[26px] leading-tight sm:text-3xl md:text-4xl lg:text-[44px] lg:leading-[1.1] text-spine mb-2 md:mb-4">
                  {s.title}
                </h2>
                <p className="text-sm md:text-base text-neutral-600 leading-relaxed max-w-md mb-4 md:mb-6 line-clamp-3">
                  {s.text}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <Link
                    href={`/products?category=${s.slug}`}
                    tabIndex={active ? 0 : -1}
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 bg-spine text-white text-sm md:text-base font-medium rounded-md hover:opacity-90 transition-opacity"
                  >
                    Shop Now →
                  </Link>
                  <Link
                    href="/categories"
                    tabIndex={active ? 0 : -1}
                    className="inline-flex items-center justify-center min-h-[44px] px-5 py-2 border border-spine text-spine bg-white/70 text-sm md:text-base font-medium rounded-md hover:bg-spine hover:text-white transition-colors"
                  >
                    Explore All
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Previous / next */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-2 top-[100px] sm:top-[125px] md:top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-spine shadow hover:bg-white"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-2 top-[100px] sm:top-[125px] md:top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-spine shadow hover:bg-white"
      >
        <ChevronRight size={20} />
      </button>

      {/* Indicators + counter */}
      <div className="absolute bottom-3 left-5 sm:left-8 md:bottom-5 md:left-16 z-10 flex items-center gap-3">
        <div
          className="flex items-center"
          role="tablist"
          aria-label="Choose a slide"
        >
          {SLIDES.map((s, i) => (
            <button
              key={s.slug}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}: ${s.title}`}
              onClick={() => go(i)}
              className="grid h-6 w-5 place-items-center"
            >
              <span
                className={`block rounded-full transition-all ${
                  i === index
                    ? "h-2.5 w-2.5 bg-spine"
                    : "h-2 w-2 bg-neutral-300"
                }`}
              />
            </button>
          ))}
        </div>
        <span
          className="text-xs text-neutral-600 tabular-nums"
          aria-live={paused || reduced ? "polite" : "off"}
        >
          {index + 1} / {COUNT}
        </span>
      </div>
    </section>
  );
}

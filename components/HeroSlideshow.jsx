import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MosqueIcon from "./MosqueIcon";

// How long each slide stays before the next one starts (milliseconds).
const INTERVAL_MS = 2000;
const SWIPE_PX = 40;
// Change this number whenever you replace a picture in public/images/hero/,
// so browsers fetch the new file instead of showing an old saved copy.
const IMG_VERSION = "3";
// How many times a picture that fails to load is tried before the plain panel
// is shown instead.
const MAX_TRIES = 3;

// One slide per category, in this order.
// `w` / `h` are the real pixel size of each photo (lets the browser reserve the
// right space, so phones show the FULL photo without the page jumping).
// Phones: the FULL photo sits on top, nothing cropped.
// Laptops (768px and wider): the photo fills the right side of the banner;
// `pd` chooses which part stays in view (CSS object-position).
const SLIDES = [
  {
    slug: "books",
    title: "Qur’an & Islamic Books",
    text: "Timeless knowledge for a better hereafter. Explore our collection of Qur’an, hadith and Islamic literature.",
    image: "/images/hero/books.jpg",
    pd: "50% 70%",
    w: 1000,
    h: 901,
  },
  {
    slug: "attars",
    title: "Attars & Fragrances",
    text: "Pure, natural and traditional attars for a refreshing experience.",
    image: "/images/hero/attars.jpg",
    pd: "50% 50%",
    w: 1025,
    h: 901,
  },
  {
    slug: "caps",
    title: "Caps",
    text: "Comfortable and stylish caps for everyday wear and prayer.",
    image: "/images/hero/caps.jpg",
    pd: "50% 60%",
    w: 1070,
    h: 902,
  },
  {
    slug: "shalwar-kameez",
    title: "Shalwar Kameez",
    text: "Traditional wear for men, combining comfort, modesty and timeless style.",
    image: "/images/hero/shalwar-kameez.jpg",
    pd: "50% 30%",
    w: 865,
    h: 901,
  },
  {
    slug: "abayas",
    title: "Abayas",
    text: "Elegant and modest abayas for every occasion.",
    image: "/images/hero/abayas.jpg",
    pd: "50% 8%",
    w: 985,
    h: 902,
  },
  {
    slug: "jilbabs",
    title: "Jilbabs",
    text: "Graceful, modest and comfortable jilbabs for your daily life and worship.",
    image: "/images/hero/jilbabs.jpg",
    pd: "50% 8%",
    w: 1040,
    h: 902,
  },
  {
    slug: "prayer-quran-accessories",
    title: "Prayer & Quran Accessories",
    text: "Complete your spiritual journey with quality prayer mats, Qur’an rehal and more.",
    image: "/images/hero/prayer-quran-accessories.jpg",
    pd: "50% 60%",
    w: 848,
    h: 902,
  },
];

const COUNT = SLIDES.length;

export default function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [fails, setFails] = useState({}); // slug -> number of failed loads
  const touch = useRef(null);
  const imgRefs = useRef({});

  const bumpFail = (slug) =>
    setFails((f) => ({ ...f, [slug]: (f[slug] || 0) + 1 }));

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

  // A picture can fail before the page is ready to notice (slow or dropped
  // connection). Check once after loading and retry those.
  useEffect(() => {
    SLIDES.forEach((s) => {
      const el = imgRefs.current[s.slug];
      if (el && el.complete && el.naturalWidth === 0) bumpFail(s.slug);
    });
  }, []);

  // Auto-advance. The timer restarts after every change (manual or automatic),
  // so each slide gets its full time (INTERVAL_MS), and it stops while paused.
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
      // Only a real mouse hover or keyboard focus pauses the slideshow.
      // Taps on a phone must not (they would stop autoplay for good).
      onPointerEnter={(e) => e.pointerType === "mouse" && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setPaused(false)}
      onFocusCapture={(e) =>
        e.target.matches(":focus-visible") && setPaused(true)
      }
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
          const tries = fails[s.slug] || 0;
          const hasImage = tries < MAX_TRIES;
          // Each retry asks for the file again with a different address.
          const src = `${s.image}?v=${IMG_VERSION}${tries ? `&r=${tries}` : ""}`;
          return (
            <div
              key={s.slug}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${COUNT}`}
              aria-hidden={!active}
              // duration-1000 = the slide change (fade) takes 1 second.
              // Raise it for a slower, softer change; lower it for a quicker one.
              className={`[grid-area:1/1] flex flex-col md:block md:relative md:h-[420px] lg:h-[460px] transition-[opacity,visibility] duration-1000 motion-reduce:transition-none ${
                active ? "opacity-100" : "opacity-0 invisible"
              }`}
            >
              {/* Photo: full photo on top on phones, fills the right side on laptops */}
              <div
                className="relative mx-auto w-full max-w-[460px] sm:max-w-[520px] overflow-hidden bg-[#e9dfc8] aspect-[var(--ar)] md:absolute md:inset-y-0 md:right-0 md:mx-0 md:h-full md:w-[62%] md:max-w-none md:aspect-auto"
                style={{ "--ar": `${s.w} / ${s.h}` }}
              >
                {hasImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    ref={(el) => {
                      imgRefs.current[s.slug] = el;
                    }}
                    src={src}
                    width={s.w}
                    height={s.h}
                    alt={s.title}
                    draggable={false}
                    decoding="async"
                    loading="eager"
                    onError={() => setTimeout(() => bumpFail(s.slug), 1200)}
                    style={{ "--pd": s.pd }}
                    className="block h-full w-full select-none object-cover md:object-[var(--pd)]"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-[#efe6d0] to-[#e1d5b8]">
                    <MosqueIcon size={88} className="text-spine/20" />
                  </div>
                )}
                {/* soft edge into the cream background (laptop only) */}
                <div className="absolute inset-y-0 left-0 hidden w-2/5 bg-gradient-to-r from-[#F3ECDD] via-[#F3ECDD]/55 to-transparent md:block" />
              </div>

              {/* Text */}
              <div className="relative px-5 pt-3 pb-14 sm:px-8 md:px-0 md:pb-0 md:pl-16 md:pr-6 md:h-full md:w-[48%] md:flex md:flex-col md:justify-center">
                <p className="text-[11px] md:text-xs uppercase tracking-[0.18em] text-neutral-500 mb-1.5 md:mb-3">
                  Authentic Islamic Essentials
                </p>
                <h2 className="font-serif font-semibold text-[26px] leading-tight sm:text-3xl md:text-4xl lg:text-[44px] lg:leading-[1.1] text-spine mb-2 md:mb-4">
                  {s.title}
                </h2>
                <p className="text-sm md:text-base text-neutral-600 leading-relaxed max-w-md mb-4 md:mb-6 md:line-clamp-3">
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
        className="absolute left-2 top-40 sm:top-60 md:top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-spine shadow hover:bg-white"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-2 top-40 sm:top-60 md:top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-spine shadow hover:bg-white"
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

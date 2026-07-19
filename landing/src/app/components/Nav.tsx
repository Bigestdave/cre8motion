import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CTAButton } from "./primitives/CTAButton";

const LINKS = ["Product", "How it works", "Examples", "Technology"];

export function Nav() {
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-line bg-[#050505]/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center justify-between px-6 md:px-10">
        <a href="#" className="text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">
          Cre<span className="text-accent">8</span>Motion
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l}
              href="#"
              className="text-[0.9rem] text-ink-2 opacity-90 transition-opacity duration-150 hover:opacity-100 hover:text-ink"
            >
              {l}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#"
            className="hidden text-[0.9rem] text-ink-2 transition-colors duration-150 hover:text-ink sm:inline"
          >
            Sign in
          </a>
          <CTAButton size="md">Start creating</CTAButton>
        </div>
      </div>
    </motion.header>
  );
}

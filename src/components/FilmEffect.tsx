"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Deterministic random generator for frames
const random = (() => {
  let seed = 12345;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
})();

const FRAMES_COUNT = 8; // 8 distinct presets

// Create a baseline of 45 specks to provide "smart random" jitter
const baselineSpecks = Array.from({ length: 45 }).map(() => {
  let x = random();
  let y = random();
  // Very slight (15%) pull towards the center (0.5), to match a "1.5/10" center-weight requested
  x = x + (0.5 - x) * 0.15;
  y = y + (0.5 - y) * 0.15;
  return {
    x: x * 100,
    y: y * 100,
    r: 0.3 + random() * 1.2,
    opacity: 0.15 + random() * 0.25,
  };
});

// Generate each frame by slightly jittering the baseline specks
const framesData = Array.from({ length: FRAMES_COUNT }).map(() => {
  // Dynamic speck count per frame (between 30 and 45)
  const specksCount = 30 + Math.floor(random() * 16);
  
  return {
    specks: baselineSpecks.slice(0, specksCount).map(base => {
      // Increased deviation mapping (-4% to +4% movement)
      const dx = (random() - 0.5) * 8;
      const dy = (random() - 0.5) * 8;
      const dro = (random() - 0.5) * 0.4; // slight radius change
      const dop = (random() - 0.5) * 0.15; // slight opacity flicker
      
      return {
        x: base.x + dx,
        y: base.y + dy,
        r: Math.max(0.1, base.r + dro),
        opacity: Math.max(0.05, Math.min(1, base.opacity + dop)),
      };
    })
  };
});

export default function FilmEffect() {
  const pathname = usePathname();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = (e: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          let newScrollY = window.scrollY;
          
          if (e.target && e.target !== document && e.target !== window) {
            newScrollY = (e.target as HTMLElement).scrollTop || window.scrollY;
          }
          
          setScrollY(newScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    if (typeof window !== "undefined") {
      setScrollY(window.scrollY);
    }
    
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", handleScroll, { capture: true });
  }, []);

  // Exclude blog routes
  if (pathname?.startsWith("/blog") || pathname?.startsWith("/admin/blog")) {
    return null;
  }

  // Calculate current frame index based strictly on scroll amount
  // Decreased sensitivity (was 40px, now 160px per frame change)
  const frameIndex = Math.floor(scrollY / 160) % FRAMES_COUNT;
  
  const activeFrameData = framesData[((frameIndex % FRAMES_COUNT) + FRAMES_COUNT) % FRAMES_COUNT];

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden mix-blend-screen">
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {activeFrameData.specks.map((p, pi) => (
          <rect 
            key={`p-${pi}`}
            x={`calc(${p.x}% - ${p.r}px)`}
            y={`calc(${p.y}% - ${p.r}px)`}
            width={p.r * 2}
            height={p.r * 2}
            fill="white" 
            opacity={p.opacity}
          />
        ))}
      </svg>
    </div>
  );
}

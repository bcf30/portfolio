"use client";

import { motion, useScroll } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Github, Briefcase } from "lucide-react";

import { projects, environmentImageIds, type Project } from "../Models/ProjectViewModel";
import { getDbAtFreq, formatFrequency, formatTime, freqToProgress, LOG_20, LOG_RANGE, PADDING_ZONE, calculateFrequencyPath, calculateDotX } from "../Services/FrequencyResponse";

// Constants
const FREQUENCY_LABELS = [20, 100, 500, 1000, 3000, 10000, 20000];
const DEFAULT_TIMER_SECONDS = 900;

// Experience data
interface Experience {
  position: string;
  company: string;
  period: string;
  description: string;
  tech: string;
}
const experiences: Experience[] = [
  {
    position: "Junior Software Developer",
    company: "taq Automotive Intelligence",
    period: "January 2026 — Present",
    description: "Developing software solutions for automotive lenders and dealers.",
    tech: ".NET, C#, MSSQL, JS"
  }
];

interface FrequencyState {
  progress: number;
  frequency: number;
  db: number;
}

export default function PortfolioPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: containerRef });
  
  const [portal, setPortal] = useState(false);
  const [timer, setTimer] = useState(DEFAULT_TIMER_SECONDS);
  const [freqState, setFreqState] = useState<FrequencyState>({ progress: 0, frequency: 0, db: -4 });
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize after mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Map scroll position to frequency response
  useEffect(() => {
    return scrollYProgress.on("change", p => {
      let f: number, dbVal: number;
      
      if (p < PADDING_ZONE) {
        f = (p / PADDING_ZONE) * 20;
        dbVal = getDbAtFreq(Math.max(f, 20));
      } else {
        const adjustedP = (p - PADDING_ZONE) / (1 - PADDING_ZONE);
        f = Math.pow(10, LOG_20 + adjustedP * LOG_RANGE);
        dbVal = getDbAtFreq(f);
      }
      
      setFreqState({ progress: p, frequency: f, db: dbVal });
    });
  }, [scrollYProgress]);

  // Portal countdown timer
  useEffect(() => {
    if (!portal || timer <= 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [portal, timer]);

  // Scroll to position handler
  const scrollTo = (p: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: p * (el.scrollHeight - el.clientHeight), behavior: 'auto' });
  };

  if (portal) return <PortalView timer={timer} onExit={() => { setPortal(false); setTimer(DEFAULT_TIMER_SECONDS); }} />;

  return (
    <div ref={containerRef} className="relative h-screen overflow-y-auto overflow-x-hidden bg-[oklch(0.16_0.01_145)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <FilmGrainOverlay />
      <FrequencyScrollbar mounted={mounted} freqState={freqState} onScrollTo={scrollTo} />
      <NavigationHeader containerRef={containerRef} />
      <AtmosphericEffects />
      
      <main className="relative z-30 pr-16 lg:pr-20">
        <HeroSection />
        <ProjectsSection onHoverProject={setHoveredProject} />
        <ExperienceSection />
        <BioSection />
        <EnvironmentGallery />
        <ContactSection />
        <SiteFooter />
      </main>

      <ProjectHoverImages projects={projects} hoveredProject={hoveredProject} />
      <PortalButton onClick={() => setPortal(true)} />
    </div>
  );
}

// Portal page view
function PortalView({ timer, onExit }: { timer: number; onExit: () => void }) {
  // Redirect to home when timer hits 0
  useEffect(() => {
    if (timer === 0) {
      onExit();
    }
  }, [timer, onExit]);

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.01_55)] flex flex-col relative overflow-hidden">
      <NoiseOverlay />
      <BackgroundImage url="/images/turnpike.avif" />
      <button onClick={onExit} className="fixed top-4 left-4 z-50 px-3 py-1.5 border border-[oklch(0.50_0.04_145)] text-[oklch(0.75_0.03_145)] text-xs font-mono hover:bg-[oklch(0.25_0.06_145)] transition-all">exit</button>
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="max-w-xl text-center">
          <div className="my-8">
            <p className="font-mono text-xs text-[oklch(0.40_0.04_145)] mb-2">time remaining</p>
            <div className="font-[family-name:var(--font-cormorant)] text-5xl text-[oklch(0.65_0.08_340)]">{formatTime(timer)}</div>
          </div>
          <p className="font-[family-name:var(--font-crimson)] text-base text-[oklch(0.55_0.04_145)] italic">
            Being Ramiro Chen<br />
            <span className="text-[oklch(0.45_0.06_145)]">... Maybe not as good as being John Malkovich would be.</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Custom frequency response scrollbar
function FrequencyScrollbar({ mounted, freqState, onScrollTo }: { mounted: boolean; freqState: FrequencyState; onScrollTo: (p: number) => void }) {
  const dfPath = calculateFrequencyPath();
  const dotX = calculateDotX(freqState.db);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const getPos = (y: number) => Math.max(0, Math.min(1, (y - rect.top) / rect.height));
    onScrollTo(getPos(e.clientY));
    const move = (ev: MouseEvent) => { ev.preventDefault(); onScrollTo(getPos(ev.clientY)); };
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up);
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-12 lg:w-16 z-50 cursor-pointer select-none transition-opacity duration-300" style={{ opacity: mounted ? 1 : 0 }} onMouseDown={handleMouseDown}>
      <div className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-[oklch(0.16_0.01_145)] to-transparent z-10" />
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <defs><linearGradient id="dfGrad" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stopColor="oklch(0.25 0.08 280)" /><stop offset="40%" stopColor="oklch(0.40 0.08 55)" /><stop offset="70%" stopColor="oklch(0.45 0.10 145)" /><stop offset="100%" stopColor="oklch(0.35 0.12 180)" /></linearGradient></defs>
        <path d={dfPath} fill="none" stroke="url(#dfGrad)" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
      {FREQUENCY_LABELS.map(f => <div key={f} className="absolute left-1 text-[7px] font-mono text-[oklch(0.35_0.06_145)] whitespace-nowrap pointer-events-none" style={{ top: `${(PADDING_ZONE + freqToProgress(f) * (1 - PADDING_ZONE)) * 100}%`, transform: 'translateY(-50%)' }}>{f >= 1000 ? `${f/1000}k` : f}</div>)}
      <div className="absolute left-1 text-[7px] font-mono text-[oklch(0.35_0.06_145)] whitespace-nowrap pointer-events-none" style={{ top: '0%', transform: 'translateY(0)' }}>0</div>
      <motion.div className="absolute text-[9px] font-mono text-[oklch(0.50_0.08_145)] whitespace-nowrap pointer-events-none text-right" style={{ right: `calc(100% - ${dotX}% + 10px)`, top: `${freqState.progress * 100}%`, transform: "translateY(-50%)" }}>{formatFrequency(freqState.frequency)}</motion.div>
      <motion.div className="absolute w-2.5 h-2.5 rounded-full bg-[oklch(0.70_0.10_145)] pointer-events-none" style={{ left: `calc(${dotX}% - 5px)`, top: `${freqState.progress * 100}%`, transform: "translateY(-50%)", boxShadow: "0 0 8px oklch(0.55 0.10 145 / 0.8)" }} />
    </div>
  );
}

// Navigation header
function NavigationHeader({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const navItems = [
    { href: "#", label: "home", primary: false },
    { href: "#projects", label: "projects", primary: false },
    { href: "#bio", label: "bio", primary: false },
    { href: "#contact", label: "contact", primary: true },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    if (target === "#") containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    else document.getElementById(target.substring(1))?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-16 lg:right-20 z-40 p-3 flex gap-2 flex-wrap bg-gradient-to-b from-[oklch(0.16_0.01_145)] via-[oklch(0.14_0.01_145/0.6)] to-transparent">
      {navItems.map(item => <a key={item.href} href={item.href} onClick={e => scrollTo(e, item.href)} style={item.primary ? { backgroundColor: 'oklch(0.45 0.10 145)', borderColor: 'oklch(0.45 0.10 145)', color: 'oklch(0.95 0.02 145)' } : { borderColor: 'oklch(0.50 0.04 145)', color: 'oklch(0.75 0.03 145)' }} className="px-3 py-1.5 border text-xs font-mono hover:opacity-80 transition-all">{item.label}</a>)}
    </header>
  );
}

function FilmGrainOverlay() {
  return <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.025]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.8' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />;
}

function NoiseOverlay() {
  return <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.06]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.3' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />;
}

function BackgroundImage({ url }: { url: string }) {
  return <div className="fixed right-0 bottom-0 w-1/2 h-2/3 opacity-20" style={{ backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'bottom right', maskImage: 'linear-gradient(to left, black 30%, transparent 100%)' }} />;
}

function AtmosphericEffects() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 80% at 20% 100%, oklch(0.25 0.08 145 / 0.12), transparent), radial-gradient(ellipse 80% 60% at 80% 20%, oklch(0.30 0.06 180 / 0.08), transparent)" }} animate={{ opacity: [0.4, 0.55, 0.4] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
      </div>
    </>
  );
}

function HeroSection() {
  return (
    <section className="min-h-screen flex items-center justify-center relative px-6">
      <div className="absolute inset-0 -z-10" style={{ background: "linear-gradient(to bottom, transparent, oklch(0.16 0.01 145))" }} />
      <motion.div className="text-center max-w-2xl relative z-10" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}>
        <h1 className="font-[family-name:var(--font-cormorant)] text-5xl sm:text-6xl md:text-7xl font-light tracking-wide text-[oklch(0.95_0.02_145)]">Ramiro Chen</h1>
      </motion.div>
    </section>
  );
}

function ProjectsSection({ onHoverProject }: { onHoverProject: (name: string | null) => void }) {
  const rotations = [-3, 2, -1.5, 2];
  const offsets = [{ x: 'calc(50% - 140px)', y: '0' }, { x: 'calc(50% - 80px)', y: '80px' }, { x: 'calc(50% - 120px)', y: '160px' }, { x: 'calc(50% - 60px)', y: '240px' }];

  return (
    <section id="projects" className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex justify-center" style={{ minHeight: '400px' }}>
          {projects.map((p, i) => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="group absolute w-64 md:w-72 block" style={{ left: offsets[i].x, top: offsets[i].y, zIndex: 10 - i, transform: `rotate(${rotations[i]}deg)` }} onMouseEnter={() => onHoverProject(p.name)} onMouseLeave={() => onHoverProject(null)}>
              <div className={`p-4 bg-[oklch(0.16_0.01_145/0.7)] backdrop-blur-[1px] shadow-[0_0_25px_oklch(0.30_0.06_145/0.25)] group-hover:shadow-[0_0_35px_oklch(0.40_0.08_145/0.35)] group-hover:scale-[1.05] transition-all duration-200 cursor-pointer border border-[oklch(0.30_0.04_145/0.3)] ${p.textAlign === 'right' ? 'text-right' : ''}`} style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                <div className="flex items-baseline justify-between mb-1">
                  {p.textAlign === 'right' ? (
                    <>
                      <Github className="w-3.5 h-3.5 text-[oklch(0.40_0.04_145)] group-hover:text-[oklch(0.55_0.08_145)] transition-colors" />
                      <h3 className="font-[family-name:var(--font-cormorant)] text-lg text-[oklch(0.80_0.02_145)] group-hover:text-[oklch(0.90_0.04_145)] transition-colors">{p.name}</h3>
                    </>
                  ) : (
                    <>
                      <h3 className="font-[family-name:var(--font-cormorant)] text-lg text-[oklch(0.80_0.02_145)] group-hover:text-[oklch(0.90_0.04_145)] transition-colors">{p.name}</h3>
                      <Github className="w-3.5 h-3.5 text-[oklch(0.40_0.04_145)] group-hover:text-[oklch(0.55_0.08_145)] transition-colors" />
                    </>
                  )}
                </div>
                <p className="text-xs text-[oklch(0.50_0.04_145)]">{p.desc}</p>
                <p className="text-[10px] text-[oklch(0.35_0.04_145)] mt-1 font-mono">{p.tech}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceSection() {
  // Single experience, similar styling but with teal/blue color scheme
  const exp = experiences[0];
  // Position it centered with slight rotation
  const rotation = 2;
  const offset = { x: 'calc(50% - 100px)', y: '0' };

  return (
    <section id="experience" className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative flex justify-center" style={{ minHeight: '200px' }}>
          <div 
            className="w-64 md:w-72 p-4 bg-[oklch(0.16_0.01_180/0.7)] backdrop-blur-[1px] shadow-[0_0_25px_oklch(0.30_0.06_180/0.25)] hover:shadow-[0_0_35px_oklch(0.40_0.08_180/0.35)] hover:scale-[1.05] transition-all duration-200 cursor-default border border-[oklch(0.30_0.04_180/0.3)]"
            style={{ 
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
              left: offset.x,
              top: offset.y,
              transform: `rotate(${rotation}deg)`
            }}
          >
            <div className="flex items-baseline justify-between mb-1">
              <Briefcase className="w-3.5 h-3.5 text-[oklch(0.40_0.04_180)]" />
              <h3 className="font-[family-name:var(--font-cormorant)] text-lg text-[oklch(0.80_0.02_180)]">{exp.position}</h3>
            </div>
            <p className="text-xs text-[oklch(0.50_0.04_180)] font-semibold">{exp.company}</p>
            <p className="text-[10px] text-[oklch(0.35_0.04_180)] mt-1 font-mono">{exp.period}</p>
            <p className="text-xs text-[oklch(0.50_0.04_180)] mt-2">{exp.description}</p>
            <p className="text-[10px] text-[oklch(0.35_0.04_180)] mt-2 font-mono">{exp.tech}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function BioSection() {
  return (
    <section id="bio" className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div className="relative z-10 flex items-center gap-6" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.2 }}>
          <p className="font-[family-name:var(--font-crimson)] text-base md:text-lg leading-relaxed text-[oklch(0.75_0.03_145)]">I'm Ramiro. I have a lot of interests. This portfolio site shows just some of them. Well, at least, the most notable ones I can think of.</p>
          <motion.img src="/images/buffalo.avif" alt="" className="w-32 md:w-44 rounded-sm opacity-50 grayscale-[20%] shadow-[0_0_20px_oklch(0.35_0.06_145/0.3)] shrink-0" initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 0.5, x: 0 }} viewport={{ once: true }} />
        </motion.div>
      </div>
    </section>
  );
}

function EnvironmentGallery() {
  const rotations = [-5, 4, -3, 3, -2];
  // Pentagon/star formation
  const offsets = [
    { x: '80px', y: '0' },      // top (uncle-boonmee)
    { x: '20px', y: '150px' },  // bottom left (7850650c - smaller)
    { x: '160px', y: '160px' }, // bottom right (synecdoche - more down, above esports)
    { x: '150px', y: '70px' },  // top right (esports)
    { x: '0px', y: '70px' },    // top left (Youth.Hard.Times - bigger)
  ];
  // Custom z-index to ensure synecdoche (index 2) is above esports (index 3)
  const zIndices = [0, 1, 4, 3, 2];

  return (
    <section className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-center gap-24">
          <div className="relative w-64 md:w-72" style={{ minHeight: '240px' }}>
            {environmentImageIds.map((img, i) => (
              <motion.div 
                key={i} 
                className={`absolute overflow-hidden rounded-sm shadow-[0_0_15px_oklch(0.35_0.06_145/0.25)] ${img.sizeClass}`}
                style={{ left: offsets[i].x, top: offsets[i].y, transform: `rotate(${rotations[i]}deg)`, zIndex: 10 + zIndices[i] }}
                initial={{ opacity: 0, y: 10 }} 
                whileInView={{ opacity: 0.85, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: i * 0.1 }}
              >
                <img src={img.src} alt="" className="w-full h-full object-cover grayscale-[25%] hover:grayscale-0 transition-all duration-400" />
              </motion.div>
            ))}
          </div>
          <div className="text-left">
            <motion.p className="font-[family-name:var(--font-crimson)] text-base text-[oklch(0.60_0.04_145)] italic mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Some of the many things I love.</motion.p>
            <motion.ul className="font-[family-name:var(--font-crimson)] text-base text-[oklch(0.60_0.04_145)] list-none pl-0" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <li>- ML</li>
              <li>- data compression</li>
              <li>- environment</li>
              <li>- triathlon</li>
              <li>- and more...</li>
            </motion.ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section id="contact" className="relative py-24 px-6">
      <div className="max-w-sm mx-auto text-center">
        <div className="flex justify-center gap-4 relative z-10">
          <a href="mailto:ramiro.chen@outlook.com" style={{ borderColor: 'oklch(0.30 0.04 145 / 0.5)', color: 'oklch(0.55 0.04 145)' }} className="px-4 py-2 border text-xs font-mono hover:opacity-80 transition-all shadow-[0_0_10px_oklch(0.30_0.04_145/0.15)]">email</a>
          <a href="https://github.com/bcf30" target="_blank" rel="noopener noreferrer" style={{ borderColor: 'oklch(0.30 0.04 145 / 0.5)', color: 'oklch(0.55 0.04 145)' }} className="px-4 py-2 border text-xs font-mono hover:opacity-80 transition-all shadow-[0_0_10px_oklch(0.30_0.04_145/0.15)]">github</a>
          <a href="/pdf/Ramiro_Chen New Resume.pdf" target="_blank" rel="noopener noreferrer" style={{ borderColor: 'oklch(0.30 0.04 145 / 0.5)', color: 'oklch(0.55 0.04 145)' }} className="px-4 py-2 border text-xs font-mono hover:opacity-80 transition-all shadow-[0_0_10px_oklch(0.30_0.04_145/0.15)]">resume</a>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="py-10 text-center">
      <blockquote className="max-w-2xl mx-auto">
        <p className="font-[family-name:var(--font-crimson)] text-sm md:text-base leading-relaxed text-[oklch(0.60_0.03_145)] italic">&ldquo;It is said that all of us are by nature wild beasts and that our duty as human-beings is to become like trainers who keep their animals in check, and even teach them to perform tasks alien to their bestiality.&rdquo;</p>
        <cite className="block mt-3 text-xs text-[oklch(0.45_0.04_145)] not-italic font-mono">— Nakajima Ton, <span className="text-[oklch(0.50_0.08_145)]">Tropical Malady</span> (2004)</cite>
        <p className="mt-1 text-[9px] text-[oklch(0.35_0.04_145)] font-mono">(I don't actually know where it's from. I just remember it's the opening line in Tropical Malady.)</p>
      </blockquote>
    </footer>
  );
}

function ProjectHoverImages({ projects, hoveredProject }: { projects: Project[]; hoveredProject: string | null }) {
  return (
    <>
      {projects.map(p => p.img && (
        <motion.div 
          key={`img-${p.name}`} 
          className="fixed pointer-events-none z-35" 
          style={{ 
            ...p.imgPos, 
            width: p.imgSize?.width || 'auto',
            height: p.imgSize?.height || 'auto',
            maxWidth: p.imgSize?.maxWidth || 'none',
            maxHeight: p.imgSize?.maxHeight || 'none',
          }} 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: hoveredProject === p.name ? 0.6 : 0, scale: hoveredProject === p.name ? 1 : 0.9 }} 
          transition={{ duration: 0.3 }}
        >
          <img src={p.img} alt="" className="w-full h-full object-contain rounded-sm shadow-[0_0_40px_oklch(0.45_0.10_145/0.5)]" />
        </motion.div>
      ))}
    </>
  );
}

function PortalButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button onClick={onClick} className="fixed bottom-6 left-6 z-50 group" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <div className="w-7 h-10 border border-[oklch(0.35_0.04_55)] bg-[oklch(0.18_0.02_55)] rounded-t relative overflow-hidden group-hover:border-[oklch(0.50_0.08_340)] transition-colors shadow-[0_0_15px_oklch(0.25_0.04_55/0.4)]">
        <div className="absolute right-0.5 top-1/2 w-0.5 h-0.5 rounded-full bg-[oklch(0.45_0.04_55)]" />
      </div>
    </motion.button>
  );
}

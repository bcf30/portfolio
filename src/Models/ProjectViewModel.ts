/**
 * Project data model - represents a portfolio project
 */
export interface Project {
  name: string;
  url: string;
  desc: string;
  tech: string;
  img: string;
  imgPos: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  imgSize?: {
    width: string;
    height: string;
    maxWidth?: string;
    maxHeight?: string;
  };
  textAlign?: "left" | "right";
}

/**
 * Frequency response data point
 */
export interface FrequencyDataPoint {
  freq: number;
  db: number;
}

/**
 * Site-wide data constants
 * These would typically come from a database or CMS
 */
export const projects: Project[] = [
  { 
    name: "McDonaldsPy", 
    url: "https://github.com/bcf30/mcdonaldspy", 
    desc: "Selenium automation", 
    tech: "Selenium", 
    img: "/images/Screenshot 2026-03-04 144838.avif", 
    imgPos: { top: "15%", left: "5%" },
    imgSize: { width: "320px", height: "auto" }
  },
  { 
    name: "trans-writes", 
    url: "https://github.com/bcf30/trans-writes", 
    desc: "Lossy compression via dithering", 
    tech: "Tkinter, Pillow, scikit-image", 
    img: "/images/Screenshot 2026-02-24 202456.avif", 
    imgPos: { top: "25%", right: "8%" },
    imgSize: { width: "280px", height: "auto" },
    textAlign: "right"
  },
  { 
    name: "fashion-mnist", 
    url: "https://github.com/bcf30/fashion-mnist-image-classification", 
    desc: "AI image classification", 
    tech: "PyTorch, matplotlib", 
    img: "/images/Screenshot 2026-03-04 145116.avif", 
    imgPos: { bottom: "30%", left: "10%" },
    imgSize: { width: "300px", height: "auto" }
  },
  { 
    name: "filearchiver", 
    url: "https://github.com/bcf30/filearchiver", 
    desc: "File archiver utility", 
    tech: ".NET 8, C#", 
    img: "/images/Screenshot 2026-03-04 145243.avif", 
    imgPos: { bottom: "20%", right: "15%" },
    imgSize: { width: "260px", height: "auto" },
    textAlign: "right"
  },
];

/**
 * Frequency response curve data (20Hz - 20kHz)
 * Represents
 */
export const frequencyResponseData: FrequencyDataPoint[] = [
  { freq: 20, db: -4 }, { freq: 30, db: -3.5 }, { freq: 50, db: -3 }, { freq: 70, db: -2.5 },
  { freq: 100, db: -2 }, { freq: 150, db: -2 }, { freq: 200, db: -2 }, { freq: 300, db: -1.5 },
  { freq: 500, db: -2 }, { freq: 700, db: -1.5 }, { freq: 1000, db: -1 },
  { freq: 1200, db: 0 }, { freq: 1400, db: 1 }, { freq: 1600, db: 2.5 }, { freq: 1800, db: 4.5 },
  { freq: 2000, db: 6.5 }, { freq: 2200, db: 8 }, { freq: 2500, db: 9 }, { freq: 2700, db: 9.5 },
  { freq: 3000, db: 9 }, { freq: 3500, db: 8.5 }, { freq: 4000, db: 7 }, { freq: 5000, db: 4 },
  { freq: 6000, db: 1 }, { freq: 7000, db: -2 }, { freq: 8000, db: -5 }, { freq: 9000, db: -6 },
  { freq: 10000, db: -4 }, { freq: 11000, db: -2 }, { freq: 12000, db: -5 }, { freq: 13000, db: -8 },
  { freq: 14000, db: -6 }, { freq: 15000, db: -8 }, { freq: 16000, db: -5 }, { freq: 17000, db: -10 },
  { freq: 18000, db: -16 }, { freq: 19000, db: -22 }, { freq: 20000, db: -30 },
];

/**
 * Unsplash image IDs for environmental imagery
 */
export const environmentImageIds: { src: string; sizeClass: string }[] = [
  { src: "/images/grid/uncle-boonmee-who-can-recall-his-past-lives-md-web.avif", sizeClass: "w-36 md:w-40" },
  { src: "/images/grid/7850650c-8459-4325-8a3c-b05b2209aeaa1.avif", sizeClass: "w-28 md:w-32" },
  { src: "/images/grid/esports-full-edition.avif", sizeClass: "w-36 md:w-40" },
  { src: "/images/grid/synecdoche.avif", sizeClass: "w-44 md:w-52" },
  { src: "/images/grid/Youth.Hard.Times.2025.1080p.WEB-DL.AAC2.0.x264.mkv_snapshot_01.54.35.593.avif", sizeClass: "w-40 md:w-48" },
];



/**
 * Frequency Response Calculation Helpers
 * 
 * These utilities handle the logarithmic frequency mapping
 * for the scrollbar visualization (20Hz - 20kHz range)
 */

import { frequencyResponseData, FrequencyDataPoint } from "../Models/ProjectViewModel";

/**
 * Logarithmic frequency boundaries
 */
export const LOG_20 = Math.log10(20);
export const LOG_20K = Math.log10(20000);
export const LOG_RANGE = LOG_20K - LOG_20;

/**
 * Padding zone at the start of the scroll (5% for 0-20Hz display)
 */
export const PADDING_ZONE = 0.05;

/**
 * Get the dB value at a specific frequency using linear interpolation
 * @param f - Frequency in Hz
 */
export function getDbAtFreq(f: number): number {
  if (f <= 20) return frequencyResponseData[0].db;
  if (f >= 20000) return frequencyResponseData[frequencyResponseData.length - 1].db;
  
  for (let i = 0; i < frequencyResponseData.length - 1; i++) {
    if (f >= frequencyResponseData[i].freq && f <= frequencyResponseData[i + 1].freq) {
      const t = (Math.log10(f) - Math.log10(frequencyResponseData[i].freq)) / 
                (Math.log10(frequencyResponseData[i + 1].freq) - Math.log10(frequencyResponseData[i].freq));
      return frequencyResponseData[i].db + t * (frequencyResponseData[i + 1].db - frequencyResponseData[i].db);
    }
  }
  return frequencyResponseData[0].db;
}

/**
 * Convert frequency to scroll progress percentage (0-1)
 * @param f - Frequency in Hz
 */
export function freqToProgress(f: number): number {
  return (Math.log10(f) - LOG_20) / LOG_RANGE;
}

/**
 * Format frequency for display
 * @param f - Frequency in Hz
 */
export function formatFrequency(f: number): string {
  if (f < 20) return `${Math.round(f)}Hz`;
  if (f < 1000) return `${Math.round(f)}Hz`;
  return `${(f / 1000).toFixed(1)}kHz`;
}

/**
 * Format seconds to MM:SS time format
 * @param seconds - Time in seconds
 */
export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;
}

/**
 * Calculate SVG path for the frequency response curve
 * Returns a path string for SVG rendering
 */
export function calculateFrequencyPath(): string {
  return frequencyResponseData.map((d: FrequencyDataPoint, i: number) => {
    const y = freqToProgress(d.freq) * 100;
    const x = 100 - ((d.db + 30) / 40) * 50;
    return i === 0 ? `M ${x.toFixed(2)} 0` : `L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

/**
 * Calculate X position for the frequency dot on the graph
 * @param db - Decibel value
 */
export function calculateDotX(db: number): number {
  return 100 - ((db + 30) / 40) * 50;
}

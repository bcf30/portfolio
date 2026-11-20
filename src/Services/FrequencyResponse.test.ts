import { describe, it, expect } from "vitest";
import {
  getDbAtFreq,
  freqToProgress,
  formatFrequency,
  formatTime,
  calculateFrequencyPath,
  calculateDotX,
} from "./FrequencyResponse";
import { frequencyResponseData } from "../Models/ProjectViewModel";

describe("getDbAtFreq", () => {
  it("returns the exact value at every data point", () => {
    for (const point of frequencyResponseData) {
      expect(getDbAtFreq(point.freq)).toBeCloseTo(point.db, 10);
    }
  });

  it("interpolates on a log scale between points", () => {
    // Geometric mean of 1000 Hz (-1 dB) and 1200 Hz (0 dB) is halfway on a log axis
    expect(getDbAtFreq(Math.sqrt(1000 * 1200))).toBeCloseTo(-0.5, 10);
  });

  it("clamps below 20 Hz and above 20 kHz", () => {
    expect(getDbAtFreq(5)).toBe(-4);
    expect(getDbAtFreq(50000)).toBe(-30);
  });
});

describe("freqToProgress", () => {
  it("maps 20 Hz to 0 and 20 kHz to 1", () => {
    expect(freqToProgress(20)).toBeCloseTo(0, 10);
    expect(freqToProgress(20000)).toBeCloseTo(1, 10);
  });

  it("maps 632 Hz (log midpoint) to 0.5", () => {
    expect(freqToProgress(Math.sqrt(20 * 20000))).toBeCloseTo(0.5, 10);
  });
});

describe("formatFrequency", () => {
  it.each([
    [0, "0Hz"],
    [5.4, "5Hz"],
    [500, "500Hz"],
    [999.4, "999Hz"],
    [1000, "1.0kHz"],
    [2500, "2.5kHz"],
    [20000, "20.0kHz"],
  ])("formats %d as %s", (input, expected) => {
    expect(formatFrequency(input)).toBe(expected);
  });
});

describe("formatTime", () => {
  it.each([
    [900, "15:00"],
    [65, "1:05"],
    [9, "0:09"],
    [0, "0:00"],
  ])("formats %d seconds as %s", (input, expected) => {
    expect(formatTime(input)).toBe(expected);
  });
});

describe("calculateDotX", () => {
  it("puts -30 dB at the right edge and +10 dB at the middle", () => {
    expect(calculateDotX(-30)).toBe(100);
    expect(calculateDotX(10)).toBe(50);
  });
});

describe("calculateFrequencyPath", () => {
  it("starts with a move and draws one line per remaining point", () => {
    const path = calculateFrequencyPath();
    expect(path.startsWith("M ")).toBe(true);
    expect(path.match(/L /g)).toHaveLength(frequencyResponseData.length - 1);
  });

  it("ends at the bottom of the graph", () => {
    expect(calculateFrequencyPath().endsWith(" 100.00")).toBe(true);
  });
});

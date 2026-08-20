/**
 * Parses RGB values from a color string
 * @param colorString - RGB color string like "rgb(45, 39, 47)"
 * @returns Object with r, g, b values or null if parsing fails
 */
export const parseRGB = (
  colorString: string
): { r: number; g: number; b: number } | null => {
  const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  return null;
};

/**
 * Checks if two RGB colors are within the specified threshold (20%)
 * @param color1 - First RGB color object
 * @param color2 - Second RGB color object
 * @param threshold - Percentage threshold (default 0.2 for 20%)
 * @returns true if colors are within threshold
 */
export const areColorsSimilar = (
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  threshold: number = 0.2
): boolean => {
  // Check each RGB component
  const rDiff = Math.abs(color1.r - color2.r) / 255;
  const gDiff = Math.abs(color1.g - color2.g) / 255;
  const bDiff = Math.abs(color1.b - color2.b) / 255;
  const differentPercent = rDiff + gDiff + bDiff;

  // All components must be within threshold
  const isSimilar = differentPercent <= threshold;
  if (isSimilar) {
    console.log(
      `Colors ${JSON.stringify(color1)} vs ${JSON.stringify(
        color2
      )} different percentage: ${Math.round(differentPercent * 100)}%`
    );
  }
  return isSimilar;
};

/**
 * Extracts RGB colors from strip data and returns a normalized, sorted array
 * @param strips - Array of strip data objects with color property
 * @returns Sorted array of RGB color strings (normalized for comparison)
 */
export const extractAndNormalizeColors = (strips: any[]): string[] => {
  if (!strips || strips.length === 0) return [];

  const colors = strips
    .map((strip) => strip.color)
    .filter((color) => color && typeof color === "string")
    .map((color) => {
      // Normalize RGB format: handle variations like "rgb(45, 39, 47)" or "RGB(45,39,47)"
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
      if (rgbMatch) {
        const r = parseInt(rgbMatch[1], 10);
        const g = parseInt(rgbMatch[2], 10);
        const b = parseInt(rgbMatch[3], 10);
        // Return normalized format: "rgb(r, g, b)" with consistent spacing
        return `rgb(${r}, ${g}, ${b})`;
      }
      return color.toLowerCase().trim();
    });

  // Sort colors to make comparison order-independent
  return colors.sort();
};

/**
 * Checks if two color arrays match using threshold-based comparison
 * @param colors1 - First array of RGB color strings
 * @param colors2 - Second array of RGB color strings
 * @param threshold - Percentage threshold
 * @returns true if all colors can be matched within threshold
 */
export const doColorArraysMatch = (
  colors1: string[],
  colors2: string[],
  threshold: number
): boolean => {
  // Must have same number of colors
  if (colors1.length !== colors2.length) {
    return false;
  }

  // Parse RGB values for all colors
  const rgb1 = colors1.map(parseRGB).filter((rgb) => rgb !== null) as Array<{
    r: number;
    g: number;
    b: number;
  }>;
  const rgb2 = colors2.map(parseRGB).filter((rgb) => rgb !== null) as Array<{
    r: number;
    g: number;
    b: number;
  }>;

  // If we couldn't parse all colors, fall back to exact string comparison
  if (rgb1.length !== colors1.length || rgb2.length !== colors2.length) {
    return colors1.join("|") === colors2.join("|");
  }

  // Try to match each color in colors1 with a color in colors2
  const usedIndices = new Set<number>();

  for (const color1 of rgb1) {
    let matched = false;
    for (let i = 0; i < rgb2.length; i++) {
      if (usedIndices.has(i)) continue; // Skip already matched colors

      if (areColorsSimilar(color1, rgb2[i], threshold)) {
        usedIndices.add(i);
        matched = true;
      }
      break;
    }
    if (!matched) {
      return false; // Couldn't find a match for this color
    }
  }

  return true; // All colors matched
};

/**
 * Checks if a color combination already exists in previously scanned sides
 * Uses 20% threshold for RGB color comparison to account for lighting variations
 * @param newColors - Array of RGB color strings from current side
 * @param accumulatedData - Previously accumulated strip data
 * @returns true if duplicate combination found, false otherwise
 */
export const isDuplicateColorCombination = (
  newColors: string[],
  accumulatedData: Array<{ sideNumber: number; strips: any[] }>,
  threshold: number
): boolean => {
  if (newColors.length === 0 || accumulatedData.length === 0) {
    return false;
  }

  // Check each previously scanned side
  for (const side of accumulatedData) {
    const existingColors = extractAndNormalizeColors(side.strips);
    if (existingColors.length === 0) continue;

    // Compare color arrays using threshold-based matching
    if (doColorArraysMatch(newColors, existingColors, threshold)) {
      return true;
    }
  }

  return false;
};

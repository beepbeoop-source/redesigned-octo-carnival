/**
 * Color Extractor & Dynamic Theme Palette Generator
 * Extracts the primary vibrant accent color from the uploaded store logo
 * and applies the full 50-950 shade palette dynamically across the entire application.
 */

export interface HSLColor {
  h: number // 0 - 360
  s: number // 0 - 100
  l: number // 0 - 100
}

export interface RGBColor {
  r: number
  g: number
  b: number
}

const BRAND_STORAGE_KEY = 'store_extracted_brand_color'

// Default Emerald fallback palette (#059669 / #10b981)
export const DEFAULT_BRAND_PALETTE: Record<string, string> = {
  '50': '#ecfdf5',
  '100': '#d1fae5',
  '200': '#a7f3d0',
  '300': '#6ee7b7',
  '400': '#34d399',
  '500': '#10b981',
  '600': '#059669',
  '700': '#047857',
  '800': '#065f46',
  '900': '#064e3b',
  '950': '#022c22'
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): HSLColor {
  const normR = r / 255
  const normG = g / 255
  const normB = b / 255

  const max = Math.max(normR, normG, normB)
  const min = Math.min(normR, normG, normB)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case normR:
        h = (normG - normB) / d + (normG < normB ? 6 : 0)
        break
      case normG:
        h = (normB - normR) / d + 2
        break
      case normB:
        h = (normR - normG) / d + 4
        break
    }
    h *= 60
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Convert HSL to Hex string (#rrggbb)
 */
function hslToHex(h: number, s: number, l: number): string {
  const normS = s / 100
  const normL = l / 100

  const c = (1 - Math.abs(2 * normL - 1)) * normS
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = normL - c / 2
  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  const toHex = (val: number) => {
    const hex = Math.round((val + m) * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Generate a harmonious 50..950 Tailwind-like palette from a base color
 */
export function generatePalette(baseHsl: HSLColor): Record<string, string> {
  const { h, s } = baseHsl
  const adjustedSat = Math.max(s, 40) // Ensure enough vibrance

  return {
    '50': hslToHex(h, Math.min(adjustedSat, 80), 96),
    '100': hslToHex(h, Math.min(adjustedSat, 85), 90),
    '200': hslToHex(h, Math.min(adjustedSat, 85), 80),
    '300': hslToHex(h, Math.min(adjustedSat, 85), 68),
    '400': hslToHex(h, Math.min(adjustedSat, 85), 56),
    '500': hslToHex(h, adjustedSat, 48),
    '600': hslToHex(h, Math.min(adjustedSat + 5, 100), 38),
    '700': hslToHex(h, Math.min(adjustedSat + 5, 100), 30),
    '800': hslToHex(h, Math.min(adjustedSat + 10, 100), 22),
    '900': hslToHex(h, Math.min(adjustedSat + 10, 100), 16),
    '950': hslToHex(h, Math.min(adjustedSat + 15, 100), 10)
  }
}

/**
 * Apply the palette CSS variables to the document root element
 */
export function applyPaletteToDom(palette: Record<string, string>) {
  const root = document.documentElement
  Object.entries(palette).forEach(([shade, hex]) => {
    root.style.setProperty(`--brand-${shade}`, hex)
  })
}

/**
 * Extract dominant vibrant color from an image URL using offscreen canvas
 */
export async function extractDominantColorFromImage(imageUrl: string): Promise<HSLColor | null> {
  return new Promise((resolve) => {
    if (!imageUrl || typeof window === 'undefined') {
      resolve(null)
      return
    }

    const img = new Image()
    img.crossOrigin = 'Anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          resolve(null)
          return
        }

        const size = 64
        canvas.width = size
        canvas.height = size
        ctx.drawImage(img, 0, 0, size, size)

        const imageData = ctx.getImageData(0, 0, size, size)
        const data = imageData.data
        const colorBuckets: { hsl: HSLColor; score: number }[] = []

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          const a = data[i + 3]

          // Ignore transparent or near-transparent pixels
          if (a < 128) continue

          // Ignore near white
          if (r > 238 && g > 238 && b > 238) continue

          // Ignore near black
          if (r < 24 && g < 24 && b < 24) continue

          // Ignore unsaturated grays
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          if (max - min < 20) continue

          const hsl = rgbToHsl(r, g, b)

          // We prefer saturated, clear colors with good contrast (lightness between 25% and 75%)
          if (hsl.s >= 25 && hsl.l >= 20 && hsl.l <= 80) {
            // Calculate vibrance score (favor saturation and balanced lightness)
            const score = hsl.s * (1 - Math.abs(hsl.l - 50) / 60)
            colorBuckets.push({ hsl, score })
          }
        }

        if (colorBuckets.length === 0) {
          resolve(null)
          return
        }

        // Sort by vibrance score and take the highest scoring color cluster
        colorBuckets.sort((a, b) => b.score - a.score)
        resolve(colorBuckets[0].hsl)
      } catch (err) {
        console.warn('Canvas color extraction error:', err)
        resolve(null)
      }
    }

    img.onerror = () => {
      resolve(null)
    }

    img.src = imageUrl
  })
}

/**
 * Main Controller: Extract brand color from logo and apply across UI
 */
export async function updateAppBrandFromLogo(logoUrl: string | null | undefined): Promise<void> {
  if (!logoUrl) {
    applyPaletteToDom(DEFAULT_BRAND_PALETTE)
    localStorage.removeItem(BRAND_STORAGE_KEY)
    return
  }

  // Check if we already cached this logo's palette
  try {
    const cached = localStorage.getItem(BRAND_STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.logoUrl === logoUrl && parsed.palette) {
        applyPaletteToDom(parsed.palette)
        return
      }
    }
  } catch {
    // ignore
  }

  const hsl = await extractDominantColorFromImage(logoUrl)
  if (hsl) {
    const palette = generatePalette(hsl)
    applyPaletteToDom(palette)
    try {
      localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify({ logoUrl, palette }))
    } catch {
      // ignore
    }
  } else {
    applyPaletteToDom(DEFAULT_BRAND_PALETTE)
  }
}

/**
 * Initial fast boot application from cache
 */
export function initCachedBrandColor() {
  if (typeof window === 'undefined') return
  try {
    const cached = localStorage.getItem(BRAND_STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      if (parsed.palette) {
        applyPaletteToDom(parsed.palette)
        return
      }
    }
  } catch {
    // fallback
  }
  applyPaletteToDom(DEFAULT_BRAND_PALETTE)
}

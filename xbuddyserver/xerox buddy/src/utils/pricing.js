// Pricing constants
export const RATES = {
  bw: 2,     // ₹2 per page for Black & White
  color: 5,  // ₹5 per page for Color
}

/**
 * Calculate effective pages based on double-side setting.
 * Double side: ceil(pages / 2) sheets, but you still pay per page printed.
 * For cost: double side means fewer sheets but same pages — price stays per page.
 * Common shop logic: double side = same page count, just printed both sides.
 * So price = pages × rate × copies (double side doesn't reduce cost, just paper).
 * 
 * However per the spec: "Double side: Reduce page count calculation accordingly"
 * → double side halves the effective page count for billing.
 */
export function calcEffectivePages(totalPages, isDoubleSide) {
  if (isDoubleSide) return Math.ceil(totalPages / 2)
  return totalPages
}

export function calcTotal({ totalPages, colorMode, isDoubleSide, copies }) {
  const effectivePages = calcEffectivePages(totalPages, isDoubleSide)
  const ratePerPage = colorMode === 'color' ? RATES.color : RATES.bw
  return effectivePages * ratePerPage * copies
}

// Estimate print time: ~8 seconds per page (single side), ~12s double side
export function estimatePrintTime(totalPages, isDoubleSide, copies) {
  const secsPerPage = isDoubleSide ? 6 : 8
  const totalSecs = totalPages * copies * secsPerPage
  if (totalSecs < 60) return `~${totalSecs} seconds`
  return `~${Math.ceil(totalSecs / 60)} minute${Math.ceil(totalSecs / 60) > 1 ? 's' : ''}`
}

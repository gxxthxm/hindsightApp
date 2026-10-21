/** Human labels for the confidence slider. */
export function confidenceLabel(confidence: number): string {
  if (confidence >= 100) return 'Certain (really?)'
  if (confidence >= 90) return 'Very sure'
  if (confidence >= 80) return 'Confident'
  if (confidence >= 70) return 'Fairly sure'
  if (confidence >= 60) return 'Leaning'
  return 'Coin flip'
}

export const CONFIDENCE_MIN = 50
export const CONFIDENCE_MAX = 100
export const CONFIDENCE_STEP = 5

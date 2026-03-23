// Calcul statistique pour les tests A/B
// Z-test sur les proportions (standard industrie)

export type VariantStats = {
  variantId: string
  name: string
  isControl: boolean
  views: number
  conversions: number
  conversionRate: number
  uplift: number | null
  confidence: number
  isSignificant: boolean
  isWinner: boolean
}

export type ExperimentResults = {
  totalViews: number
  totalConversions: number
  variants: VariantStats[]
  hasWinner: boolean
  sampleSizeNeeded: number | null // visiteurs par variation pour 95% de confiance
  daysToSignificance: number | null // estimation
}

function normalCDF(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1.0 + sign * y)
}

function zTest(cc: number, cv: number, vc: number, vv: number): number {
  if (cv === 0 || vv === 0) return 0
  const p1 = cc / cv, p2 = vc / vv
  const pooled = (cc + vc) / (cv + vv)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / cv + 1 / vv))
  return se === 0 ? 0 : (p2 - p1) / se
}

// Calcul du sample size nécessaire (formule de Lehr)
function sampleSizeNeeded(baseRate: number, minDetectableEffect: number = 0.05): number {
  if (baseRate <= 0 || baseRate >= 1) return 0
  const targetRate = baseRate * (1 + minDetectableEffect)
  const p1 = baseRate, p2 = targetRate
  // Formule standard pour α=0.05, puissance=0.80
  const n = (Math.pow(1.96 + 0.84, 2) * (p1 * (1 - p1) + p2 * (1 - p2))) / Math.pow(p2 - p1, 2)
  return Math.ceil(n)
}

export function computeResults(
  rawVariants: Array<{
    id: string
    name: string
    is_control: boolean
    views: number
    conversions: number
  }>,
  dailyVisitorsPerVariant?: number
): ExperimentResults {
  const control = rawVariants.find(v => v.is_control)
  const totalViews = rawVariants.reduce((s, v) => s + v.views, 0)
  const totalConversions = rawVariants.reduce((s, v) => s + v.conversions, 0)

  const variants: VariantStats[] = rawVariants.map(v => {
    const conversionRate = v.views > 0 ? v.conversions / v.views : 0
    let uplift: number | null = null
    let confidence = 0
    let isSignificant = false

    if (control && !v.is_control && control.views > 0) {
      const controlRate = control.views > 0 ? control.conversions / control.views : 0
      uplift = controlRate > 0 ? ((conversionRate - controlRate) / controlRate) * 100 : null
      const z = zTest(control.conversions, control.views, v.conversions, v.views)
      const pValue = 2 * (1 - normalCDF(Math.abs(z)))
      confidence = Math.min((1 - pValue) * 100, 99.9)
      isSignificant = confidence >= 95
    }

    return {
      variantId: v.id, name: v.name, isControl: v.is_control,
      views: v.views, conversions: v.conversions, conversionRate,
      uplift, confidence, isSignificant, isWinner: false,
    }
  })

  // Gagnant = meilleure variation significative avec uplift positif
  const significantVariants = variants.filter(v => !v.isControl && v.isSignificant && (v.uplift ?? 0) > 0)
  if (significantVariants.length > 0) {
    significantVariants.sort((a, b) => (b.uplift ?? 0) - (a.uplift ?? 0))[0].isWinner = true
  }

  // Sample size nécessaire
  let sampleSizeNeededVal: number | null = null
  let daysToSignificance: number | null = null

  if (control && control.views > 30) {
    const controlRate = control.conversions / control.views
    sampleSizeNeededVal = sampleSizeNeeded(controlRate)

    if (dailyVisitorsPerVariant && dailyVisitorsPerVariant > 0) {
      const remaining = Math.max(0, sampleSizeNeededVal - (control.views / rawVariants.length))
      daysToSignificance = Math.ceil(remaining / dailyVisitorsPerVariant)
    }
  }

  return {
    totalViews, totalConversions, variants,
    hasWinner: variants.some(v => v.isWinner),
    sampleSizeNeeded: sampleSizeNeededVal,
    daysToSignificance,
  }
}

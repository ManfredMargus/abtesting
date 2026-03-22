// Calcul statistique pour les tests A/B
// Utilise un Z-test sur les proportions (standard dans l'industrie)

export type VariantStats = {
  variantId: string
  name: string
  isControl: boolean
  views: number
  conversions: number
  conversionRate: number
  uplift: number | null       // % d'amélioration vs contrôle
  confidence: number          // % de confiance statistique (ex: 95%)
  isSignificant: boolean      // true si confidence >= 95%
  isWinner: boolean
}

export type ExperimentResults = {
  totalViews: number
  totalConversions: number
  variants: VariantStats[]
  hasWinner: boolean
}

// Approximation de la CDF de la loi normale
function normalCDF(x: number): number {
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)
  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  return 0.5 * (1.0 + sign * y)
}

// Z-test sur deux proportions
function zTest(
  controlConversions: number,
  controlViews: number,
  variantConversions: number,
  variantViews: number
): number {
  if (controlViews === 0 || variantViews === 0) return 0

  const p1 = controlConversions / controlViews
  const p2 = variantConversions / variantViews
  const pooled = (controlConversions + variantConversions) / (controlViews + variantViews)
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / controlViews + 1 / variantViews))

  if (se === 0) return 0
  return (p2 - p1) / se
}

export function computeResults(
  rawVariants: Array<{
    id: string
    name: string
    is_control: boolean
    views: number
    conversions: number
  }>
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
      variantId: v.id,
      name: v.name,
      isControl: v.is_control,
      views: v.views,
      conversions: v.conversions,
      conversionRate,
      uplift,
      confidence,
      isSignificant,
      isWinner: false,
    }
  })

  // Marquer le gagnant (la meilleure variation significative)
  const significantVariants = variants.filter(v => !v.isControl && v.isSignificant && (v.uplift ?? 0) > 0)
  if (significantVariants.length > 0) {
    const winner = significantVariants.sort((a, b) => (b.uplift ?? 0) - (a.uplift ?? 0))[0]
    winner.isWinner = true
  }

  return {
    totalViews,
    totalConversions,
    variants,
    hasWinner: variants.some(v => v.isWinner),
  }
}

const clamp01 = (n) => {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0
  return Math.max(0, Math.min(1, n))
}

const clampTo0_100 = (n) => Math.max(0, Math.min(100, n))

// Normalize each test to 0..100 using a benchmark and direction.
// Returns composite 0..100.
const calculateFitnessScore = (tests = []) => {
  const getScoreByType = (predicate) => {
    const found = tests.find((t) => predicate(String(t.test_type || '')))
    return found ? Number(found.score) : null
  }

  const sprint40m = getScoreByType((t) => /sprint/i.test(t) || /40m/i.test(t))
  const vo2max = getScoreByType((t) => /vo2|v\s*o\s*2/i.test(t))
  const illinois = getScoreByType((t) => /illinois/i.test(t))
  const vertical = getScoreByType((t) => /vertical/i.test(t))
  const yoyo = getScoreByType((t) => /yo-?yo/i.test(t) || /yoyo/i.test(t) || /yo\s*yo/i.test(t))

  // Benchmarks from spec:
  // - Sprint 40m: lower is better, benchmark 4.5s
  // - VO2 Max: higher is better, benchmark 60
  // - Illinois Agility: lower is better, benchmark 14.5s
  // - Vertical Jump: higher is better, benchmark 70cm
  // - Yo-Yo: higher level is better (no explicit benchmark provided in spec)
  const benchmarks = {
    sprint40m: { value: 4.5, higherIsBetter: false, weight: 0.2 },
    vo2max: { value: 60, higherIsBetter: true, weight: 0.25 },
    illinois: { value: 14.5, higherIsBetter: false, weight: 0.2 },
    vertical: { value: 70, higherIsBetter: true, weight: 0.15 },
    yoyo: { value: 20, higherIsBetter: true, weight: 0.2 } // TODO: confirm Yo-Yo benchmark mapping for v2
  }

  const computePart = (actual, { value: bench, higherIsBetter }) => {
    if (actual === null || Number.isNaN(actual)) return null
    if (bench <= 0) return null

    // Convert to a 0..100 score.
    // - higherIsBetter: (actual / bench) * 100
    // - lowerIsBetter: (bench / actual) * 100
    const raw = higherIsBetter ? (actual / bench) * 100 : (bench / actual) * 100
    return clampTo0_100(raw)
  }

  const parts = {
    sprint40m: computePart(sprint40m, benchmarks.sprint40m),
    vo2max: computePart(vo2max, benchmarks.vo2max),
    illinois: computePart(illinois, benchmarks.illinois),
    vertical: computePart(vertical, benchmarks.vertical),
    yoyo: computePart(yoyo, benchmarks.yoyo)
  }

  // If some tests are missing, renormalize weights across present tests.
  const presentWeightsSum = Object.entries(parts).reduce((sum, [k, score]) => {
    if (score === null) return sum
    return sum + benchmarks[k].weight
  }, 0)

  if (presentWeightsSum <= 0) return 0

  const composite = Object.entries(parts).reduce((acc, [k, score]) => {
    if (score === null) return acc
    const w = benchmarks[k].weight
    return acc + (score * (w / presentWeightsSum))
  }, 0)

  return Math.round(clampTo0_100(composite))
}

module.exports = { calculateFitnessScore }


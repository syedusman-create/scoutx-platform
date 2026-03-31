const AthleteModel = require('../models/athlete.model')

const parseNumber = (v) => {
  if (v === undefined || v === null || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

const searchAthletes = async (query = {}) => {
  const {
    position,
    minAge,
    maxAge,
    state,
    minFitness,
    isOpen,
    sport,
    sortBy,
    page,
    limit
  } = query

  const parsed = {
    position: position || undefined,
    minAge: parseNumber(minAge),
    maxAge: parseNumber(maxAge),
    state: state || undefined,
    minFitness: parseNumber(minFitness),
    isOpen: typeof isOpen === 'string' ? isOpen === 'true' : undefined,
    sport: sport || 'football',
    sortBy: sortBy || 'fitness_desc',
    page: parseNumber(page) || 1,
    limit: parseNumber(limit) || 20
  }

  // isOpen: only treat explicit true as boolean; if absent, don't filter.
  if (query.isOpen === undefined) parsed.isOpen = undefined
  if (query.isOpen === 'false') parsed.isOpen = false

  // Normalize sortBy values.
  if (!['fitness_desc', 'matches_desc', 'recent'].includes(parsed.sortBy)) {
    parsed.sortBy = 'fitness_desc'
  }

  return AthleteModel.searchAthletes(parsed)
}

module.exports = { searchAthletes }


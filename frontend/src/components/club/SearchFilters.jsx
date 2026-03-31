import React from 'react'

import { SPORT_OPTIONS } from '../../constants/sports.js'

export default function SearchFilters({ filters, onChange, onReset }) {
  return (
    <div className="card p-4">
      <div className="text-display text-2xl tracking-wide">Filters</div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-text2 text-xs">Sport</label>
          <select
            value={filters.sport}
            onChange={(e) => onChange('sport', e.target.value)}
            className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
          >
            {SPORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-text2 text-xs">Position</label>
          <input
            value={filters.position}
            onChange={(e) => onChange('position', e.target.value)}
            placeholder="Forward, Midfielder..."
            className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
          />
        </div>

        <div>
          <label className="text-text2 text-xs">State</label>
          <input
            value={filters.state}
            onChange={(e) => onChange('state', e.target.value)}
            placeholder="Delhi"
            className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
          />
        </div>

        <div>
          <label className="text-text2 text-xs">Min Fitness</label>
          <input
            type="number"
            value={filters.minFitness}
            onChange={(e) => onChange('minFitness', e.target.value)}
            placeholder="60"
            className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
          />
        </div>

        <div>
          <label className="text-text2 text-xs">Min Age</label>
          <input
            type="number"
            value={filters.minAge}
            onChange={(e) => onChange('minAge', e.target.value)}
            placeholder="16"
            className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
          />
        </div>

        <div>
          <label className="text-text2 text-xs">Max Age</label>
          <input
            type="number"
            value={filters.maxAge}
            onChange={(e) => onChange('maxAge', e.target.value)}
            placeholder="25"
            className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
          />
        </div>

        <div>
          <label className="text-text2 text-xs">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onChange('sortBy', e.target.value)}
            className="mt-1 w-full rounded-md bg-raised border border-edge px-3 py-2 text-text1 outline-none focus:border-lime"
          >
            <option value="fitness_desc">Fitness Desc</option>
            <option value="matches_desc">Matches Desc</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-text2 text-sm">
          <input
            type="checkbox"
            checked={filters.isOpen}
            onChange={(e) => onChange('isOpen', e.target.checked)}
            className="accent-lime"
          />
          Open to opportunities only
        </label>

        <button
          onClick={onReset}
          className="btn-secondary text-xs"
        >
          Reset
        </button>
      </div>
    </div>
  )
}


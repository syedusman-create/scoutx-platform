import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listChallengesApi,
  joinChallengeApi,
  leaveChallengeApi,
  listMyChallengeProgressApi,
  listLeaderboardsApi,
  listAchievementsApi,
  listMyAchievementsApi
} from '../api/gamification.api'

export default function GamificationHub() {
  const qc = useQueryClient()

  const challengesQ = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => (await listChallengesApi()).data?.data || []
  })
  const myProgressQ = useQuery({
    queryKey: ['challenge-progress-me'],
    queryFn: async () => (await listMyChallengeProgressApi()).data?.data || []
  })
  const leaderboardsQ = useQuery({
    queryKey: ['leaderboards'],
    queryFn: async () => (await listLeaderboardsApi({ period: 'all_time' })).data?.data || []
  })
  const achievementsQ = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => (await listAchievementsApi()).data?.data || []
  })
  const myAchievementsQ = useQuery({
    queryKey: ['my-achievements'],
    queryFn: async () => (await listMyAchievementsApi()).data?.data || []
  })

  const joinM = useMutation({
    mutationFn: async (challengeId) => joinChallengeApi(challengeId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['challenge-progress-me'] })
    }
  })
  const leaveM = useMutation({
    mutationFn: async (challengeId) => leaveChallengeApi(challengeId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['challenge-progress-me'] })
    }
  })

  const myByChallenge = new Map((myProgressQ.data || []).map((p) => [p.challenge_id, p]))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="card p-5">
          <div className="text-display text-3xl tracking-wide">Challenges</div>
          <div className="text-text2 text-sm mt-1">Join challenges, track progress, and compete with your peers.</div>
        </div>

        <div className="card p-5 space-y-3">
          {(challengesQ.data || []).length === 0 ? (
            <div className="text-text2 text-sm">No challenges available.</div>
          ) : (
            (challengesQ.data || []).map((c) => {
              const my = myByChallenge.get(c.id)
              const joined = Boolean(my)
              const pct = Number(my?.completion_percentage || 0)
              return (
                <div key={c.id} className="rounded-xl border border-edge bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-text1 font-semibold">{c.title}</div>
                      <div className="text-text2 text-xs mt-1">{c.type} • {c.exercise_type || 'all exercises'}</div>
                    </div>
                    {joined ? (
                      <button className="btn-ghost text-xs" onClick={() => leaveM.mutate(c.id)}>
                        Leave
                      </button>
                    ) : (
                      <button className="btn-primary text-xs" onClick={() => joinM.mutate(c.id)}>
                        Join
                      </button>
                    )}
                  </div>
                  {c.description ? <div className="text-text2 text-sm mt-2">{c.description}</div> : null}
                  {joined ? (
                    <div className="mt-3">
                      <div className="text-text3 text-xs mb-1">Progress {Math.round(pct)}%</div>
                      <div className="h-2 rounded-full bg-edge overflow-hidden">
                        <div className="h-full bg-lime" style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="text-display text-2xl tracking-wide">Leaderboards</div>
          <div className="mt-3 space-y-3">
            {(leaderboardsQ.data || []).slice(0, 3).map((b) => (
              <div key={b.id} className="rounded-lg border border-edge bg-background p-3">
                <div className="text-text1 text-sm font-semibold">{b.exercise_type || 'Overall'} • {b.metric}</div>
                <div className="text-text2 text-xs mt-1">{(b.entries || []).slice(0, 3).map((e) => `${e.rank || '?'}:${e.score}`).join('  |  ') || 'No entries'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="text-display text-2xl tracking-wide">Achievements</div>
          <div className="mt-3 text-text2 text-xs">
            Unlocked {myAchievementsQ.data?.length || 0} / {achievementsQ.data?.length || 0}
          </div>
          <div className="mt-3 space-y-2">
            {(achievementsQ.data || []).map((a) => {
              const unlocked = (myAchievementsQ.data || []).some((x) => x.achievement_id === a.id)
              return (
                <div key={a.id} className="rounded-lg border border-edge bg-background p-3 flex items-center justify-between">
                  <div>
                    <div className="text-text1 text-sm font-semibold">{a.name}</div>
                    <div className="text-text2 text-xs">{a.rarity} • {a.points} pts</div>
                  </div>
                  <span className={unlocked ? 'text-lime text-xs font-bold' : 'text-text3 text-xs'}>{unlocked ? 'Unlocked' : 'Locked'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

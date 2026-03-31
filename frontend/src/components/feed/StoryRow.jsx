import React from 'react'

const sampleStories = [
  { name: 'Akhil', status: 'Training' },
  { name: 'Disha FC', status: 'Scouting' },
  { name: 'Riya', status: 'Goalkeeper' }
]

export default function StoryRow() {
  return (
    <div className="card p-3">
      <div className="text-text2 text-xs uppercase tracking-wide">Stories</div>
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {sampleStories.map((story) => (
          <div key={story.name} className="bg-raised border border-edge rounded-xl p-2 min-w-[100px]">
            <div className="text-text1 text-sm font-semibold">{story.name}</div>
            <div className="text-text2 text-xs">{story.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}



import React from "react"
import { MemeCard } from "../molecules/MemeCard"

interface Meme {
  id: number
  url: string
  title: string
}

interface MemeGridProps {
  memes: Meme[]
}

export const MemeGrid: React.FC<MemeGridProps> = ({ memes }) => {
  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <span className="text-lg">{chrome.i18n.getMessage("noMemes")}</span>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      {memes.map((meme) => (
        <MemeCard 
          key={meme.id} 
          url={meme.url} 
          title={meme.title} 
        />
      ))}
    </div>
  )
}

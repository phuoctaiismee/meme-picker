import React from "react"
import { MemeCard } from "./meme-card"
import { EmptyState } from "../../../components/feedback/empty-state"

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
    return <EmptyState message={chrome.i18n.getMessage("noMemes")} />
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

import React from "react"

import { EmptyState } from "../../../components/feedback/empty-state"
import { MemeCard } from "./meme-card"

interface Meme {
  id: string
  url: string
  title: string
}

interface MemeGridProps {
  memes: Meme[]
  error?: string | null
  isLoading?: boolean
  onSelect?: (meme: Meme) => void
}

export const MemeGrid: React.FC<MemeGridProps> = ({
  memes,
  error,
  isLoading,
  onSelect
}) => {
  if (isLoading) {
    return <EmptyState message={chrome.i18n.getMessage("loadingMemes")} />
  }

  if (error) {
    return <EmptyState message={error} />
  }

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
          onClick={() => onSelect?.(meme)}
        />
      ))}
    </div>
  )
}

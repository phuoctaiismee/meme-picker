import React from "react"
import type { Meme } from "../../../apis/interfaces/meme"
import { MemeCard } from "./meme-card"
import { AlertCircleIcon, ImageIcon } from "./icons"
import { t } from "../../../lib/i18n"

interface MemeGridProps {
  memes: Meme[]
  error?: string | null
  isLoading?: boolean
  onSelect?: (meme: Meme) => void
  renderItem?: (meme: Meme, element: React.ReactElement) => React.ReactNode
  onRetry?: () => void
}

export const MemeGrid: React.FC<MemeGridProps> = ({
  memes,
  error,
  isLoading,
  onSelect,
  renderItem,
  onRetry
}) => {
  if (isLoading) {
    return (
      <div className="mp-grid">
        {[...Array(8)].map((_, i) => (
          <div key={`skeleton-${i}`} className="mp-skeleton" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="mp-status-container">
        <div className="mp-status-icon mp-status-error">
          <AlertCircleIcon size={24} />
        </div>
        <h3>{t("somethingWentWrong")}</h3>
        <p>{error}</p>
        <button className="mp-retry-btn" onClick={onRetry}>
          {t("tryAgain")}
        </button>
      </div>
    )
  }

  if (memes.length === 0) {
    return (
      <div className="mp-status-container">
        <div className="mp-status-icon">
          <ImageIcon size={24} />
        </div>
        <h3>{t("noMemesFound")}</h3>
        <p>{t("trySearchingElse")}</p>
      </div>
    )
  }

  return (
    <div className="mp-grid">
      {memes.map((meme) => {
        const element = (
          <MemeCard
            key={meme.id}
            url={meme.url}
            title={meme.title}
            onClick={() => onSelect?.(meme)}
          />
        )
        return renderItem ? renderItem(meme, element) : element
      })}
    </div>
  )
}

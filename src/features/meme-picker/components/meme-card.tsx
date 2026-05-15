import React from "react"

interface MemeCardProps {
  url: string
  title: string
  onClick?: () => void
}

export const MemeCard: React.FC<MemeCardProps> = ({ url, title, onClick }) => {
  return (
    <div onClick={onClick} className="mp-card">
      <img src={url} alt={title} className="mp-card-img" />
      <div className="mp-card-footer">
        <p className="mp-card-title">{title}</p>
      </div>
    </div>
  )
}

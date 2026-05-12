import React from "react"

interface MemeCardProps {
  url: string
  title: string
  onClick?: () => void
}

export const MemeCard: React.FC<MemeCardProps> = ({ url, title, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative aspect-video rounded-xl overflow-hidden bg-slate-800 cursor-pointer hover:ring-4 hover:ring-blue-500/50 transition-all duration-300"
    >
      <img 
        src={url} 
        alt={title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-[10px] font-medium truncate">{title}</p>
      </div>
    </div>
  )
}

import React from "react"

interface EmptyStateProps {
  message: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
      <span className="text-lg">{message}</span>
    </div>
  )
}

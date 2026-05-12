import React from "react"
import { Button } from "../ui/button"

interface OverlayLayoutProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footerHint?: string
}

export const OverlayLayout: React.FC<OverlayLayoutProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerHint
}) => {
  if (!isOpen) {
    return (
      <Button 
        onClick={onClose}
        className="fixed bottom-5 right-5 z-[9999] rounded-full p-4"
      >
        Meme
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80 sticky top-0 z-10">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {title}
          </h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </header>

        <div className="overflow-y-auto flex-1">
          {children}
        </div>
        
        {footerHint && (
          <footer className="p-4 border-t border-slate-800 text-center text-slate-500 text-sm">
            {footerHint}
          </footer>
        )}
      </div>
    </div>
  )
}

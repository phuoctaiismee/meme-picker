import React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = "primary", 
  className = "", 
  ...props 
}) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-xl",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700",
    ghost: "text-slate-400 hover:text-white"
  }

  return (
    <button
      className={`rounded-lg p-2 transition-all active:scale-95 cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

import React from 'react'
import './scroll-area.css'

interface ScrollAreaProps {
  children: React.ReactNode
  className?: string
  maxHeight?: string
}

export function ScrollArea({ children, className = '', maxHeight }: ScrollAreaProps) {
  return (
    <div 
      className={`scroll-area ${className}`}
      style={{ maxHeight: maxHeight }}
    >
      <div className="scroll-area__viewport">
        {children}
      </div>
    </div>
  )
} 
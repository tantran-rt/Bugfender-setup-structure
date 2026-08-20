import React from 'react'
import './avatar.css'

interface AvatarProps {
  src?: string
  fallback?: string
  alt?: string
  className?: string
}

export function Avatar({ src, fallback, alt = '', className = '' }: AvatarProps) {
  const [error, setError] = React.useState(false)

  return (
    <div className={`avatar ${className}`}>
      {!error && src ? (
        <img
          src={src}
          alt={alt}
          className="avatar__image"
          onError={() => setError(true)}
        />
      ) : (
        <div className="avatar__fallback">
          {fallback || alt?.charAt(0) || '?'}
        </div>
      )}
    </div>
  )
} 
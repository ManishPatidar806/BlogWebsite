import { User } from 'lucide-react'
import clsx from 'clsx'

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
}

export default function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  className = '',
  fallback = null,
}) {
  const sizeClass = sizes[size] || sizes.md

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={clsx(
          sizeClass,
          'rounded-full object-cover',
          className
        )}
      />
    )
  }

  // Fallback avatar
  const initials = alt ? alt.charAt(0).toUpperCase() : null

  return (
    <div
      className={clsx(
        sizeClass,
        'rounded-full flex items-center justify-center',
        'bg-ink-200 dark:bg-ink-700',
        'text-ink-600 dark:text-ink-300',
        'font-medium',
        className
      )}
    >
      {initials || fallback || <User className="w-1/2 h-1/2" />}
    </div>
  )
}

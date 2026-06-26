import clsx from 'clsx'
import { avatarColor, initials } from '../lib/format'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
}

export default function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full font-semibold text-white shrink-0',
        avatarColor(name),
        sizes[size]
      )}
    >
      {initials(name)}
    </div>
  )
}

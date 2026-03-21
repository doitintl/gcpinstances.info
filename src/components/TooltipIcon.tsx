import { useState } from 'react'
import { Info } from 'lucide-react'

interface Props {
  text: string
}

export function TooltipIcon({ text }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  return (
    <span
      className="relative inline-flex ml-1"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setPos({ top: rect.top, left: rect.left + rect.width / 2 })
      }}
      onMouseLeave={() => setPos(null)}
    >
      <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
      {pos && (
        <span
          className="pointer-events-none fixed z-[9999] w-56 rounded-lg bg-gray-900 px-2.5 py-2 text-xs text-white leading-relaxed shadow-lg"
          style={{
            bottom: window.innerHeight - pos.top + 6,
            left: pos.left,
            transform: 'translateX(-50%)',
          }}
        >
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </span>
      )}
    </span>
  )
}

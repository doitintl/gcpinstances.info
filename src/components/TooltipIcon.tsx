import { Info } from 'lucide-react'

interface Props {
  text: string
}

export function TooltipIcon({ text }: Props) {
  return (
    <span
      className="relative inline-flex group/tooltip ml-1"
      onClick={(e) => e.stopPropagation()}
    >
      <Info className="w-3 h-3 text-gray-400 hover:text-gray-600 cursor-help" />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 rounded-lg bg-gray-900 px-2.5 py-2 text-xs text-white leading-relaxed shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </span>
    </span>
  )
}

import type { LucideIcon } from 'lucide-react'

interface SectionHeaderProps {
  number: number
  title: string
  subtitle: string
  icon?: LucideIcon
}

export function SectionHeader({ number, title, subtitle, icon: Icon }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-5 mt-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-sm font-bold">
        {Icon ? <Icon className="w-4 h-4" /> : number}
      </div>
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-text dark:text-gray-100">
          {number}. {title}
        </h3>
        <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>
      </div>
    </div>
  )
}

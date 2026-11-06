import { ArrowLeft, ArrowRight } from '@/components/landing/icons'

interface SliderArrowsProps {
  label: string
  canPrev: boolean
  canNext: boolean
  onPrev: () => void
  onNext: () => void
  className?: string
}

const button =
  'p-1.5 text-foreground transition-colors duration-300 hover:opacity-60 disabled:cursor-default disabled:text-muted disabled:hover:opacity-100'

export default function SliderArrows({ label, canPrev, canNext, onPrev, onNext, className = '' }: SliderArrowsProps) {
  return (
    <div className={`flex justify-end gap-1.5 ${className}`}>
      <button type="button" onClick={onPrev} disabled={!canPrev} aria-label={`Previous ${label}`} className={button}>
        <ArrowLeft className="size-5" />
      </button>
      <button type="button" onClick={onNext} disabled={!canNext} aria-label={`Next ${label}`} className={button}>
        <ArrowRight className="size-5" />
      </button>
    </div>
  )
}

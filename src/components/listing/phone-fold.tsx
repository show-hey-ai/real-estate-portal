'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface PhoneFoldButtonProps {
  open: boolean
  onToggle: () => void
  /** Space-separated ids of the parts the button shows and hides. */
  controls: string
  more: string
  less: string
}

/**
 * Phones only: opens the part of a long block that is hidden to keep the listing page short. Wide
 * screens always show everything, so the button is not drawn there.
 */
export function PhoneFoldButton({ open, onToggle, controls, more, less }: PhoneFoldButtonProps) {
  return <button type="button" aria-expanded={open} aria-controls={controls} onClick={onToggle} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-[#cfd9e3] bg-white px-4 text-sm font-semibold text-[#274d7d] hover:bg-[#f2f6fa] lg:hidden">
    {open ? less : more}<ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
  </button>
}

const READ_MORE: Record<string, { more: string; less: string }> = {
  ja: { more: '続きを読む', less: '閉じる' },
  en: { more: 'Read more', less: 'Show less' },
  'zh-TW': { more: '繼續閱讀', less: '收起' },
  'zh-CN': { more: '继续阅读', less: '收起' },
}

interface PhoneClampedTextProps {
  text: string
  locale: string
  className?: string
}

/** Phones: the text cut to six lines with "read more". The whole text is always in the page. */
export function PhoneClampedText({ text, locale, className = '' }: PhoneClampedTextProps) {
  const id = useId()
  const ref = useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = useState(false)
  const [cut, setCut] = useState(false)
  const labels = READ_MORE[locale] ?? READ_MORE.en

  // Only a closed paragraph can tell whether it was cut; an open one keeps the last answer.
  useEffect(() => {
    const el = ref.current
    if (open || !el) return
    const check = () => setCut(el.scrollHeight > el.clientHeight + 1)
    check()
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => observer.disconnect()
  }, [open])

  return <>
    <p ref={ref} id={id} className={`${className} ${open ? '' : 'max-lg:line-clamp-6'}`}>{text}</p>
    {cut && <PhoneFoldButton open={open} onToggle={() => setOpen((value) => !value)} controls={id} more={labels.more} less={labels.less} />}
  </>
}

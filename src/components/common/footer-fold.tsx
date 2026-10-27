'use client'

import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface FooterFoldProps {
  /** The section name on the phone toggle. */
  title: string
  /** The heading wide screens show (often a link to the section's index page). */
  heading: ReactNode
  children: ReactNode
}

/**
 * Phones: a footer section folds into one tappable row, so the footer is not two screens of links.
 * Wide screens show the heading and the links as before; the links are always in the page for crawlers.
 */
export function FooterFold({ title, heading, children }: FooterFoldProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return <>
    <div className="hidden md:block">{heading}</div>
    <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((value) => !value)} className="flex min-h-11 w-full items-center justify-between gap-2 border-b border-white/12 text-left text-sm font-semibold md:hidden">
      {title}<ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    <div id={id} className={open ? 'pt-3 pb-2 md:p-0' : 'max-md:hidden'}>{children}</div>
  </>
}

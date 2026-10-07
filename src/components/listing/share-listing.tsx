'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { Check, Link2, Share2 } from 'lucide-react'

const copy = {
  ja: { share: '共有', copy: 'リンクをコピー', copied: 'コピーしました', line: 'LINEで送る', whatsapp: 'WhatsAppで送る', wechat: 'WeChat用にコピー' },
  en: { share: 'Share', copy: 'Copy link', copied: 'Copied', line: 'Send by LINE', whatsapp: 'Send by WhatsApp', wechat: 'Copy for WeChat' },
  'zh-TW': { share: '分享', copy: '複製連結', copied: '已複製', line: '用LINE傳送', whatsapp: '用WhatsApp傳送', wechat: '複製到微信' },
  'zh-CN': { share: '分享', copy: '复制链接', copied: '已复制', line: '用LINE发送', whatsapp: '用WhatsApp发送', wechat: '复制到微信' },
} as const

interface ShareListingProps {
  title: string
  url: string
}

/** Lets buyers send a listing to family: the phone's share sheet when available, otherwise LINE, WhatsApp or a copied link. */
export function ShareListing({ title, url }: ShareListingProps) {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const message = `${title}\n${url}`

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
        return
      } catch {
        // Cancelled or unsupported: fall back to the menu below.
      }
    }
    setOpen((value) => !value)
  }
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }
  const item = 'flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-[#274d7d] hover:bg-[#f2f6fa]'
  return <div className="relative">
    <button type="button" onClick={share} aria-expanded={open} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#cfd9e3] bg-white px-4 text-sm font-semibold text-[#274d7d] hover:bg-[#f2f6fa]"><Share2 aria-hidden="true" className="h-4 w-4" />{text.share}</button>
    {open && <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-[#dbe2e9] bg-white p-1 shadow-lg">
      <a href={`https://line.me/R/share?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={item}>{text.line}</a>
      <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className={item}>{text.whatsapp}</a>
      <button type="button" onClick={copyLink} className={item}>{copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Link2 aria-hidden="true" className="h-4 w-4" />}{copied ? text.copied : `${text.copy} / ${text.wechat}`}</button>
    </div>}
  </div>
}

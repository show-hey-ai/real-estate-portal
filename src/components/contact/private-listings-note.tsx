import { LockKeyhole } from 'lucide-react'

// Properties we may not advertise can still be introduced to one buyer who asks (normal brokerage, not an advert).
const NOTE: Record<string, string> = {
  ja: '広告できない物件・公開前の物件も、条件をいただければ個別にご紹介できます。',
  en: 'We can also introduce properties that cannot be advertised or are not yet public, one to one. Just send your conditions.',
  'zh-TW': '無法刊登廣告或尚未公開的物件，也能依您的條件個別介紹。',
  'zh-CN': '无法刊登广告或尚未公开的房源，也能根据您的条件单独介绍。',
}

interface PrivateListingsNoteProps {
  locale: string
  className?: string
}

export function PrivateListingsNote({ locale, className = '' }: PrivateListingsNoteProps) {
  return <p className={`flex items-start gap-2 rounded-lg bg-[#e8eef5] px-3 py-2 text-xs font-semibold leading-5 text-[#18375f] ${className}`} data-testid="private-listings-note">
    <LockKeyhole aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />{NOTE[locale] ?? NOTE.en}
  </p>
}

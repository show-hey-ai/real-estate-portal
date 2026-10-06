import Image from 'next/image'
import Link from 'next/link'
import { Building2, CalendarDays, ImageOff, Ruler } from 'lucide-react'
import { translatePropertyType } from '@/lib/translate-fields'
import { formatYenWords } from '@/lib/yen-words'

export interface GallerySource {
  id: string
  propertyType: string | null
  price: bigint | null
  buildingArea: unknown
  builtYear: number | null
  imageUrl: string | null
}

const copy = {
  ja: { title: '比較に使った物件', note: 'バーの長さは掲載価格の比較です。物件を押すと詳細を確認できます。', built: '年築', noPhoto: '写真なし' },
  en: { title: 'Listings in this comparison', note: 'Bar length compares asking prices. Open a listing for its current details.', built: 'built', noPhoto: 'No photo' },
  'zh-TW': { title: '本次比較的物件', note: '長條長度代表刊登價格的比較。點選物件可查看詳情。', built: '年建', noPhoto: '無照片' },
  'zh-CN': { title: '本次比较的房产', note: '条形长度表示挂牌价格的比较。点击房产可查看详情。', built: '年建', noPhoto: '无照片' },
} as const

interface ArticleSourceGalleryProps {
  locale: string
  sources: GallerySource[]
}

export function ArticleSourceGallery({ locale, sources }: ArticleSourceGalleryProps) {
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const sorted = [...sources].filter((source) => source.price).sort((left, right) => Number(left.price) - Number(right.price))
  const maxPrice = Math.max(1, ...sorted.map((source) => Number(source.price)))
  return <section className="mt-10" aria-labelledby="article-sources-title" data-testid="article-source-gallery">
    <h2 id="article-sources-title" className="text-xl font-semibold md:text-2xl">{text.title}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{text.note}</p>
    <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((source) => {
        const area = Number(source.buildingArea) || null
        const share = Number(source.price) / maxPrice
        return <li key={source.id}>
          <Link href={`/listings/${source.id}`} className="group block overflow-hidden rounded-xl border border-[#dbe2e9] bg-white transition-shadow hover:shadow-md">
            <div className="relative aspect-[4/3] bg-[#eef2f6]">
              {source.imageUrl
                ? <Image src={source.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                : <span className="flex h-full items-center justify-center gap-1.5 text-xs text-[#8a97a5]"><ImageOff aria-hidden="true" className="h-4 w-4" />{text.noPhoto}</span>}
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-medium text-[#274d7d]"><Building2 aria-hidden="true" className="h-3 w-3" />{translatePropertyType(source.propertyType, locale)}</span>
            </div>
            <div className="space-y-2 p-3">
              <p className="text-lg font-bold text-[#1b293a]">{formatYenWords(Number(source.price), locale)}</p>
              <div className="h-2 overflow-hidden rounded-full bg-[#e6edf4]" aria-hidden="true"><div className="h-full rounded-full bg-[#274d7d]" style={{ width: `${Math.max(4, share * 100)}%` }} /></div>
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#657487]">
                {area && <span className="inline-flex items-center gap-1"><Ruler aria-hidden="true" className="h-3.5 w-3.5" />{area} m²</span>}
                {source.builtYear && <span className="inline-flex items-center gap-1"><CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />{locale === 'en' ? `${text.built} ${source.builtYear}` : `${source.builtYear}${text.built}`}</span>}
              </p>
            </div>
          </Link>
        </li>
      })}
    </ul>
  </section>
}

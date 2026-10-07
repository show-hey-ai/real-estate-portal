import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, Calculator, Globe2, MessagesSquare } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { GuideDiagramView, GuideReviewer, GuideSources } from '@/components/guides/guide-extras'
import { PurchaseChecklist } from '@/components/overseas/purchase-checklist'
import { ListingAlertForm } from '@/components/alerts/listing-alert-form'
import { overseasBuyingFor } from '@/content/overseas-buying'
import { CONTACT_EMAIL, LINE_ADD_URL, WECHAT_DEEP_LINK, WHATSAPP_NUMBER } from '@/lib/contact-channels'
import { localeAlternates } from '@/lib/locale-url'
import { getSchemaLanguage, shareMetadata } from '@/lib/site-config'

/**
 * For buyers living abroad: how the purchase money moves, how settlement is
 * arranged, what to watch when sending money, and a checklist from contract to after handover.
 */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const text = overseasBuyingFor(locale)
  const alternates = localeAlternates('/buy-from-overseas', locale)
  return { title: text.title, description: text.description, alternates, ...shareMetadata({ title: text.title, description: text.description, url: alternates.canonical, locale }) }
}

export default async function BuyFromOverseasPage() {
  const locale = await getLocale()
  const text = overseasBuyingFor(locale)
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: getSchemaLanguage(locale),
    mainEntity: text.faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
  }
  const button = 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#cfd9e3] bg-white px-4 text-sm font-semibold text-[#274d7d] hover:bg-[#f2f6fa]'
  return <div className="container py-12 text-[#1b293a]">
    <JsonLd data={faq} />
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]"><Globe2 aria-hidden="true" className="h-4 w-4" />Welcome Home Tokyo</p>
    <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">{text.title}</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-[#3d4a5a]">{text.lead}</p>


    <section className="mt-12 max-w-4xl" aria-labelledby="flow-title">
      <h2 id="flow-title" className="text-2xl font-semibold">{text.flowTitle}</h2>
      <div className="mt-5"><GuideDiagramView diagram={{ kind: 'flow', title: text.flowCaption, steps: text.flow.map((step) => ({ label: step.label, detail: step.detail })) }} /></div>
    </section>

    <section className="mt-12 max-w-4xl" aria-labelledby="settlement-title">
      <h2 id="settlement-title" className="text-2xl font-semibold">{text.settlementTitle}</h2>
      <p className="mt-3 leading-7 text-[#3d4a5a]">{text.settlementIntro}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {text.settlementOptions.map((option) => <div key={option.label} className="rounded-xl border border-[#dbe2e9] bg-white p-5">
          <h3 className="font-semibold">{option.label}</h3>
          <p className="mt-2 text-sm leading-6 text-[#536274]">{option.detail}</p>
        </div>)}
      </div>
    </section>

    <section className="mt-12 max-w-4xl" aria-labelledby="remit-title">
      <h2 id="remit-title" className="text-2xl font-semibold">{text.remitTitle}</h2>
      <ul className="mt-4 space-y-3">
        {text.remitPoints.map((point) => <li key={point} className="flex gap-3 leading-7 text-[#3d4a5a]"><span aria-hidden="true" className="mt-3 h-2 w-2 shrink-0 rounded-full bg-[#274d7d]" />{point}</li>)}
      </ul>
      <Link href="/buying-guide" className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#274d7d] hover:underline"><Calculator aria-hidden="true" className="h-4 w-4" />{text.costLink}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </section>

    <section className="mt-12" aria-labelledby="checklist-title">
      <h2 id="checklist-title" className="text-2xl font-semibold">{text.checklistTitle}</h2>
      <p className="mt-2 text-sm text-[#536274]">{text.checklistIntro}</p>
      <PurchaseChecklist groups={text.groups} progress={text.progress} reset={text.reset} guideLink={text.guideLink} />
    </section>

    <section className="mt-12 max-w-4xl" aria-labelledby="faq-title">
      <h2 id="faq-title" className="text-2xl font-semibold">{text.faqTitle}</h2>
      <div className="mt-4 divide-y divide-[#dbe2e9] rounded-xl border border-[#dbe2e9] bg-white">
        {text.faq.map((item) => <details key={item.question} className="group p-5">
          <summary className="cursor-pointer list-none font-semibold marker:hidden">{item.question}</summary>
          <p className="mt-2 text-sm leading-6 text-[#536274]">{item.answer}</p>
        </details>)}
      </div>
    </section>

    <div className="mt-12 max-w-4xl"><ListingAlertForm /></div>
    <div className="max-w-4xl"><GuideReviewer locale={locale} /></div>
    <div className="max-w-4xl"><GuideSources sources={text.sources} locale={locale} /></div>

    <section className="mt-12 rounded-2xl bg-[#f4f7fb] p-6" aria-labelledby="overseas-contact">
      <h2 id="overseas-contact" className="flex items-center gap-2 text-xl font-semibold"><MessagesSquare aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.ctaTitle}</h2>
      <p className="mt-2 text-sm text-[#536274]">{text.ctaBody}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className={button}>WhatsApp</a>
        <a href={LINE_ADD_URL} target="_blank" rel="noopener noreferrer" className={button}>LINE</a>
        <a href={WECHAT_DEEP_LINK} className={button}>WeChat</a>
        <a href={`mailto:${CONTACT_EMAIL}`} className={button}>{CONTACT_EMAIL}</a>
      </div>
    </section>
  </div>
}

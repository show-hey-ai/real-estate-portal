'use client'

import { useId, useState } from 'react'
import { Link2, Mail, MessageCircle, MessagesSquare } from 'lucide-react'
import { recordClick } from '@/components/common/ask-us'
import { BuyerProfileFields, useBuyerProfile } from '@/components/contact/buyer-profile-fields'
import { getProfileCopy, isProfileComplete, profileText } from '@/lib/buyer-profile'
import { cleanListingUrl, getOtherListingsCopy } from '@/content/other-listings'
import { CONTACT_EMAIL, WECHAT_DEEP_LINK, lineMessageUrl, messagingOrder, whatsappUrl, type ContactChannel, type MessagingChannel } from '@/lib/contact-channels'

const MAX_QUESTION = 600
const BUTTON = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors'
const PRIMARY = 'bg-[#1f7a4d] text-white hover:bg-[#17633e]'
const OUTLINE = 'border border-[#cfd9e3] bg-white text-[#274d7d] hover:bg-[#f2f6fa]'

/** Paste a link from another site, tick what to ask, and open a chat or email with it filled in. Nothing is stored. */
export function OtherListingForm({ locale }: { locale: string }) {
  const copy = getOtherListingsCopy(locale)
  const [url, setUrl] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [question, setQuestion] = useState('')
  const [touched, setTouched] = useState(false)
  const [wechatCopied, setWechatCopied] = useState(false)
  const [profile, answer] = useBuyerProfile()
  const fieldsId = useId()
  const cleanUrl = cleanListingUrl(url)
  const ready = Boolean(cleanUrl) && isProfileComplete(profile)
  const message = cleanUrl ? `${copy.message(cleanUrl, topics, question.trim())}\n\n${profileText(profile, locale)}` : ''
  const hrefs: Record<ContactChannel, string> = {
    whatsapp: whatsappUrl(message),
    line: lineMessageUrl(message),
    wechat: WECHAT_DEEP_LINK,
    email: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(copy.subject)}&body=${encodeURIComponent(message)}`,
    phone: '',
  }
  const [primary, ...secondary] = messagingOrder(locale)

  function send(channel: ContactChannel, event: React.MouseEvent<HTMLAnchorElement>) {
    if (!ready) {
      event.preventDefault()
      setTouched(true)
      document.getElementById(cleanUrl ? fieldsId : 'other-listing-url')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    recordClick(channel, locale)
    // WeChat cannot be opened with a message, so the message is copied for pasting.
    if (channel === 'wechat') {
      void navigator.clipboard?.writeText(message).catch(() => undefined)
      setWechatCopied(true)
    }
  }
  const link = (channel: MessagingChannel | 'email', label: string, tone: string, Icon: typeof Mail) => <a key={channel} href={hrefs[channel]} onClick={(event) => send(channel, event)}
    aria-disabled={!ready} className={`${BUTTON} ${tone} ${ready ? '' : 'opacity-60'}`} {...(channel === 'wechat' || channel === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
    <Icon aria-hidden="true" className="h-4 w-4" />{label}
  </a>

  return <section aria-labelledby="other-listing-form-title" data-testid="other-listing-form" className="rounded-2xl border border-[#dbe2e9] bg-[#f8fafc] p-5 md:p-6">
    <h2 id="other-listing-form-title" className="text-lg font-semibold">{copy.formTitle}</h2>
    <label htmlFor="other-listing-url" className="mt-4 block text-sm font-semibold text-[#243b45]">{copy.urlLabel}</label>
    <div className="relative mt-2">
      <Link2 aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#82939b]" />
      <input id="other-listing-url" type="url" inputMode="url" autoComplete="off" value={url} maxLength={500} placeholder={copy.urlPlaceholder}
        onChange={(event) => setUrl(event.target.value)} onBlur={() => setTouched(true)} aria-invalid={touched && !cleanUrl} aria-describedby="other-listing-url-error"
        className="h-11 w-full rounded-lg border border-[#cbd5df] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15" />
    </div>
    {touched && !cleanUrl && <p id="other-listing-url-error" className="mt-1 text-xs text-[#b42318]">{copy.urlInvalid}</p>}

    <fieldset className="mt-5">
      <legend className="text-sm font-semibold text-[#243b45]">{copy.topicsLabel}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {copy.topics.map((topic) => <label key={topic} className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm ${topics.includes(topic) ? 'border-[#274d7d] bg-[#e8eef5] text-[#18375f]' : 'border-[#cfd9e3] bg-white text-[#1b293a]'}`}>
          <input type="checkbox" className="h-4 w-4 accent-[#274d7d]" checked={topics.includes(topic)} onChange={() => setTopics((current) => (current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic]))} />
          {topic}
        </label>)}
      </div>
    </fieldset>

    <label htmlFor="other-listing-question" className="mt-5 block text-sm font-semibold text-[#243b45]">{copy.questionLabel}</label>
    <textarea id="other-listing-question" value={question} maxLength={MAX_QUESTION} rows={3} placeholder={copy.questionPlaceholder} onChange={(event) => setQuestion(event.target.value)}
      className="mt-2 w-full rounded-lg border border-[#cbd5df] bg-white px-3 py-2 text-sm outline-none focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15" />

    <div id={fieldsId} className="mt-5 scroll-mt-24"><BuyerProfileFields locale={locale} profile={profile} onAnswer={answer} showMissing={touched && Boolean(cleanUrl)} idPrefix={fieldsId} /></div>
    {touched && cleanUrl && !isProfileComplete(profile) && <p className="mt-2 text-xs font-semibold text-[#b42318]" role="alert">{getProfileCopy(locale).missing}</p>}

    <p className="mt-5 text-sm font-semibold text-[#243b45]">{copy.sendVia}</p>
    <div className="mt-2 grid gap-2 sm:grid-cols-4">
      {link(primary, copy[primary], PRIMARY, MessageCircle)}
      {secondary.map((channel) => link(channel, copy[channel], OUTLINE, MessagesSquare))}
      {link('email', copy.email, OUTLINE, Mail)}
    </div>
    {wechatCopied && <p className="mt-3 rounded-lg bg-[#edf3e7] px-3 py-2 text-xs leading-5 text-[#3f5f39]" role="status">{copy.wechatCopied}</p>}
  </section>
}

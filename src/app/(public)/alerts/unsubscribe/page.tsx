import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { AlertTokenAction } from '@/components/alerts/alert-token-action'

const copy = {
  ja: { title: '新着物件メールの配信停止', description: 'ボタンを押すと配信を停止します。', button: '配信を停止する', done: '配信を停止しました。これ以降メールは届きません。', failed: '処理できませんでした。時間をおいてもう一度お試しください。', back: '物件を探す' },
  en: { title: 'Unsubscribe from new-listing alerts', description: 'Press the button to stop the emails.', button: 'Unsubscribe', done: 'You are unsubscribed and will not receive further emails.', failed: 'Something went wrong. Please try again later.', back: 'Browse properties' },
  'zh-TW': { title: '取消新物件通知', description: '按下按鈕即停止寄送。', button: '取消訂閱', done: '已取消訂閱，之後不會再收到郵件。', failed: '無法處理，請稍後再試。', back: '尋找物件' },
  'zh-CN': { title: '取消新房源通知', description: '点击按钮即停止发送。', button: '取消订阅', done: '已取消订阅，之后不会再收到邮件。', failed: '无法处理，请稍后再试。', back: '查找房源' },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return { title: (copy[locale as keyof typeof copy] ?? copy.en).title, robots: { index: false, follow: false } }
}

export default async function UnsubscribeAlertsPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [{ token }, locale] = await Promise.all([searchParams, getLocale()])
  const text = copy[locale as keyof typeof copy] ?? copy.en
  return <div className="container py-16"><AlertTokenAction token={token?.slice(0, 128) ?? ''} endpoint="/api/alerts/unsubscribe" {...text} /></div>
}

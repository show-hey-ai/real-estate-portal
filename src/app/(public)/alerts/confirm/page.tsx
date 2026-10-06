import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { AlertTokenAction } from '@/components/alerts/alert-token-action'

const copy = {
  ja: { title: '新着物件メールの登録', description: 'ボタンを押すと登録が完了し、週1回、条件に合う新着物件をお届けします。', button: '登録を完了する', done: '登録が完了しました。次回の配信をお待ちください。', failed: 'リンクの有効期限が切れているか、すでに配信停止されています。もう一度お申し込みください。', back: '物件を探す' },
  en: { title: 'New-listing alerts', description: 'Press the button to confirm. We will email matching new listings once a week.', button: 'Confirm', done: 'You are subscribed. Watch for the next weekly email.', failed: 'This link has expired or the alerts were cancelled. Please sign up again.', back: 'Browse properties' },
  'zh-TW': { title: '新物件通知登記', description: '按下按鈕即完成登記，每週一次寄送符合條件的新物件。', button: '完成登記', done: '登記完成，請留意下一次寄送。', failed: '連結已失效或已取消訂閱，請重新申請。', back: '尋找物件' },
  'zh-CN': { title: '新房源通知订阅', description: '点击按钮即完成订阅，每周一次发送符合条件的新房源。', button: '完成订阅', done: '订阅完成，请留意下一次发送。', failed: '链接已失效或已取消订阅，请重新申请。', back: '查找房源' },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  return { title: (copy[locale as keyof typeof copy] ?? copy.en).title, robots: { index: false, follow: false } }
}

export default async function ConfirmAlertsPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [{ token }, locale] = await Promise.all([searchParams, getLocale()])
  const text = copy[locale as keyof typeof copy] ?? copy.en
  return <div className="container py-16"><AlertTokenAction token={token?.slice(0, 128) ?? ''} endpoint="/api/alerts/confirm" {...text} /></div>
}

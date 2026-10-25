/**
 * LINE's chat link (line.me/R/oaMessage) only works in the phone app: on a computer it lands on
 * LINE's home page. Computers get the add-friend page instead, which shows a QR code to scan.
 */

export interface DeviceHints {
  userAgent: string
  maxTouchPoints: number
  platform: string
}

export function canOpenLineChat({ userAgent, maxTouchPoints, platform }: DeviceHints): boolean {
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)) return true
  // iPadOS identifies as a Mac; a touch screen tells them apart.
  return platform === 'MacIntel' && maxTouchPoints > 1
}

export function browserCanOpenLineChat(): boolean {
  return canOpenLineChat({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints ?? 0, platform: navigator.platform ?? '' })
}

const NOTE: Record<string, string> = {
  ja: 'パソコンではLINEのトーク画面を直接開けないため、友だち追加のQRコードを開きました。スマホのLINEで読み取ってください。相談内容はコピーしたので、LINEのトークに貼り付けて送れます。',
  en: 'LINE chats cannot open directly on a computer, so we opened the add-friend QR code. Scan it with LINE on your phone. Your message has been copied, so you can paste it into the LINE chat.',
  'zh-TW': '電腦無法直接開啟 LINE 聊天畫面，因此已開啟加入好友的 QR 碼。請用手機 LINE 掃描。諮詢內容已複製，可貼到 LINE 聊天中傳送。',
  'zh-CN': '电脑无法直接打开 LINE 聊天界面，因此已打开添加好友的二维码。请用手机 LINE 扫描。咨询内容已复制，可粘贴到 LINE 聊天中发送。',
}

export function lineDesktopNote(locale: string): string {
  return NOTE[locale] ?? NOTE.en
}

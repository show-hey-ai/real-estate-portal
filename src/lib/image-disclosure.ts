/** Only explicitly reviewed AI captions trigger a public disclosure. */
export function aiImageDisclosure(caption: string | null | undefined, locale: string) {
  if (!caption?.normalize('NFKC').trim().startsWith('AI加工画像')) return null
  const furnitureRemoved = /家具.*(?:除去|撤去)/u.test(caption)
  const copy: Record<string, { label: string; detail: string; furniture: string }> = {
    ja: { label: 'AI加工画像', detail: 'AI加工画像（原資料提供）。現況と異なる場合があります。', furniture: 'AI加工画像（原資料提供・一部家具を除去）。現況と異なる場合があります。' },
    en: { label: 'AI-edited image', detail: 'AI-edited image supplied in the source document. Actual condition may differ.', furniture: 'AI-edited image supplied in the source document; some furniture removed. Actual condition may differ.' },
    'zh-TW': { label: 'AI處理圖片', detail: 'AI處理圖片（原資料提供）。可能與現況不同。', furniture: 'AI處理圖片（原資料提供・部分家具已移除）。可能與現況不同。' },
    'zh-CN': { label: 'AI处理图片', detail: 'AI处理图片（原资料提供）。可能与现状不同。', furniture: 'AI处理图片（原资料提供・部分家具已移除）。可能与现状不同。' },
  }
  const text = copy[locale] ?? copy.en
  return { label: text.label, detail: furnitureRemoved ? text.furniture : text.detail }
}

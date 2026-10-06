import { createHash } from 'node:crypto'
import { z } from 'zod'
import { locales, type Locale } from '../../i18n/config'
import { translateCityName, translatePropertyType } from '../translate-fields'
import { formatYenWords } from '../yen-words'
import { WARD_SLUGS } from '../ward-tile-map'
import { articleHeroSchema, officialReferenceSchema } from './editorial-policy'

export const wardSlugs: Record<string, string> = WARD_SLUGS
export type ArticleSource = { id: string; city: string | null; propertyType: string | null; price: bigint | null; buildingArea: unknown; builtYear: number | null; updatedAt: Date }
const contentSchema = z.object({ title: z.string().min(10).max(180), description: z.string().min(20).max(350), sections: z.array(z.object({ heading: z.string(), paragraphs: z.array(z.string()) })).min(3), cta: z.string(), notice: z.string(), hero: articleHeroSchema.optional(), references: z.array(officialReferenceSchema).min(1).max(8).optional() }).strict()
export const articleLocalesSchema = z.object({ ja: contentSchema, en: contentSchema, 'zh-TW': contentSchema, 'zh-CN': contentSchema }).strict()
export type ArticleContent = z.infer<typeof contentSchema>

export function sourceFingerprint(rows: ArticleSource[]) {
  return createHash('sha256').update(JSON.stringify([...rows].sort((a, b) => a.id.localeCompare(b.id)).map((row) => [row.id, row.city, row.propertyType, row.price?.toString(), Number(row.buildingArea) || null, row.builtYear, row.updatedAt.toISOString()]))).digest('hex')
}

/** Generate useful inventory reporting from observed facts; no unsupported market forecast. */
export function generateArticleContent(city: string, rows: ArticleSource[], now = new Date()) {
  if (!wardSlugs[city] || rows.length < 3 || rows.some((row) => row.city !== city || !row.price || Number(row.price) <= 0)) throw new Error('At least three priced public sources in one Tokyo ward are required.')
  const prices = rows.map((row) => Number(row.price!)).sort((a, b) => a - b)
  const min = prices[0].toLocaleString('en-US'), max = prices.at(-1)!.toLocaleString('en-US')
  const middle = Math.floor((prices[Math.floor((prices.length - 1) / 2)] + prices[Math.floor(prices.length / 2)]) / 2).toLocaleString('en-US')
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const content = Object.fromEntries(locales.map((locale: Locale) => {
    const ward = translateCityName(city, locale) || city
    const types = [...new Set(rows.map((row) => translatePropertyType(row.propertyType, locale)).filter(Boolean))].join(locale === 'en' ? ', ' : '・')
    const unitCounts = [...new Set(rows.map((row) => row.propertyType))].map((type) => `${translatePropertyType(type, locale)}: ${rows.filter((row) => row.propertyType === type).length}`).join(', ')
    const yen = (value: number) => formatYenWords(value, locale)
    const [low, high, median] = [yen(prices[0]), yen(prices.at(-1)!), yen(Math.floor((prices[Math.floor((prices.length - 1) / 2)] + prices[Math.floor(prices.length / 2)]) / 2))]
    const examples = rows.slice(0, 5).map((row) => `${translatePropertyType(row.propertyType, locale)} — ${yen(Number(row.price))}${row.buildingArea ? ` / ${Number(row.buildingArea)} m²` : ''}${row.builtYear ? ` / ${row.builtYear}` : ''}`)
    const copy: Record<Locale, ArticleContent> = {
      en: { title: `${ward} property for sale: prices and a practical shortlist`, description: `Compare ${rows.length} published ${ward} properties, asking prices from JPY ${min} to ${max}, and the facts to check before choosing a Tokyo purchase.`, sections: [
        { heading: 'What the published selection shows', paragraphs: [`As of ${date}, this selection includes ${rows.length} published properties in ${ward}. Property types include ${types}. Asking prices range from JPY ${min} to JPY ${max}; the median asking price within this selection is JPY ${middle}.`, `The mix is ${unitCounts}. Different property types and sizes explain part of the price spread. These are seller asking prices from the linked listings, rather than completed transaction prices or a ward-wide market estimate.`] },
        { heading: 'Compare the details behind the price', paragraphs: ['Start with intended use and total purchase budget. Compare building area, construction year, access and the condition of each property alongside its asking price. A low price alone does not establish lower ownership costs or higher returns.', ...examples, 'The source links below identify the listings behind this snapshot. Open each listing for its current details; request the supporting documents when a property fits your criteria.'] },
        { heading: 'Turn the selection into a purchase shortlist', paragraphs: ['For a home, compare your space and access requirements. For an investment, request tenancy, income, expense and maintenance records before building a return calculation. For land, clarify the intended plan and request site-specific confirmation before comparing development costs.', 'Share your intended use, preferred area, budget and timing with Ziyou. We can narrow the selection and confirm the remaining property-specific questions.'] },
      ], cta: 'Discuss your purchase criteria', notice: 'This is a dated snapshot of selected published listings. Availability and asking prices can change. Figures do not cover all properties in the ward or guarantee a purchase outcome.' },
      ja: { title: `${ward}の売買物件を比較する：掲載価格と候補の絞り方`, description: `${ward}の公開物件${rows.length}件を比較。掲載価格は${low}〜${high}。価格だけでなく、面積・築年・用途を確認して購入候補を絞ります。`, sections: [
        { heading: '公開物件から分かること', paragraphs: [`${date}時点の対象は${ward}の公開物件${rows.length}件です。種別は${types}。掲載価格は${low}〜${high}、この対象内の中央値は${median}です。`, `種別ごとの件数は${unitCounts}です。物件の種別や面積が違うため、価格差だけで割安かどうかを判断することはできません。掲載価格は売出価格であり、成約価格や区全体の相場を示すものではありません。`] },
        { heading: '価格の背景を比較する', paragraphs: ['利用目的と購入総予算を決め、面積・築年・交通アクセス・現況を価格と合わせて比較します。価格が低いだけでは、維持費が低いことや収益性が高いことは確認できません。', ...examples, '下の参照物件から最新の詳細をご確認ください。条件に合う物件が見つかったら、根拠となる資料を取り寄せて確認します。'] },
        { heading: '購入候補へ絞り込む', paragraphs: ['居住用は必要な広さとアクセス、投資用は賃貸状況・収入・費用・修繕履歴を比較します。土地は利用計画を整理し、物件ごとの条件確認をしたうえで総費用を比較します。', 'ご希望の用途・エリア・予算・購入時期を自由不動産にお伝えください。候補を絞り、物件ごとに残る確認事項を整理します。'] },
      ], cta: '購入条件を相談する', notice: 'この情報は対象となる公開物件の時点集計です。販売状況・売出価格は変わる場合があります。区内の全物件や購入結果を示すものではありません。' },
      'zh-TW': { title: `${ward}待售物件比較：刊登價格與選屋重點`, description: `比較${ward}的${rows.length}筆公開物件，刊登價格為${low}至${high}。從面積、屋齡與用途整理東京購屋候選清單。`, sections: [
        { heading: '公開物件呈現的資訊', paragraphs: [`截至${date}，本次比較包含${ward}的${rows.length}筆公開物件。類型包括${types}，刊登價格介於${low}與${high}，本次樣本的中位刊登價格為${median}。`, `各類型筆數為${unitCounts}。不同類型與面積會影響價格差距。這些數字是參照物件的開價，並非成交價或全區市場行情。`] },
        { heading: '比較價格背後的條件', paragraphs: ['先確定用途與購買總預算，再一併比較面積、屋齡、交通及現況。價格較低，並不代表持有成本較低或報酬較高。', ...examples, '下方連結為本次統計的參照物件。請開啟物件頁查看最新資訊，並針對符合條件的物件索取相關資料。'] },
        { heading: '整理購買候選清單', paragraphs: ['自住物件應比較空間與交通需求；投資物件應先取得出租、收入、費用與修繕紀錄，再試算報酬。土地則須先明確用途並逐案確認條件，再比較開發總成本。', '請告訴自由不動產您的用途、區域、預算與購買時間。我們會協助縮小範圍並確認個別物件尚待釐清的問題。'] },
      ], cta: '諮詢購屋條件', notice: '本資訊為部分公開物件的時點統計。供售狀態與開價可能變更，並不涵蓋區內全部物件或保證購買結果。' },
      'zh-CN': { title: `${ward}待售房产比较：挂牌价格与选房要点`, description: `比较${ward}的${rows.length}套公开房产，挂牌价格为${low}至${high}。结合面积、房龄与用途整理东京购房候选清单。`, sections: [
        { heading: '公开房产反映的信息', paragraphs: [`截至${date}，本次比较包含${ward}的${rows.length}套公开房产。类型包括${types}，挂牌价格介于${low}与${high}，本次样本的挂牌价格中位数为${median}。`, `各类型数量为${unitCounts}。类型与面积不同会影响价格差距。这些数字是参考房产的报价，并非成交价或全区市场行情。`] },
        { heading: '比较价格背后的条件', paragraphs: ['先明确用途与购房总预算，再同时比较面积、房龄、交通和现状。价格较低，并不代表持有成本较低或收益较高。', ...examples, '下方链接列出本次统计的参考房产。请打开房产页面查看最新信息，并为符合条件的房产索取支持资料。'] },
        { heading: '整理购房候选清单', paragraphs: ['自住房产应比较空间与交通需求；投资房产应先取得出租、收入、费用与修缮记录，再测算收益。土地则须先明确用途并逐项确认条件，再比较开发总成本。', '请告诉自由不动产您的用途、区域、预算和购买时间。我们会协助缩小范围并确认各项房产尚待厘清的问题。'] },
      ], cta: '咨询购房条件', notice: '本信息为部分公开房产的时点统计。供售状态与报价可能变化，不涵盖区内全部房产，也不保证购买结果。' },
    }
    return [locale, copy[locale]]
  }))
  return articleLocalesSchema.parse(content)
}

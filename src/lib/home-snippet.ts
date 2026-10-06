export interface HomeSnippet {
  title: string
  description: string
}

/**
 * Search-result title and description for the home page. A live count and concrete
 * types read better in results than a generic tagline; with no inventory the count is left out.
 */
export function homeSnippet(locale: string, count: number): HomeSnippet {
  const live = count > 0
  switch (locale) {
    case 'ja':
      return {
        title: live ? `東京23区の売買物件${count}件｜中古マンション・一棟・土地｜自由不動産` : '東京23区の売買物件｜中古マンション・一棟・土地｜自由不動産',
        description: `${live ? `東京23区で公開中の売買物件${count}件。` : ''}中古マンション・一棟ビル・アパート・土地を区・予算・種類から探せます。㎡単価や月々の返済、購入時の諸費用の目安も表示。登録なしでWhatsApp・メール・電話で相談できます（日本語・英語・中国語）。`,
      }
    case 'zh-TW':
      return {
        title: live ? `東京23區待售物件${count}筆｜公寓・整棟・土地｜自由不動產` : '東京23區待售物件｜公寓・整棟・土地｜自由不動產',
        description: `${live ? `東京23區目前公開${count}筆待售物件。` : ''}可依區域、預算、類型搜尋公寓、整棟大樓、公寓樓與土地，並顯示每平方公尺單價、每月還款與購屋雜費試算。免註冊即可透過WhatsApp、電子郵件或電話以中文、日文、英文洽詢。`,
      }
    case 'zh-CN':
      return {
        title: live ? `东京23区在售房源${count}套｜公寓・整栋・土地｜自由不动产` : '东京23区在售房源｜公寓・整栋・土地｜自由不动产',
        description: `${live ? `东京23区目前公开${count}套在售房源。` : ''}可按区域、预算、类型查找公寓、整栋大楼、公寓楼和土地，并显示每平方米单价、月供和购房杂费估算。无需注册即可通过WhatsApp、邮件或电话用中文、日语、英语咨询。`,
      }
    default:
      return {
        title: live ? `${count} Tokyo Properties for Sale | Condos, Buildings, Land | Ziyou Real Estate` : 'Tokyo Properties for Sale | Condos, Buildings, Land | Ziyou Real Estate',
        description: `${live ? `${count} properties for sale across Tokyo's 23 wards. ` : ''}Browse condos, whole buildings, apartment buildings and land by ward, budget and type, with price per m², monthly payment and purchase-cost estimates. Ask in English, Japanese or Chinese by WhatsApp, email or phone — no sign-up needed.`,
      }
  }
}

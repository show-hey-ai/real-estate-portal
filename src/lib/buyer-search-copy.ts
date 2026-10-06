const copies = {
  ja: {
    start: 'あなたの条件で、物件探しを続ける',
    startNote: '会員登録後に条件を保存できます。目的・予算・地域から始め、詳しい条件はあとから追加できます。',
    steps: ['購入条件を保存', '合う理由・違いを比較', '気になる物件を個別に相談'],
    register: '新規登録して始める', browse: 'まず公開物件を見る',
    basics: 'まずは基本の条件から', basicsNote: '未定の項目は指定なしで保存できます。',
    advanced: '広さ・築年・融資などの詳しい条件',
    savedCriteria: '保存中の購入条件', edit: '条件を変更', cancel: '変更を取り消す',
    suggestions: 'あなたへの物件提案', compareNow: '選んだ物件を比較', clear: '比較を解除',
    selected: '比較に選択中',
  },
  en: {
    start: 'Keep searching with your own criteria',
    startNote: 'Create an account to save your criteria. Start with purpose, budget and area, then add more detail later.',
    steps: ['Save buying criteria', 'Compare matches and differences', 'Discuss each property privately'],
    register: 'Create an account to start', browse: 'Browse public properties first',
    basics: 'Start with the essentials', basicsNote: 'Leave undecided fields as no preference.',
    advanced: 'More criteria: size, age, funding and more',
    savedCriteria: 'Your saved buying criteria', edit: 'Edit criteria', cancel: 'Cancel changes',
    suggestions: 'Your property suggestions', compareNow: 'Compare selected properties', clear: 'Clear comparison',
    selected: 'Selected for comparison',
  },
  'zh-TW': {
    start: '依您的條件持續尋找物件',
    startNote: '註冊後即可保存條件。先選目的、預算與區域，詳細條件可稍後補充。',
    steps: ['保存購屋條件', '比較符合處與差異', '逐一私下諮詢物件'],
    register: '註冊並開始', browse: '先看公開物件',
    basics: '先填基本條件', basicsNote: '未定項目可保留不限。',
    advanced: '面積、屋齡、資金等詳細條件',
    savedCriteria: '已保存的購屋條件', edit: '修改條件', cancel: '取消修改',
    suggestions: '為您提供的物件提案', compareNow: '比較所選物件', clear: '清除比較',
    selected: '已選入比較',
  },
  'zh-CN': {
    start: '按您的条件持续寻找房源',
    startNote: '注册后即可保存条件。先选目的、预算与区域，详细条件可稍后补充。',
    steps: ['保存购房条件', '比较符合点与差异', '逐一私下咨询房源'],
    register: '注册并开始', browse: '先看公开房源',
    basics: '先填基本条件', basicsNote: '未定项目可保留不限。',
    advanced: '面积、房龄、资金等详细条件',
    savedCriteria: '已保存的购房条件', edit: '修改条件', cancel: '取消修改',
    suggestions: '为您提供的房源推荐', compareNow: '比较所选房源', clear: '清除比较',
    selected: '已选入比较',
  },
} as const

export function getBuyerSearchCopy(locale: string) {
  return copies[locale as keyof typeof copies] || copies.en
}

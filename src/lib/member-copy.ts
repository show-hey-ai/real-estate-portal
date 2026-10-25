export interface MemberCopy {
  nav: string
  title: string
  intro: string
  signedInAs: (email: string) => string
  guestTitle: string
  guestBody: string
  signIn: string
  register: string
  favorites: string
  favoritesEmpty: string
  recent: string
  recentEmpty: string
  clearRecent: string
  searches: string
  searchesEmpty: string
  openSearch: string
  deleteSearch: string
  profile: string
  profileNote: string
  count: (count: number) => string
}

const COPY: Record<string, MemberCopy> = {
  ja: {
    nav: 'マイページ', title: 'マイページ', intro: 'お気に入り、最近見た物件、保存した検索条件、購入者情報をまとめて確認できます。',
    signedInAs: (email) => `${email} でログイン中。スマホとパソコンで同じ内容が見られます。`,
    guestTitle: 'ログインすると、スマホとパソコンで共有できます',
    guestBody: '今はこの端末にだけ保存されています。ログイン（Googleでも可）すると、どの端末からでも同じお気に入りや履歴を見られます。相談は登録なしでもできます。',
    signIn: 'ログイン', register: '新規登録（無料）',
    favorites: 'お気に入り', favoritesEmpty: '物件のハートを押すと、ここに追加されます。',
    recent: '最近見た物件', recentEmpty: '物件を見ると、ここに残ります。', clearRecent: '履歴を消す',
    searches: '保存した検索条件', searchesEmpty: '物件一覧で「この条件を保存」を押すと、ここに追加されます。', openSearch: 'この条件で探す', deleteSearch: '削除',
    profile: '購入者情報', profileNote: 'ここで選んだ内容は、相談欄に最初から入った状態になります。',
    count: (count) => `${count}件`,
  },
  en: {
    nav: 'My page', title: 'My page', intro: 'Your favorites, recently viewed properties, saved searches and buyer details in one place.',
    signedInAs: (email) => `Signed in as ${email}. The same lists appear on your phone and computer.`,
    guestTitle: 'Sign in to share these lists between your phone and computer',
    guestBody: 'For now they are saved on this device only. Sign in (Google works too) to see the same favorites and history on any device. You can still contact us without signing up.',
    signIn: 'Sign in', register: 'Create a free account',
    favorites: 'Favorites', favoritesEmpty: 'Tap the heart on a property to add it here.',
    recent: 'Recently viewed', recentEmpty: 'Properties you open will appear here.', clearRecent: 'Clear history',
    searches: 'Saved searches', searchesEmpty: 'Choose “Save this search” on the property list to add one here.', openSearch: 'Search again', deleteSearch: 'Delete',
    profile: 'About you', profileNote: 'Your answers here are filled in for you in every contact box.',
    count: (count) => `${count}`,
  },
  'zh-TW': {
    nav: '我的頁面', title: '我的頁面', intro: '在這裡查看收藏、最近瀏覽的物件、已儲存的搜尋條件與購屋者資訊。',
    signedInAs: (email) => `已以 ${email} 登入。手機與電腦會顯示相同內容。`,
    guestTitle: '登入後可在手機與電腦間共用',
    guestBody: '目前僅儲存在此裝置。登入（可用 Google）後，在任何裝置都能看到相同的收藏與瀏覽紀錄。不註冊也能諮詢。',
    signIn: '登入', register: '免費註冊',
    favorites: '收藏', favoritesEmpty: '點選物件上的愛心即可加入這裡。',
    recent: '最近瀏覽的物件', recentEmpty: '瀏覽過的物件會顯示在這裡。', clearRecent: '清除紀錄',
    searches: '已儲存的搜尋條件', searchesEmpty: '在物件列表點選「儲存此條件」即可加入這裡。', openSearch: '用此條件搜尋', deleteSearch: '刪除',
    profile: '購屋者資訊', profileNote: '這裡選擇的內容會自動填入諮詢欄。',
    count: (count) => `${count} 件`,
  },
  'zh-CN': {
    nav: '我的页面', title: '我的页面', intro: '在这里查看收藏、最近浏览的房源、已保存的搜索条件和购房者信息。',
    signedInAs: (email) => `已以 ${email} 登录。手机和电脑会显示相同内容。`,
    guestTitle: '登录后可在手机和电脑之间共享',
    guestBody: '目前仅保存在此设备。登录（可用 Google）后，在任何设备都能看到相同的收藏和浏览记录。不注册也能咨询。',
    signIn: '登录', register: '免费注册',
    favorites: '收藏', favoritesEmpty: '点击房源上的爱心即可加入这里。',
    recent: '最近浏览的房源', recentEmpty: '浏览过的房源会显示在这里。', clearRecent: '清除记录',
    searches: '已保存的搜索条件', searchesEmpty: '在房源列表点击“保存此条件”即可加入这里。', openSearch: '用此条件搜索', deleteSearch: '删除',
    profile: '购房者信息', profileNote: '这里选择的内容会自动填入咨询栏。',
    count: (count) => `${count} 套`,
  },
}

export function getMemberCopy(locale: string): MemberCopy {
  return COPY[locale] ?? COPY.en
}

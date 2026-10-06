const en = {
  title: 'Private chats', start: 'Chat with the seller', privacy: 'Only the buyer and seller in this conversation can read it.',
  empty: 'Your property conversations will appear here.', buyer: 'Buyer', seller: 'Seller', back: 'All chats', property: 'View property',
  send: 'Send', placeholder: 'Write a message…', language: 'Message language', translate: 'Enable automatic translation',
  translationNote: 'Free translation on this device. Supported desktop Chrome may download language models. Originals are always available.',
  unavailable: 'Automatic translation is unavailable in this browser. Messages are shown in their original language. Try desktop Chrome.',
  original: 'Original message', translated: 'Automatically translated', translationFailed: 'Translation unavailable — original shown.',
  loading: 'Loading…', older: 'Earlier messages', more: 'More conversations', pending: 'The seller has not connected an account to this property yet. A private chat can start once they are connected.',
  error: 'Unable to load this conversation. Please try again.', login: 'Please sign in to continue.', missing: 'This conversation is unavailable or you do not have access.',
  rate: 'Please wait a minute before sending more messages.', retry: 'Try again', connected: 'Seller connected',
  sellerSetup: 'Seller account for private chat', email: 'Seller’s registered email address', verified: 'I have verified this person is authorized to act as the seller for this property.',
  save: 'Connect seller', saved: 'Seller account connected.', notRegistered: 'The seller must register and confirm their email first.',
  setupNote: 'Connecting a seller enables private buyer–seller conversations. Administrators cannot read conversations they do not participate in.',
  noMessages: 'Start your conversation about this property.', sellerInbox: 'You are the seller. Open your conversations for this property.',
  busy: 'Sending…',
}
type Copy = typeof en
const ja: Copy = {
  title: 'チャット', start: '売主と専用チャット', privacy: 'この会話の買主・売主だけが閲覧できます。',
  empty: '物件ごとの会話がここに表示されます。', buyer: '買主', seller: '売主', back: 'チャット一覧', property: '物件を見る',
  send: '送信', placeholder: 'メッセージを入力…', language: '入力する言語', translate: '自動翻訳を有効にする',
  translationNote: '端末内で無料翻訳します。対応するPC版Chromeでは言語モデルをダウンロードする場合があります。原文はいつでも確認できます。',
  unavailable: 'このブラウザでは自動翻訳を利用できません。原文で表示しています。PC版Chromeをご利用ください。',
  original: '原文を見る', translated: '自動翻訳', translationFailed: '翻訳できないため原文を表示しています。',
  loading: '読み込み中…', older: '以前のメッセージ', more: 'ほかの会話を表示', pending: 'この物件の売主アカウントはまだ接続されていません。接続後に専用チャットを開始できます。',
  error: '会話を読み込めませんでした。もう一度お試しください。', login: 'ログインして続けてください。', missing: '会話が存在しないか、閲覧する権限がありません。',
  rate: '少し時間をおいてから送信してください。', retry: '再試行', connected: '売主接続済み',
  sellerSetup: '専用チャットの売主アカウント', email: '売主の登録メールアドレス', verified: 'この人が、この物件の売主として対応する権限を持つことを確認しました。',
  save: '売主を接続', saved: '売主アカウントを接続しました。', notRegistered: '売主の会員登録とメールアドレスの確認が必要です。',
  setupNote: '売主を接続すると、買主との専用チャットを開始できます。会話の当事者ではない管理者は内容を閲覧できません。',
  noMessages: 'この物件についてメッセージを送ってみましょう。', sellerInbox: '売主として登録されています。この物件のチャット一覧を開いてください。', busy: '送信中…',
}
const cn: Copy = {
  title: '聊天', start: '与卖家私聊', privacy: '仅此对话的买家和卖家可查看内容。', empty: '您的房源对话将显示在这里。', buyer: '买家', seller: '卖家', back: '聊天列表', property: '查看房源',
  send: '发送', placeholder: '输入消息…', language: '输入语言', translate: '启用自动翻译', translationNote: '在设备上免费翻译。支持的电脑版 Chrome 可能下载语言模型。可随时查看原文。',
  unavailable: '此浏览器不支持自动翻译，显示原文。请使用电脑版 Chrome。', original: '查看原文', translated: '自动翻译', translationFailed: '无法翻译，显示原文。',
  loading: '加载中…', older: '之前的消息', more: '更多对话', pending: '卖家尚未关联此房源的账户，关联后即可开始私聊。', error: '无法加载对话，请重试。', login: '请先登录。', missing: '对话不存在或您无权查看。',
  rate: '请稍后再发送消息。', retry: '重试', connected: '已关联卖家', sellerSetup: '私聊的卖家账户', email: '卖家注册邮箱', verified: '已确认此人有权作为该房源的卖家进行沟通。',
  save: '关联卖家', saved: '已关联卖家账户。', notRegistered: '卖家须先注册并验证邮箱。', setupNote: '关联后可开始买卖双方私聊。非对话参与者的管理员无法查看内容。', noMessages: '开始讨论此房源。', sellerInbox: '您是卖家，请打开此房源的对话列表。', busy: '发送中…',
}
const tw: Copy = {
  ...cn, title: '聊天', start: '與賣家私聊', privacy: '僅此對話的買家和賣家可查看內容。', empty: '您的房源對話將顯示在這裡。', buyer: '買家', seller: '賣家', back: '聊天列表', property: '查看房源', send: '傳送', placeholder: '輸入訊息…', language: '輸入語言', translate: '啟用自動翻譯',
  translationNote: '在裝置上免費翻譯。支援的電腦版 Chrome 可能下載語言模型。可隨時查看原文。', unavailable: '此瀏覽器不支援自動翻譯，顯示原文。請使用電腦版 Chrome。', original: '查看原文', translated: '自動翻譯', translationFailed: '無法翻譯，顯示原文。', loading: '載入中…', older: '之前的訊息', more: '更多對話', pending: '賣家尚未關聯此房源的帳戶，關聯後即可開始私聊。', error: '無法載入對話，請重試。', login: '請先登入。', missing: '對話不存在或您無權查看。', rate: '請稍後再傳送訊息。', retry: '重試', connected: '已關聯賣家', sellerSetup: '私聊的賣家帳戶', email: '賣家註冊信箱', verified: '已確認此人有權作為該房源的賣家進行溝通。', save: '關聯賣家', saved: '已關聯賣家帳戶。', notRegistered: '賣家須先註冊並驗證信箱。', setupNote: '關聯後可開始買賣雙方私聊。非對話參與者的管理員無法查看內容。', noMessages: '開始討論此房源。', sellerInbox: '您是賣家，請開啟此房源的對話列表。', busy: '傳送中…',
}
export function getPrivateChatCopy(locale: string): Copy { return locale === 'ja' ? ja : locale === 'zh-CN' ? cn : locale === 'zh-TW' ? tw : en }

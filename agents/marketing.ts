/**
 * マーケティング エージェントチーム
 *
 * - Inbox Responder: 問い合わせ自動返信
 * - Ad Manager: SNS新着物件投稿
 * - Email Marketer: リード向けメール配信
 *
 * Usage:
 *   npx tsx agents/marketing.ts                    (全エージェント実行)
 *   npx tsx agents/marketing.ts --inbox            (問い合わせ対応のみ)
 *   npx tsx agents/marketing.ts --ads              (SNS投稿のみ)
 *   npx tsx agents/marketing.ts --email            (メール配信のみ)
 */
import { query } from '@anthropic-ai/claude-agent-sdk'
import { resolve } from 'path'
import { config } from 'dotenv'
import { inboxResponder, adManager, emailMarketer } from './config'

config({ path: resolve(process.cwd(), '.env') })

const mode = process.argv.includes('--inbox') ? 'inbox'
  : process.argv.includes('--ads') ? 'ads'
  : process.argv.includes('--email') ? 'email'
  : 'all'

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${msg}`)
}

// ──────────────────────────────────────────
// Inbox Responder
// ──────────────────────────────────────────
async function runInboxResponder() {
  log('=== Inbox Responder 起動 ===')

  for await (const message of query({
    prompt: `あなたは不動産ポータル「Tokyo Property」の問い合わせ対応エージェントです。

以下のタスクを実行してください:

1. Gmailの受信トレイから未読メールを確認（gmail MCP使用）
2. 各メールを分類:
   - 物件に関する質問 → Supabase DBから該当物件情報を取得して回答ドラフト作成
   - 価格交渉/商談 → テンプレート返信ドラフト + 管理者メモ
   - スパム → スキップ
   - 対応不能 → 管理者転送用ドラフト作成
3. すべてのメールは「ドラフト」として保存（自動送信しない）
4. 処理結果のサマリーを報告

物件情報の取得には以下のBashコマンドが使えます:
\`\`\`
# Supabaseから物件検索（例: 中央区のマンション）
curl -s "${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?city=eq.中央区&status=eq.PUBLISHED&select=id,price,addressPublic,propertyType,stations,descriptionJa" \\
  -H "apikey: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}" \\
  -H "Authorization: Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
\`\`\`

署名:
Tokyo Property
Email: info@tokyoproperty.jp`,
    options: {
      cwd: process.cwd(),
      allowedTools: ['Read', 'Bash', 'Grep'],
      model: 'claude-sonnet-4-6',
      thinking: { type: 'adaptive' },
      maxTurns: 30,
      maxBudgetUsd: 1.0,
      mcpServers: inboxResponder.mcpServers,
    },
  })) {
    if ('result' in message) {
      log('Inbox Responder 完了')
      console.log(message.result)
    }
  }
}

// ──────────────────────────────────────────
// Ad Manager (SNS投稿)
// ──────────────────────────────────────────
async function runAdManager() {
  log('=== Ad Manager 起動 ===')

  for await (const message of query({
    prompt: `あなたは不動産ポータル「Tokyo Property」のSNSマーケティングエージェントです。

以下のタスクを実行してください:

1. Supabase DBから直近24時間以内に登録された新着物件を取得:
\`\`\`bash
curl -s "${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?status=eq.PUBLISHED&order=createdAt.desc&limit=5&select=id,price,addressPublic,propertyType,stations,buildingArea,builtYear,descriptionJa,descriptionEn" \\
  -H "apikey: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}" \\
  -H "Authorization: Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
\`\`\`

2. 各物件について、以下のプラットフォーム向け投稿文を生成:

**X（Twitter）日本語版:**
🏠 [エリア] [物件種別] ¥[価格]億 / [面積]㎡ / [最寄駅]徒歩[分]分
詳細: ${process.env.NEXT_PUBLIC_APP_URL || 'https://tokyoproperty.jp'}/listings/[id]
#東京不動産 #投資物件 #Tokyo

**X（Twitter）英語版:**
🏠 [Area] [Type] ¥[Price]M / [Area]㎡ / [min] from [Station]
Details: ${process.env.NEXT_PUBLIC_APP_URL || 'https://tokyoproperty.jp'}/en/listings/[id]
#TokyoRealEstate #JapanProperty #Investment

**Instagram:**
物件の魅力を200-300文字で紹介（日英バイリンガル）
ハッシュタグ15個

3. Chrome MCPを使ってXとInstagramに投稿（ログイン済みの想定）
4. 投稿結果のサマリーを報告

【制限】1日最大5投稿、投稿時間8:00-21:00 JST`,
    options: {
      cwd: process.cwd(),
      allowedTools: ['Read', 'Bash'],
      model: 'claude-sonnet-4-6',
      thinking: { type: 'adaptive' },
      maxTurns: 50,
      maxBudgetUsd: 2.0,
      mcpServers: adManager.mcpServers,
    },
  })) {
    if ('result' in message) {
      log('Ad Manager 完了')
      console.log(message.result)
    }
  }
}

// ──────────────────────────────────────────
// Email Marketer
// ──────────────────────────────────────────
async function runEmailMarketer() {
  log('=== Email Marketer 起動 ===')

  for await (const message of query({
    prompt: `あなたは不動産ポータル「Tokyo Property」のメールマーケティングエージェントです。

以下のタスクを実行してください:

1. Supabase DBから新着物件を取得（直近24時間）:
\`\`\`bash
curl -s "${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/listings?status=eq.PUBLISHED&order=createdAt.desc&limit=10&select=id,price,addressPublic,city,prefecture,propertyType,stations,buildingArea,builtYear,descriptionJa,descriptionEn,descriptionZhTw" \\
  -H "apikey: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}" \\
  -H "Authorization: Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
\`\`\`

2. Supabase DBからアクティブなリードを取得:
\`\`\`bash
curl -s "${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/leads?status=in.(NEW,IN_PROGRESS)&select=id,email,name,preferredLocale,notes" \\
  -H "apikey: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}" \\
  -H "Authorization: Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}"
\`\`\`

3. 各リードに対して、興味エリアに合った物件のメールドラフトを作成:
   - リードの言語設定に合わせた文面（ja/en/zh-TW/zh-CN）
   - 件名: 🏠 新着物件のご案内 - [エリア] [物件種別]
   - 本文: 物件概要 + スペック + ポータルリンク
   - Gmail MCPでドラフト保存

4. 処理結果サマリーを報告

【制限】
- 1日最大50通
- 同一リードへの送信は週1回まで`,
    options: {
      cwd: process.cwd(),
      allowedTools: ['Read', 'Bash'],
      model: 'claude-sonnet-4-6',
      thinking: { type: 'adaptive' },
      maxTurns: 30,
      maxBudgetUsd: 1.0,
      mcpServers: emailMarketer.mcpServers,
    },
  })) {
    if ('result' in message) {
      log('Email Marketer 完了')
      console.log(message.result)
    }
  }
}

// ──────────────────────────────────────────
// メイン
// ──────────────────────────────────────────
async function main() {
  log(`マーケティングチーム起動 (mode: ${mode})`)
  log('')

  switch (mode) {
    case 'inbox':
      await runInboxResponder()
      break
    case 'ads':
      await runAdManager()
      break
    case 'email':
      await runEmailMarketer()
      break
    case 'all':
      // 全エージェントを並列実行
      await Promise.all([
        runInboxResponder(),
        runAdManager(),
        runEmailMarketer(),
      ])
      break
  }

  log('')
  log('=== マーケティングチーム 完了 ===')
}

main().catch((err) => {
  console.error('マーケティングエラー:', err)
  process.exit(1)
})

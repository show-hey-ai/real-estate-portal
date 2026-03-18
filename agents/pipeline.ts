/**
 * 物件パイプライン エージェントチーム
 *
 * Orchestrator が以下のサブエージェントを順次/並列実行:
 *   REINS Scraper → PDF Extractor → Data Validator → Translator → DB Sync
 *
 * Usage:
 *   npx tsx agents/pipeline.ts
 *   npx tsx agents/pipeline.ts --skip-reins    (ダウンロード済みPDFのみ処理)
 *   npx tsx agents/pipeline.ts --dir ~/path    (PDFディレクトリ指定)
 */
import { query } from '@anthropic-ai/claude-agent-sdk'
import { resolve } from 'path'
import { config } from 'dotenv'
import {
  reinsScraper,
  pdfExtractor,
  dataValidator,
  translator,
  dbSync,
} from './config'

config({ path: resolve(process.cwd(), '.env') })

const skipReins = process.argv.includes('--skip-reins')
const dirArg = process.argv.indexOf('--dir')
const pdfDir = dirArg !== -1 && process.argv[dirArg + 1]
  ? resolve(process.argv[dirArg + 1].replace('~', process.env.HOME || ''))
  : resolve(process.env.MAISOKU_WATCH_DIR?.replace('~', process.env.HOME || '') || `${process.env.HOME}/Downloads/maisoku`)

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${msg}`)
}

export async function runPipeline() {
  const startTime = Date.now()
  log('=== 物件パイプライン エージェントチーム 起動 ===')
  log(`PDF dir: ${pdfDir}`)
  log(`REINS: ${skipReins ? 'スキップ' : '実行'}`)
  log('')

  // Orchestrator プロンプト（全体制御）
  const orchestratorPrompt = `あなたは不動産ポータル「Tokyo Property」の物件登録パイプラインのオーケストレーターです。

以下の手順でサブエージェントを使って物件を自動登録してください:

${skipReins ? '' : `## ステップ1: REINS Scraper
reins-scraper エージェントを使って、REINSからマイソクPDFをダウンロードしてください。
検索条件:
- エリア: ${process.env.REINS_AREA || '東京都'} ${process.env.REINS_CITY || ''}
- 物件種別: ${process.env.REINS_PROPERTY_TYPE || '売マンション'}
- 価格帯: ${process.env.REINS_PRICE_MIN || ''}〜${process.env.REINS_PRICE_MAX || ''}万円
ダウンロード先: ${pdfDir}
`}
## ステップ${skipReins ? '1' : '2'}: PDF Extractor
pdf-extractor エージェントを使って、${pdfDir} にあるPDFファイルを処理してください。
各PDFについて:
1. テキスト抽出（pdf-parseで）
2. 構造化データ（JSON）に変換
3. 物件画像を生成（PDF1ページ目を画像化、下部15%をカット）
結果はJSONファイルとして /tmp/listings/ に出力してください。

## ステップ${skipReins ? '2' : '3'}: Data Validator
data-validator エージェントを使って、抽出されたJSONデータを検証してください。
- 必須項目チェック（price, address, property_type）
- 価格範囲チェック（100万〜100億円）
- 重複チェック
FAILした物件はスキップ、WARNは修正して続行。

## ステップ${skipReins ? '3' : '4'}: Translator
translator エージェントを使って、検証済み物件の多言語コンテンツを生成:
- description_en, description_zh_tw, description_zh_cn
- appeal_points_en
- stations[].name_en, stations[].line_en

## ステップ${skipReins ? '4' : '5'}: DB Sync
db-sync エージェントを使って、完成した物件データをSupabaseに保存:
- listings テーブルにINSERT
- 画像を media バケットにアップロード
- PDFを pdfs バケットにアップロード

## レポート
全ステップ完了後、以下を報告:
- 処理した物件数
- スキップした物件数と理由
- エラーがあれば詳細
- 所要時間`

  let sessionId: string | undefined

  for await (const message of query({
    prompt: orchestratorPrompt,
    options: {
      cwd: process.cwd(),
      allowedTools: ['Read', 'Bash', 'Glob', 'Grep', 'Write', 'Edit', 'Agent'],
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      model: 'claude-opus-4-6',
      thinking: { type: 'adaptive' },
      maxTurns: 200,
      maxBudgetUsd: 10.0,
      env: {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        IMPORT_ADMIN_USER_ID: process.env.IMPORT_ADMIN_USER_ID || '',
        MAISOKU_WATCH_DIR: pdfDir,
        REINS_LOGIN_ID: process.env.REINS_LOGIN_ID || process.env.REINS_USER_ID || '',
        REINS_LOGIN_PW: process.env.REINS_LOGIN_PW || process.env.REINS_PASSWORD || '',
        REINS_AREA: process.env.REINS_AREA || '東京都',
        REINS_CITY: process.env.REINS_CITY || '',
        REINS_PROPERTY_TYPE: process.env.REINS_PROPERTY_TYPE || '売マンション',
        REINS_PRICE_MIN: process.env.REINS_PRICE_MIN || '',
        REINS_PRICE_MAX: process.env.REINS_PRICE_MAX || '',
      },
      agents: {
        'reins-scraper': {
          description: reinsScraper.description,
          prompt: reinsScraper.prompt,
          tools: ['Bash', 'Read', 'Write'],
          mcpServers: reinsScraper.mcpServers,
        },
        'pdf-extractor': {
          description: pdfExtractor.description,
          prompt: pdfExtractor.prompt,
          tools: pdfExtractor.tools,
        },
        'data-validator': {
          description: dataValidator.description,
          prompt: dataValidator.prompt,
          tools: dataValidator.tools,
        },
        'translator': {
          description: translator.description,
          prompt: translator.prompt,
          tools: translator.tools,
        },
        'db-sync': {
          description: dbSync.description,
          prompt: dbSync.prompt,
          tools: dbSync.tools,
        },
      },
    },
  })) {
    if (message.type === 'system' && message.subtype === 'init') {
      sessionId = message.session_id
      log(`セッション開始: ${sessionId}`)
    }

    if ('result' in message) {
      log('')
      log('=== パイプライン完了 ===')
      console.log(message.result)
      log(`所要時間: ${((Date.now() - startTime) / 1000 / 60).toFixed(1)}分`)
      log(`セッションID: ${sessionId}`)
    }
  }
}

runPipeline().catch((err) => {
  console.error('パイプラインエラー:', err)
  process.exit(1)
})

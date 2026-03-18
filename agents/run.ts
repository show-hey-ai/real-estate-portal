#!/usr/bin/env npx tsx
/**
 * エージェントチーム統合CLI
 *
 * Usage:
 *   npx tsx agents/run.ts pipeline              物件パイプライン（REINS→PDF→検証→翻訳→DB）
 *   npx tsx agents/run.ts pipeline --skip-reins  REINS省略（PDF処理のみ）
 *   npx tsx agents/run.ts marketing              マーケティング全体（問い合わせ+SNS+メール）
 *   npx tsx agents/run.ts marketing --inbox      問い合わせ対応のみ
 *   npx tsx agents/run.ts marketing --ads        SNS投稿のみ
 *   npx tsx agents/run.ts marketing --email      メール配信のみ
 *   npx tsx agents/run.ts full                   全エージェント実行
 *   npx tsx agents/run.ts status                 エージェント状態確認
 */

const command = process.argv[2]

function printUsage() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║     Tokyo Property エージェントチーム                ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  物件パイプライン:                                   ║
║    pipeline              全ステップ実行              ║
║    pipeline --skip-reins PDF処理のみ                 ║
║    pipeline --dir <path> PDFディレクトリ指定         ║
║                                                      ║
║  マーケティング:                                     ║
║    marketing             全エージェント              ║
║    marketing --inbox     問い合わせ対応              ║
║    marketing --ads       SNS投稿                     ║
║    marketing --email     メール配信                  ║
║                                                      ║
║  統合:                                               ║
║    full                  全エージェント実行          ║
║    status                状態確認                    ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `)
}

async function main() {
  if (!command || command === 'help' || command === '--help') {
    printUsage()
    process.exit(0)
  }

  const startTime = Date.now()
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] エージェントチーム起動: ${command}`)
  console.log('')

  switch (command) {
    case 'pipeline': {
      const { runPipeline } = await import('./pipeline')
      // pipeline.ts は自身で実行するため、import するだけでOK
      break
    }
    case 'marketing': {
      // marketing.ts も自身で実行
      await import('./marketing')
      break
    }
    case 'full': {
      console.log('=== フルモード: パイプライン + マーケティング 順次実行 ===')
      console.log('')

      // まずパイプライン（物件登録）を完了してからマーケティング
      console.log('--- Phase 1: 物件パイプライン ---')
      await import('./pipeline')

      console.log('')
      console.log('--- Phase 2: マーケティング ---')
      await import('./marketing')
      break
    }
    case 'status': {
      console.log('エージェントチーム 状態:')
      console.log('')
      console.log('  物件パイプライン:')
      console.log('    REINS Scraper     - Chrome MCP経由でREINS操作')
      console.log('    PDF Extractor     - pdf-parse + Claude AIで抽出')
      console.log('    Data Validator    - 品質チェック（必須項目/価格/重複）')
      console.log('    Translator        - 日→英/中(繁/簡)翻訳')
      console.log('    DB Sync           - Supabase保存+画像UP')
      console.log('')
      console.log('  マーケティング:')
      console.log('    Inbox Responder   - Gmail MCP経由で問い合わせ対応')
      console.log('    Ad Manager        - Chrome MCP経由でSNS投稿')
      console.log('    Email Marketer    - Gmail MCP経由でリード通知')
      console.log('')
      console.log('使い方: npx tsx agents/run.ts <command>')
      break
    }
    default:
      console.error(`不明なコマンド: ${command}`)
      printUsage()
      process.exit(1)
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n[${new Date().toLocaleTimeString('ja-JP')}] 完了 (${elapsed}秒)`)
}

main().catch((err) => {
  console.error('エラー:', err)
  process.exit(1)
})

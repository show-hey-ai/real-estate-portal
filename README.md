# Ziyou Real Estate Portal

東京の投資用・居住用・土地の売買を扱う自由不動産の多言語ポータルサイト。Next.js + Supabase + Prisma。

## 構成（2026-09-29）

- 本番公開先: `https://portal.ziyou-fudosan.com`
- 3分類への更新はローカルで検証。本番への反映は別途行う
- 公開側は 4言語対応（日 / 英 / 繁中 / 簡中）
- 公開検索とマイソク取込の対象は東京23区。路線・駅マスタは23区向け同期が必要
- 路線・駅候補は `transit_line_master` / `transit_station_master` を正として参照
- 2026-03-30 の同期時点で、交通マスタは `46路線 / 447駅`
- 管理画面 `/admin/analytics` で PV・流入元・UTM・人気ページ / 物件を確認可能
- 購入相談のWhatsAppボタンを開いた回数も確認可能。送信済み・相談完了件数とは区別する
- 管理画面 `/admin/leads` でリード（問合せ）管理
- プレビュー `/preview/listings/[id]` で非公開物件の内部確認

## 技術スタック

- **フロントエンド:** Next.js 16 (App Router) + Tailwind CSS + shadcn/ui
- **DB:** Supabase (PostgreSQL) + Prisma ORM 7 + `@prisma/adapter-pg`
- **AI:** OpenAI Vision + Structured Outputs（広告判定・帯切り取り・詳細抽出・翻訳）、Jev（社内向けマイソク予備判定）
- **ストレージ:** Supabase Storage (PDFs: `pdfs/`, 画像: `media/`)
- **デプロイ:** Vercel

## ディレクトリ構成

```text
portal/
├── prisma/
│   ├── schema.prisma        ← DBスキーマ
│   └── migrations/          ← Prisma migrations
├── scripts/
│   ├── process-openai-vision.ts ← マイソク抽出・翻訳・DB登録
│   ├── reins-auto.ts            ← REINS取得→解析→登録の一気通し
│   ├── reins-download.ts        ← REINS自動ダウンロード
│   └── sync-transit-master.ts   ← 東京23区の路線・駅マスタ同期
├── src/
│   ├── app/
│   │   ├── (admin)/     ← 管理画面 (/admin/listings, /admin/leads, /admin/analytics)
│   │   ├── (auth)/      ← 認証 (/login, /register)
│   │   ├── (public)/    ← 公開ページ (/, /listings, /favorites, /preview)
│   │   └── api/         ← API Routes (auth, admin, listings, leads, analytics)
│   ├── components/
│   │   ├── admin/       ← 管理画面UI
│   │   └── listing/     ← 公開検索・一覧・詳細UI
│   └── lib/
│       ├── openai.ts            ← 抽出プロンプト・スキーマ（★ルールの正）
│       ├── address.ts           ← 住所マスク処理
│       ├── db.ts                ← Prisma クライアント
│       ├── public-search.ts     ← 公開検索の正規化・絞り込み
│       ├── public-search-server.ts ← 交通マスタ読込
│       ├── translate-fields.ts  ← 4言語表示変換
│       └── supabase/            ← Supabase クライアント
├── prisma.config.ts      ← Prisma config（`.env` 読込）
└── .env                 ← 環境変数
```

## マイソク処理パイプライン

REINSからDLしたマイソクPDFを、Supabase DBに物件として登録するフロー。

### 全体フロー

```
REINS DL（ reins-scraper）
  ↓ ~/Downloads/*.pdf
  ↓
scripts/process-openai-vision.ts
  ↓
Step1: OpenAI Vision — 広告文言抽出 + 掲載可否判定 + 反証チェック
  ├─ 非売買物件 → スキップ
  ├─ DENIED / APPROVAL_NEEDED / NOT_MENTIONED / AMBIGUOUS → スキップ
  └─ ALLOWED（高信頼 + 反証なし）→ Step2へ
  ↓
Step2: OpenAI Vision — 詳細抽出（25+フィールド）
  ↓
バリデーション: 広告可否の再確認 → 価格範囲 → 住所有無 → 売買物件種別 → 東京23区フィルタ
  ↓
Jev: 投資用・居住用・土地の候補分類と人による確認優先度を予備判定（APIキー設定時のみ）
  ↓
DB保存 + Storage（PDF・画像）
  └─ ALLOWEDのみ → ステータス DRAFT
  ↓
管理画面 /admin/listings で資料と広告許可を確認 → REVIEWED → PUBLISHED
```

※ denied/not_mentioned をStep1で早期スキップすることで、Step2のAPI呼び出しを約77%削減。

### 処理スクリプト

`scripts/process-openai-vision.ts` が、PDFテキスト抽出・Vision OCR・翻訳・DB登録の入口です。

### 使い方

```bash
# 1ファイル処理
npm run maisoku -- ~/Downloads/xxx.pdf

# 監視ディレクトリの全PDFを一括処理（既定: ~/Downloads/maisoku、処理済みは maisoku-processed/ に移動）
npm run maisoku:all

# ドライラン（DB書き込みなし）
npm run maisoku:all -- --dry-run

# 最大5ファイルまで
npm run maisoku:all -- --max=5

# REINS から PDF をまとめて取得
npx tsx scripts/reins-download.ts --headless

# REINS取得 → 自動解析 → DB/Storage登録 を一気通し
npm run reins:auto -- --headless

# ダウンロード済みPDFだけ再処理
npm run reins:auto -- --skip-reins --dry-run --max=5

# 既存公開物件の広告可否をAI再チェック（既定はDB変更なし）
npm run ad:recheck -- --max=10

# 危険判定のPUBLISHED物件をARCHIVEDへ自動変更
npm run ad:recheck -- --apply

# 管理画面で確認 → DRAFTをPUBLISHEDに変更
open http://localhost:3000/admin/listings
```

### AIモデル設定

広告判定は保守的に行う。`ALLOWED` と高信頼で検証され、詳細抽出でも広告可と確認できた物件だけ下書き保存する。それ以外（広告不可、要承諾、記載なし、矛盾、読みにくい）は自動スキップ。Jevは広告許可や公開を決定しない。

| 処理 | 環境変数 | 既定 |
|---|---|---|
| 広告文言抽出・可否判定・反証チェック | `MAISOKU_AD_MODEL` | `gpt-4.1` |
| 管理会社帯の切り取り | `MAISOKU_BANNER_MODEL` | `gpt-4.1` |
| OCR補助 | `MAISOKU_OCR_MODEL` | `gpt-4.1-mini` |
| 物件詳細抽出 | `MAISOKU_EXTRACT_MODEL` | `gpt-4.1-mini` |
| 翻訳 | `MAISOKU_TRANSLATE_MODEL` | `gpt-4.1-mini` |
| マイソク予備判定 | `JEV_MODEL` | `jev-latest` |

Jevを利用するにはサーバー側の `.env` に `JEV_API_KEY` を設定する。未設定・通信失敗時も候補は下書きとして保存され、管理メモに「未実施」と記録される。APIキーをブラウザーへ渡さない。賃貸中の区分・戸建、一棟、店舗・事務所は投資用、空室・売主居住の区分・戸建は居住用、土地は土地へ分類する。取込は常に下書きで、広告許可・資料・分類・現況を人が確認してから公開する。

### 広告掲載許可の判定パターン（帯・オビを重点確認）

大前提: 自社ポータル（ziyou-fudosan.com）のみに掲載する。

| マイソク記載 | ad_status | ad_allowed |
|---|---|---|
| 「広告掲載：可」「広告掲載全媒介可」「承諾不要」 | ✅ allowed | true |
| 「自社HP掲載可」「御社HP掲載可」「自社媒体のみ可」 | ✅ allowed | true |
| 「1社HPのみ掲載可能」「1社HP可」 | ✅ allowed | true |
| 「紙媒体・自社HPは可」 | ✅ allowed | true |
| 「SUUMO等厳禁」でも「自社HP可」→ 自社ポータル該当 | ✅ allowed | true |
| 「SUUMO以外可能」等の明確な許可範囲 | 自社ポータルが許可範囲内なら allowed | true |
| 「楽待不可」「健美家不可」だけで許可の記載なし | 未確認として保留 | false |
| 「広告掲載不可」+「※1社HPのみ掲載可能」→ 例外優先 | ✅ allowed | true |
| 「広告承認」（帯に記載） | ⏸ approval_needed | false |
| 「広告掲載はこちらから」（申込窓口あり） | ⏸ approval_needed | false |
| 「広告掲載申請（自社HPのみ）」 | ⏸ approval_needed | false |
| 「承諾書なき広告禁止」「承諾書をいただきますよう」 | ⏸ approval_needed | false |
| 「広告転載不可」「広告掲載厳禁」「広告掲載一切不可」 | ❌ denied | false |
| 何も書いてない | ❌ not_mentioned | false |
| 「広告有効期限 YYYY/MM」→ REINS登録期限で無関係 | 無視 | — |

共通判定基準: `src/lib/ad-publication-policy.ts`。広告抽出・独立検証・詳細抽出・Codex処理で同じ5原則を使い、最終公開チェックでも明確な許可原文を確認する。禁止と例外は文面全体で判断し、未解消の禁止・事前承諾条件・判読不能は保留。REINS詳細の広告転載区分も原資料として確認する。

### 管理画面のステータス

| ステータス | バッジ色 | 意味 |
|---|---|---|
| DRAFT | 灰色 | 通常取込（広告可）、レビュー待ち |
| IN_REVIEW | オレンジ🟠 | 承認掲載枠（承諾書取得→レビュー→公開） |
| REVIEWED | 黄色 | レビュー済、公開可能 |
| PUBLISHED | 緑色 | 公開中（ポータルに表示） |
| ARCHIVED | 赤色 | アーカイブ済 |

### 対象エリア

マイソク取込・公開検索の区候補: 東京23区。既存の路線・駅マスタが旧対象エリアの場合は `npm run transit:sync` で更新する。REINS取得の既定は `売マンション`（種目は未指定）で、売一戸建は `REINS_PROPERTY_TYPE=売一戸建` を指定して別途取得する。現在の `reins-auto.ts` は `reins-config.json` の複数検索パターンを読み込まず、1回の実行で1つの物件種別だけを検索する。定期実行設定はなく、取得は手動開始。Finderの `運用/reins-fetch.command` は売マンションを最大2ページ取得して下書きまで進める。旧・宿泊向け一括公開は停止中。

## 公開検索（東京23区 / 路線 / 駅）

- ホーム `/` と一覧 `/listings` は `src/lib/public-search-server.ts` から検索候補を取得
- 正のデータは DB の `transit_line_master` / `transit_station_master`
- 同期元は国土交通省 国土数値情報
  - 鉄道データ: `N02-24`
  - 行政区域データ: `N03-20240101_13`
- 同期スクリプト: `scripts/sync-transit-master.ts`
- 交通マスタが空のときだけ、公開中かつ `adAllowed=true` の物件データから候補をフォールバック生成
- 路線名・駅名の表記ゆれは `src/lib/public-search.ts` で正規化

### 交通マスタの更新

```bash
npx prisma migrate deploy
npm run transit:sync
```

同期後の確認例:

```bash
npx prisma studio
npm run build
```

### その他スクリプト

| スクリプト | 用途 |
|---|---|
| `process-openai-vision.ts` | マイソク抽出・翻訳・DB登録 |
| `sync-transit-master.ts` | 東京23区の路線・駅マスタ同期 |
| `reins-download.ts` | REINS自動ダウンロード |
| `reins-auto.ts` | REINS取得→解析→DB/Storage登録 |
| `recheck-published-ad-policy.ts` | 公開済み物件の広告可否AI再チェック |
| `reins-debug.ts` | REINSデバッグ |
| `fix-missing-images.ts` | 画像なし物件の修復 |
| `check-no-img.ts` | 画像なし物件チェック |
| `check-schema.js` | DB/型の簡易確認 |
| `check_prices.ts` | 物件価格一覧確認 |
| `list-ad-allowed.ts` | adAllowed=true物件一覧 |
| `seed-listings.ts` | テスト用シードデータ |

## 開発

```bash
npm install
cp .env.example .env  # 環境変数を設定
npx prisma generate
npx prisma migrate deploy
npm run transit:sync   # 路線・駅マスタを同期
npm run dev            # http://localhost:3000
```

管理系 API は Supabase セッション上の `ADMIN` ユーザーのみ実行可能です。

## ルールの正（Source of Truth）

| ルール | ファイル |
|---|---|
| 抽出スキーマ（フィールド定義） | `src/lib/openai.ts` → `extractionSchema` |
| 広告判定（掲載ゲート） | `src/lib/maisoku-ai.ts` |
| 管理会社帯切り取り | `src/lib/maisoku-ai.ts` |
| 住所プライバシー（番地マスク） | `src/lib/address.ts` → `formatPublicAddress()` |
| DBスキーマ | `prisma/schema.prisma` |
| 東京23区の取込フィルタ | `scripts/process-openai-vision.ts` → `TOKYO_23KU` |
| Jevの予備判定 | `src/lib/jev-maisoku.ts` |
| API構成 | 広告判定・帯切り取りは `gpt-4.1`、詳細抽出・翻訳は `gpt-4.1-mini` |
# 自律運営

既存ポータルの定期観測、REINS取込、広告・事実・翻訳の自動検査、合格候補の自動公開、公開後の復旧、根拠付き多言語記事、技術SEOの巡回を `/admin/autonomy` で管理します。初期状態は停止・有料予算ゼロです。設定後の通常処理に物件ごとの承認は不要です。

専用ワーカーは `npm run autonomy:worker`、単発検証は `npm run autonomy:once`、隔離されたテストは `npm run test:autonomy`。本番の起動条件、費用予約と実費の区別、現行の取得範囲は [docs/AUTONOMY.md](docs/AUTONOMY.md) を参照してください。ローカル実装・テストは、本番の24時間稼働を意味しません。

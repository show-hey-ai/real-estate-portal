# Ziyou Real Estate Portal

自由不動産の物件ポータルサイト。Next.js + Supabase + Prisma。

## 現状（2026-03-30）

- 本番公開先: `https://portal.ziyou-fudosan.com`
- 公開側は 4言語対応（日 / 英 / 繁中 / 簡中）
- 検索は `都心13区` と `路線 -> 駅` の両方に対応
- 路線・駅候補は `transit_line_master` / `transit_station_master` を正として参照
- 2026-03-30 の同期時点で、交通マスタは `46路線 / 447駅`

## 技術スタック

- **フロントエンド:** Next.js 16 (App Router) + Tailwind CSS + shadcn/ui
- **DB:** Supabase (PostgreSQL) + Prisma ORM 7 + `@prisma/adapter-pg`
- **AI:** Claude Sonnet 4.6 (Step1: 分類・広告判定, Step2: 詳細抽出) / Claude Agent SDK (エージェント処理)
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
│   └── sync-transit-master.ts   ← 都心13区の路線・駅マスタ同期
├── src/
│   ├── app/
│   │   ├── (admin)/     ← 管理画面 (/admin/listings)
│   │   ├── (auth)/      ← 認証
│   │   ├── (public)/    ← 公開ページ
│   │   └── api/         ← API Routes
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
Step1: Claude Sonnet 4.6 — 文書分類 + 広告ステータス判定
  ├─ 非売買物件 → スキップ
  ├─ ad_status: "denied"（広告不可明示）→ スキップ
  ├─ ad_status: "not_mentioned"（記載なし）→ スキップ
  ├─ ad_status: "allowed" → Step2へ
  └─ ad_status: "approval_needed" → Step2へ
  ↓
Step2: Claude Sonnet 4.6 — 詳細抽出（25+フィールド）
  ↓
バリデーション: 価格範囲 → 住所有無 → 都心13区フィルタ
  ↓
DB保存 + Storage（PDF・画像）
  ├─ allowed → ステータス DRAFT（通常レビューフロー）
  └─ approval_needed → ステータス IN_REVIEW（承認掲載枠 🟠）
  ↓
管理画面 /admin/listings で確認 → REVIEWED → PUBLISHED
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

# 管理画面で確認 → DRAFTをPUBLISHEDに変更
open http://localhost:3000/admin/listings
```

### 広告掲載許可の判定パターン（帯・オビを重点確認）

大前提: 自社ポータル（ziyou-fudosan.com）のみに掲載する。

| マイソク記載 | ad_status | ad_allowed |
|---|---|---|
| 「広告掲載：可」「広告掲載全媒介可」「承諾不要」 | ✅ allowed | true |
| 「自社HP掲載可」「御社HP掲載可」「自社媒体のみ可」 | ✅ allowed | true |
| 「紙媒体・自社HPは可」「広告掲載申請（自社HPのみ）」 | ✅ allowed | true |
| 「SUUMO等厳禁」でも「自社HP可」→ 自社ポータル該当 | ✅ allowed | true |
| 「楽待不可」「健美家不可」等の特定媒体のみ不可 | ✅ allowed | true |
| 「広告承認」（帯に記載） | ⏸ approval_needed | false |
| 「広告掲載はこちらから」（申込窓口あり） | ⏸ approval_needed | false |
| 「承諾書なき広告禁止」「承諾書をいただきますよう」 | ⏸ approval_needed | false |
| 「広告転載不可」「広告掲載厳禁」「広告掲載一切不可」 | ❌ denied | false |
| 何も書いてない | ❌ not_mentioned | false |
| 「広告有効期限 YYYY/MM」→ REINS登録期限で無関係 | 無視 | — |

正のファイル: `scripts/process-openai-vision.ts` → Step1プロンプト

### 管理画面のステータス

| ステータス | バッジ色 | 意味 |
|---|---|---|
| DRAFT | 灰色 | 通常取込（広告可）、レビュー待ち |
| IN_REVIEW | オレンジ🟠 | 承認掲載枠（承諾書取得→レビュー→公開） |
| REVIEWED | 黄色 | レビュー済、公開可能 |
| PUBLISHED | 緑色 | 公開中（ポータルに表示） |
| ARCHIVED | 赤色 | アーカイブ済 |

### 都心13区フィルタ

対象: 千代田・中央・港・新宿・渋谷・文京・目黒・品川・豊島・台東・墨田・江東・大田
除外: 上記以外の東京23区・都下・他県

## 公開検索（都心13区 / 路線 / 駅）

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
| `sync-transit-master.ts` | 都心13区の路線・駅マスタ同期 |
| `reins-download.ts` | REINS自動ダウンロード |
| `reins-auto.ts` | REINS取得→解析→DB/Storage登録 |
| `reins-debug.ts` | REINSデバッグ |
| `fix-missing-images.ts` | 画像なし物件の修復 |
| `check-no-img.ts` | 画像なし物件チェック |
| `check-schema.js` | DB/型の簡易確認 |
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
| 広告判定（Step1プロンプト） | `scripts/process-openai-vision.ts` → `CLASSIFY_SYSTEM_PROMPT` |
| 広告判定（Step2 ad_allowed） | `scripts/process-openai-vision.ts` → Step2 system prompt |
| 住所プライバシー（番地マスク） | `src/lib/address.ts` → `formatPublicAddress()` |
| DBスキーマ | `prisma/schema.prisma` |
| 都心13区フィルタ | `scripts/process-openai-vision.ts` → `TOKYO_13KU` |
| API構成 | Step1・Step2ともに Claude Sonnet 4.6（リトライ2回付き） |

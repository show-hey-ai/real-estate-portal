# プロジェクト学習メモ

## 2026-03-30

### DNS設定（MuuMuu Domain）

- **カスタムDNS設定2** でCNAMEレコードを追加する手順
  - `moveToCustomAdd('MU17326123')` → フォームに値をセット → `addCustomRecord()` で送信
  - **CNAMEの値に末尾の `.` は不要**（MuuMuuのバリデーションで弾かれる）
  - Chrome拡張のデバッグモードでは `confirm()` ダイアログが自動的に抑制される → `window.confirm = () => true` でオーバーライドが必要
  - ドメインID: `MU17326123` (ziyou-fudosan.com)
  - 設定済みCNAME: `portal` → `8d3fa20631ee41eb.vercel-dns-017.com`

### 翻訳システムの問題と修正

**問題1: 駅名が英語表示されない**
- 原因: OpenAIがREINSから抽出する駅名は「大森町駅」のように「駅」付きだが、`stationNameMap`のキーは「大森町」（駅なし）
- 修正: `translateStationName()` に駅サフィックス除去ロジックを追加
- 根本対策: OpenAI抽出スキーマに `name_en` フィールドを追加（今後のインポートで自動英語化）

**問題2: 住所が翻訳されない**
- 原因: `translateAddress()` は都道府県（東京都）をキーに探すが、一部の物件は「港区港南3-7」のように都道府県なしで保存されている
- 修正: 都道府県マッチ失敗時に区市町村名で直接マッチし、「Minato, Tokyo」のように出力するフォールバックを追加

**問題3: stationNameMapの不足**
- ~90件の駅名を追加（大田区・品川区・港区・中央区・世田谷区・杉並区・北区・荒川区・足立区・江東区周辺）

### 登録フォーム

- Name欄を削除。顧客にとって不要な入力項目であり、登録のハードルになる
- Email + Password + Confirm Password のみに簡素化

### ファイルパス・接続情報

| 項目 | 値 |
|------|------|
| ローカルリポジトリ | `/Users/shoheifujita/Desktop/ziyou/portal` |
| GitHub | `show-hey-ai/real-estate-portal` |
| Vercel URL | `portal-psi-virid.vercel.app` |
| カスタムドメイン | `portal.ziyou-fudosan.com` |
| MuuMuuドメインID | `MU17326123` |
| 言語Cookie名 | `locale` (値: ja/en/zh-TW/zh-CN) |

### 翻訳フロー（i18n）

```
locale Cookie → src/i18n/request.ts → messages/{locale}.json (UI文字列)
                                    → translate-fields.ts (DB値の翻訳)
                                       ├─ translatePropertyType()
                                       ├─ translateStationName() ← 駅サフィックス対応済
                                       ├─ translateAddress()     ← 都道府県なし対応済
                                       ├─ translateRailwayLine()
                                       ├─ translateStructure()
                                       └─ translateZoning()
```

listing-card.tsx の駅名表示ロジック:
```
1. locale !== 'ja' && station.name_en → name_en を使う（最優先）
2. translateStationName(station.name) → stationNameMapで翻訳
3. station.name → フォールバック（日本語のまま）
```

### 次回作業メモ

- [ ] REINS物件追加（現在7件 → 目標20件）
- [ ] 新規インポート時は `name_en` が自動抽出されるか確認
- [ ] HP (ziyou-fudosan.com) のVercelリンクは旧URLのままでも動作する（リダイレクト不要）

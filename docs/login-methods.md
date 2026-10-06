# お客様用ログインの接続設定

対象: https://portal.ziyou-fudosan.com （Supabase: ziyou-portal）

これは運営側が一度行うサービスとの接続登録です。お客様によるログインテストとは別です。
お客様は登録後、普段のGoogle・LINEなどのアカウントで利用できます。
各サービスのパスワードをポータルに入力することはありません。

## 現在の実装

- メール＋パスワード、新規登録、パスワード再設定を保持。
- パスワードを使わないメールリンクでの登録・ログインを追加。
- Google / LINE / Apple / Facebook / Microsoft / GitHub は、Supabaseで接続設定が済んだものだけボタンを表示。
- 管理画面 `/admin/login-methods` で設定状況と公式手順を確認。
- 認証はすべてSupabaseのPKCE・本人確認・既存のアクセス制御を経由。チャットや買主条件の所有者IDを変更しない。
- 管理者権限は既存のDB権限のまま。プロフィールやメールが一致したという理由で独自にアカウントを統合しない。
- WeChatは専用接続の確認待ち。一般的なOAuthボタンを置くだけでは動作済みと扱わない。

## 共通の戻り先

Supabase → Authentication → URL Configuration:

- Site URL: `https://portal.ziyou-fudosan.com`
- Redirect URL: `https://portal.ziyou-fudosan.com/api/auth/callback\?next=**`
- 既存のパスワード再設定用URLは保持。

許可するのはこの本番ホストの認証コールバックのクエリ部分だけ。`\?` はglobのワイルドカードではなく、実際のクエリ開始文字 `?` に一致させるための指定。
アプリで `next` を再検証し、外部URL・二重スラッシュ・不正なエスケープなどを拒否する。
ワイルドカードで別ホストや全パスを許可しない。
メールリンクは要求したブラウザで開く。候補のデプロイURLやlocalhostを本番の許可リストに増やさない。
メール送信はSupabaseの送信間隔・回数制限に従う。画面の送信完了表示はメール受信やログイン完了の証明ではない。

## Google（最初に接続する候補）

1. Google Cloud / Google Auth Platformで、このサイトを運営するプロジェクトとOAuthのWebアプリを登録。
2. ブランド名・連絡先・公開用の同意画面・対象利用者を設定。最小限のメールと基本プロフィールだけを要求。
3. Authorized JavaScript origin: `https://portal.ziyou-fudosan.com`
4. Authorized redirect URI: `https://fnxibittudgldhyoiacj.supabase.co/auth/v1/callback`
5. 作成したClient IDとClient Secretは、Supabase → Authentication → Sign In / Providers → Googleへ直接設定して有効化。
6. 公開サイトにボタンが現れることを確認し、一般利用者のアカウントでログインを検証する。テスト利用者だけの設定で一般公開完了と扱わない。

秘密鍵・Client Secret・パスワードをチャット、ソース、デスクトップの平文メモに残さない。
プロバイダ側の契約・規約への同意、新しい認証情報の入力は運営者の操作が必要になる場合がある。

[Google設定の公式手順](https://supabase.com/docs/guides/auth/social-login/auth-google)

## LINE

1. LINE DevelopersでWeb向けLINE Loginチャネルを登録。
2. メールアドレス取得の利用申請と表示説明を用意。メール取得が認められるまでは公開ログインに使用しない。
3. SupabaseのCustom Providerを `custom:line` として設定。公式のOIDC情報と作成画面の専用Callback URLを使う。
4. スコープは `openid profile email`、メール必須、PKCE有効。クライアント側から自由なプロバイダIDやエンドポイントは受け付けない。
5. 接続後は、同じ認証ユーザーの買主条件・チャットへアクセスでき、他のお客様の情報を閲覧できないことを検証。

[LINEの公式手順](https://developers.line.biz/en/docs/line-login/integrate-line-login/)
 / [Supabaseカスタム接続の公式手順](https://supabase.com/docs/guides/auth/custom-oauth-providers)

## その他

Apple / Facebook / Microsoft / GitHub もそれぞれの開発者画面でWebログイン用アプリを登録し、
Supabaseの該当プロバイダに設定する。申請・契約・費用の条件は各サービスの現行条件で確認。
有料アカウントや追加サービスには自動で申し込まない。

## WeChat（微信）

微信开放平台のWebサイト用アプリ登録・利用条件・審査状況を確認する。
WeChatのIDとメールなし利用者を現在のSupabaseユーザーへ安全につなぐ専用接続は、まだ実装・検証済みではない。
架空のメール、ニックネーム照合、独自JWT発行による近道を作らない。
登録情報と正式な接続方法が確認できてから実装し、既存アカウントのデータを独立して保護する。

[微信开放平台](https://open.weixin.qq.com/)

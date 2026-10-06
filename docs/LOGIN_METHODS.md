# Customer login methods

User selection on 2026-10-06: Google, Apple, Facebook and WeChat/微信. Keep email/password and email-link login as a fallback. LINE, Microsoft and GitHub are excluded from the customer catalog even if they are enabled upstream. Supabase dashboard access through GitHub is a separate operator login and remains unchanged.

## Current readiness

The live provider settings currently return no enabled external customer providers. Google, Apple and Facebook use the existing Supabase PKCE and safe callback flow. Their buttons appear only when the real provider is enabled. Client configuration never includes provider secrets. WeChat has a separate pending card in the admin console and cannot enter the customer OAuth flow yet.

- Google: register a web OAuth client in the operator Google Cloud project, configure the consent screen and permitted production callback, then add the client ID and secret to the Google provider in Supabase. Complete a real customer sign-in before calling it verified.
- Apple: confirm the existing Apple Developer membership, App ID, website Services ID and signing key. Configure the project callback; store the signing key privately and rotate the web client secret before its six-month expiry. Do not create a paid membership without explicit approval. Test a real sign-in including private relay email before calling it verified.
- Facebook: register the login app in Meta, configure the production domain, callback and required policy links. Development-mode tester sign-in does not prove availability to general customers; confirm public release requirements and complete a real customer sign-in.
- WeChat: confirm the Open Platform website application and approved login scope. Do not assume it is a built-in Supabase provider, a standard OIDC provider, or that it supplies a verified email. The dedicated integration must validate the authorization code and state with the approved upstream service, establish the actual provider identity, and safely obtain/verify the email the current portal requires. Never fabricate an email or merge accounts by nickname/email matching alone. Until the bridge, account binding, callback, authorization checks and real sign-in are verified, it stays unavailable.

## Verification and operations

Check `/api/auth/methods` and the customer login/register pages in Japanese, English, Traditional and Simplified Chinese. Verify a real provider callback and return to the original `/match` or property chat route, private buyer UUID data, logout, anonymous and nonparticipant rejection. Never loosen redirect allowlists, buyer RLS or role preservation to work around a provider issue. Preserve existing customer accounts and the current production logout correction.

Keep credentials in provider/Supabase protected configuration. Do not put passwords, app secrets, signing keys or access tokens in source, admin page HTML, public API output, logs, or this document. Provider registration/paid membership/legal agreement/user consent may require user action. The present catalog update does not create those credentials, enable provider settings, or prove a successful external sign-in.

Official setup references:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/social-login/auth-apple
- https://supabase.com/docs/guides/auth/social-login/auth-facebook
- https://open.weixin.qq.com/

The recommendation is Google first, WeChat for the Chinese-speaking buyer route, Apple for Apple-account users and Facebook as a supplementary route. This is an audience/setup judgment, not a measured conversion result.

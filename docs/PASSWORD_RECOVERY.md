# Password recovery

Login links to `/forgot-password`. Supabase `resetPasswordForEmail` sends recovery mail and requests `/api/auth/callback?next=%2Freset-password`. The existing PKCE callback exchanges the code for a session; failed recovery callbacks return to the request screen with an expired-link notice. The email link must be opened in the requesting browser.

The reset screen verifies the authenticated user before displaying the form and again before calling `updateUser`. Password confirmation and a minimum of eight characters are required. Passwords are not logged or persisted by the portal. After a successful update, sign-out failure is shown separately with a retry button.

Four locales are supported. Request success uses a neutral message to avoid disclosing account existence. Supabase controls token validity, email delivery, password policy and rate limits.

## Production status (2026-10-04)

Published deployment: dpl_7H8BRpqsxyvvp8KTb43iPUCj8AwN. Login and recovery screens return HTTP 200 in all four locales.

The Site URL is now https://portal.ziyou-fudosan.com and the exact recovery callback is on the redirect allow list. A generated sample recovery link retains the requested callback; no recovery email or actual password mutation was used in verification.

Custom SMTP is now enabled and saved in Supabase using the user-authorized Google Workspace sender admin@ziyou-fudosan.com, smtp.gmail.com and SSL port 465. The user created and supplied an existing app password, which was saved directly to Supabase without copying it into source files, local plaintext memos, logs or general memory. Reloading the dashboard confirmed the persisted settings.

A production recovery request for admin@ziyou-fudosan.com was sent through the portal in Chrome. Gmail received the email from 自由不動産 Ziyou on 2026-10-04 at 08:24 JST. Opening its recovery link in the same Chrome session reached the authenticated reset form with both password fields. Delivery to this administrator mailbox and the real recovery callback are verified; delivery to every customer mailbox is not asserted. No actual portal password was changed; entry and submission of a new portal password are left to the user.

## Verification

Targeted local browser checks cover the login link, request payload and callback, neutral response, rate-limit retry, mobile width, invalid session, password mismatch, backend rejection, invalid callback, and logout failure/retry. Password mutations and email sends in UI tests are intercepted; the private sample is used only to verify an authenticated session.

Implement magic-link login for carry.naliv.kz:

1. `src/api/authApi.ts`: add `loginCourierByMagicLink(token)` → POST `/courier/auth/magic-link` `{token}`, reuse `unwrapApiResponse` + `setCourierToken`. Map axios status to user messages: 401 → «Ссылка недействительна или срок её действия истёк. Запросите новую в боте (/login)», 429 → «Слишком много попыток, повторите позже», 404 → «Сервис входа по ссылке недоступен».

2. `src/api/client.ts`: skip Authorization header also for `/courier/auth/magic-link`.

3. `src/store/authStore.ts`: extend `extractTokenFromUrl` to read `courier_token` (priority) or `token`; `clearTokenFromUrl` removes both. In `initialize()`, route magic-link token to `loginCourierByMagicLink`, keep legacy `?token=` → `loginCourierByToken` for backward compat.

4. Update `App.tsx` / `LoginPage.tsx` URL-token effects to also read `courier_token` (share a small helper in `src/utils` to avoid duplication).

5. Verify: `npm run build`, and manual check of error states (401) via a fake token.
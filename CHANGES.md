# Review fixes – DMS_FE

Changes on branch `review-fixes`, from the code review of 1 Oct 2026. Use together with the DMS_API `review-fixes`
branch (the login and new endpoints need it).

## Run

```bash
cp .env.example .env.local     # set REACT_APP_API_URL, e.g. https://localhost:7151/api
npm install --legacy-peer-deps
npm start
npm test                        # 3 tests
npm run typecheck
```

## What changed

| Finding | Change | Files |
| --- | --- | --- |
| S5 / F3 | Real login: token stored in `sessionStorage`, sent as `Authorization: Bearer`, 401 logs out, expired tokens log out automatically | `services/authService.ts`, `services/DMSLifecycleService.ts`, `App.tsx`, `pages/LandingPage.tsx` |
| F6 | No more `TestUser13`, "Test User Name", "COMPANY": user comes from the token; company name and environment label from `.env` | `App.tsx`, `PageHeader.tsx`, `config/appConfig.ts` |
| – | API URL from `REACT_APP_API_URL` (was hard-coded `https://localhost:7151/api`) | `config/appConfig.ts` |
| F1 | Dashboard Pending Approval reads `toApproveCnt` (was always 0) | `DashboardManual.tsx` |
| F2 | Network errors no longer crash the API error handler | `DMSLifecycleService.ts` |
| A2 | Circular category filter sends `categoryId` (was ignored by the API) | `CircularsList.tsx` |
| – | Notifications: mark-as-read sends the real ID, and circular notifications call the Circular endpoint | `NotificationList.tsx`, `NotificationListCicrular.tsx` |
| F4 | Info button uses an icon (the `info.jpg` image was broken on case-sensitive hosts) | `ManualsContent.tsx` |
| F5 | Version History shows real data (was hard-coded sample rows) | `ManualVersionHistory.tsx` |
| F7 | `alert()` replaced by toasts; "Send Message" (no feature behind it) removed; unbuilt import options disabled | `services/notify.ts`, `ManualsTreeView.tsx`, `ManualsContent.tsx`, `AddEditManual.tsx` |
| F8 | Acknowledgement list loads without the 500 ms delay and shows errors | `CircularsList.tsx` |
| S10 | Manual/compare HTML sanitised with DOMPurify before rendering | `ViewCompareManualDetails.tsx`, `HtmlDiff.tsx`, `ApprovalFlow.tsx` |
| UI | One header on every page: logo, title, navigation (Dashboard / Manuals / Circulars), page actions, user, log out | `PageHeader.tsx/.scss`, `Dashboard.tsx` |
| UI | New login page | `pages/Login.tsx/.scss` |
| UI | One date format everywhere ("28 Sep 2026") | `components/utils/formatDate.ts`, circulars, manual header, version history |
| UI | "New circular" moved to the page header; empty "Level -" and "0 Attachments" hidden; Favorites button wired up | `CircularsList.tsx` |
| UI | Dashboard chart uses one colour; numbers no longer underlined; captions readable | `ManualChart.tsx`, `Dashboard.scss` |
| UI | Manuals page usable on tablets/phones: tree keeps its height and stacks above the content | `ManualMainPage.scss` |
| Deps | Removed unused `quill`, `jodit-react-ts`, `html-docx-js`, `html-docx-js-typescript`, `history`, `mammoth`, `file-saver`, `css-loader`, `js-cookie`; declared `dompurify`; types and test libraries moved to `devDependencies` | `package.json`, `package-lock.json` |
| Tests / CI | Default CRA test replaced with login and date tests; GitHub Actions runs typecheck, tests and build | `App.test.tsx`, `.github/workflows/build.yml` |

## Not changed yet

* 126 `any` types and large components (`CircularsList.tsx`, `AddEditCircular.tsx`, `ManualsTreeView.tsx`).
* Inline styles and hard-coded colours outside the files above.
* Moving from Create React App to Vite.

## How it was checked

`npm run typecheck`, `npm test` (3 passing) and `npm run build` succeed. The built app was run in a browser against
a mock API: login, logout, dashboard, manuals, version history, circulars, notification mark-as-read, and the
manuals page at phone width.

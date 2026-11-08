# Celah motion and editorial revision

The owner expanded the task to remove all Supabase runtime services and use a self-hosted backend/PostgreSQL. See [the current migration receipt](celah-selfhosted-postgres.md). The earlier Supabase-specific editorial migration was not applied and has been superseded by server/schema.sql.

Motion fixes include an independent finite hero entrance, non-sticky scroll progress, reactive reduced-motion policy, readable cavity/filled-button colors and a coordinated diagonal theme transition. Project figures now differentiate reflection inspection, architecture, role lanes and category exploration.

Editorial management provides project summaries/studies, featured selection/order, arbitrary skill groups and persistent CV publication. Certifications use the real database editor; the misleading localStorage certification editor was removed. Frontend now uses the same-origin API for content, sessions, storage, security events, contact and analytics.

Backend is staged privately; SMTP and CAPTCHA configuration are deferred at the owner's request. Browser QA and public cutover are pending, not approved or verified by build/tests alone.

## Content growth workflow

These steps describe the candidate admin interface backed by the same-origin API. After public cutover, content updates use persisted records without rebuilding the frontend. A successful save publishes to the selected backend; **Pratinjau isi** is a local content preview, not a separate draft or scheduled-publishing system. The current public deployment remains unchanged until cutover.

| Content | Admin workflow | Public result to check |
| --- | --- | --- |
| Projects and editorial | In **Projects**, create or edit the title, problem, solution, technologies, category, image and links. Save the project first. In **Content → Editorial portofolio**, select it, enter the short summary, role, period and study context; enter challenges, approach and outcomes one item per line. Use **Pratinjau isi**, choose featured status and numeric order, then **Simpan dan terbitkan**. Fill the study context to activate the custom case-study fields; otherwise the derived study remains the fallback. | Karya, the project's existing ID-based URL, the case study and RIVA use the shared presentation. Featured records appear in Home and Tentang experience, with lower order values first. New projects without a supplied image use generic artwork; custom diagrams remain tied to their established project IDs. |
| Skills | In **Content → Kelompok keahlian**, choose a group or **Tambah kelompok**; set its name, one skill per line and order, then **Terbitkan kelompok**. The same editor supports removal. | Tentang shows the persisted groups in order. A successful empty response shows the honest empty state; unavailable data retains the existing fallback. |
| Certifications | In **Sertifikasi**, create or edit the name, issuer, year, status, credential link and optional certificate image, then save. | Tentang reads the persisted certification records and credential/image links. Project achievements remain a separate section and are not presented as certifications. |
| CV | In **Content → CV publik**, select a PDF no larger than **10 MB** and wait for **CV diterbitkan**. The upload is published through the saved public CV setting. | Reload Home and Tentang and open both **Unduh CV** links; both should resolve to the newly published PDF. A failed upload/publication must report failure rather than a successful replacement. |

Keep existing project IDs and URLs when editing. Verify facts and links before publishing; do not add invented metrics, credentials or screenshots. When editorial records exist, unchecking every featured project intentionally leaves the featured sections empty; the four-project fallback applies only when no editorial rows are available. Reload a public page after saving to check fresh content rather than relying on an already cached view.

## Pending release verification

Browser preview remains denied by the saved permission gate. **No screenshots, interactive browser validation or public cutover approval exist for this revision.** The workflow above is derived from source and has not been exercised in a browser in this session.

Before cutover, use authorized test content to check project/editorial create and edit, featured ordering and empty states, a managed project's case-study URL, skills publication/removal, persisted certification links/images and CV replacement. Confirm persistence after reload and in a fresh authenticated session, then restore test content. Check API-unavailable states, long content and failed images/uploads alongside desktop/mobile layouts, both themes, keyboard focus, reduced motion, theme/canvas fallback, RIVA and form/admin flows. Keep database/upload backups and the operational gates in the migration receipt. Do not send real email while SMTP is unconfigured; delivery checks require the owner's later configuration and explicit request.

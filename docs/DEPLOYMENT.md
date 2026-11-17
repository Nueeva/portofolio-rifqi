# Production deployment

The portfolio's production domain is **https://rifqi.apexsions.my.id**. The previous `rifqi.apexsions.com` virtual host returns HTTP 410 as observed on 17 November 2026. Do not use the old hostname for canonical links, API Origin checks or release verification.

The production site runs on the portfolio VPS, with nginx serving a versioned directory under `/var/www/rifqi-releases/`. Its active virtual host is `/etc/nginx/sites-enabled/rifqi.apexsions.my.id`. The owned Fastify API and PostgreSQL run in the `rifqi_portfolio` Docker Compose project, configured under `/opt/rifqi-portfolio-backend/`; only the API is recreated for this release. Uploads and the database are persistent. Credentials remain outside Git.

## Release procedure

1. Fetch `origin/main`, preserve existing edits and review the complete change. Run TypeScript, lint, backend tests and PostgreSQL integration tests against an isolated local database.
2. Capture production's public `/api/public-content` snapshot. Build with `PUBLIC_CONTENT_API_URL` serving that snapshot, then run frontend release tests and the local browser suite against the final build. A failed content request must abort the build.
3. Commit and push to `main` without forcing. Name the frontend release and API image with that commit, and include its full hash in the release artifact's `release.json`.
4. Stage the frontend, backend image and SHA-256 manifest without changing the active nginx root. Back up nginx configuration, backend source/configuration, the prior API image and PostgreSQL database. Keep the existing root for rollback.
5. Keep the server's environment, mounts, database volume and private credentials. Set the API's `PUBLIC_ORIGIN` to `https://rifqi.apexsions.my.id`; deploy the frontend and backend together because the new editor requires `POST /api/projects/save`. This release requires no schema migration.
6. Recreate only the API, verify health, then change the portfolio virtual host's root and validate/reload nginx. Retain preceding hashed assets for open tabs. On a failed verification, restore the prior API image/configuration and nginx root; do not overwrite the live database or uploads.
7. Check public routes, canonical metadata, asset hashes, service-worker cache headers, the API's public snapshot, authenticated login/session/logout and anonymous denial of private resources. Test the workspace endpoint's authorization/validation without creating or changing production content. Verify HTTPS through the public domain as well as the origin virtual host.

Build-time snapshots are point-in-time content. Rebuild for later CMS changes that must appear in static HTML/SEO. A production receipt should identify the source commit, artifact hashes, backup/release paths and actual checks; a successful local test run alone does not establish deployment.

See [the codebase guide](current-codebase.md), [the implementation record](AUTH_ADMIN_REDESIGN_IMPLEMENTATION.md) and [the README](../README.md).

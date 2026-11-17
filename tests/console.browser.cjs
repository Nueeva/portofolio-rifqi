/* Local-only UI regression fixtures. No production account, email or media is used. */
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const fs = require("node:fs");
const path = require("node:path");
const base = process.env.CONSOLE_BASE_URL || "http://127.0.0.1:8080";
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(base).hostname),
  "Use a local server",
);
const out = process.env.CONSOLE_SCREENSHOTS || "/tmp/celah-console-screenshots";
fs.mkdirSync(out, { recursive: true });
const record = (n) => ({
  id: "project-" + n,
  title: "Karya riset " + n,
  problem: "Masalah yang nyata",
  solution: "Solusi yang nyata",
  category: "tools",
  tech_stack: ["React", "TypeScript"],
  image_url: n === 1 ? "/api/storage/project-images/thumbnails/old.png" : null,
  github_url: null,
  demo_url: null,
  created_at: "2026-11-01T00:00:00Z",
  updated_at: "2026-11-01T00:00:00Z",
});
const user = {
  id: "local-test-admin",
  email: "pengelola@example.invalid",
  created_at: "2026-11-01T00:00:00Z",
};
const passed = [];
const pageErrors = [];
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  async function setup(options = {}) {
    const state = {
      authenticated: !!options.admin,
      sessionFail: !!options.sessionFail,
      uploadFail: !!options.uploadFail,
      saveFail: !!options.saveFail,
      records: Array.from({ length: options.count ?? 4 }, (_, n) =>
        record(n + 1),
      ),
      calls: [],
    };
    const context = await browser.newContext({
      viewport: options.viewport || { width: 1440, height: 1000 },
      colorScheme: options.theme || "dark",
      reducedMotion: "reduce",
    });
    await context.addInitScript(
      (theme) => localStorage.setItem("theme", theme),
      options.theme || "dark",
    );
    await context.route("**/*", async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
        await route.abort();
        return;
      }
      if (!url.pathname.startsWith("/api/")) {
        await route.continue();
        return;
      }
      let body;
      try {
        body = req.postDataJSON();
      } catch {}
      const name = url.pathname;
      state.calls.push({ name, body });
      let value = { data: [], error: null },
        status = 200;
      if (name.startsWith("/api/storage/") && req.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "image/png",
          body: Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHN8AAAAASUVORK5CYII=",
            "base64",
          ),
        });
        return;
      }
      if (name === "/api/auth/session") {
        status = state.sessionFail ? 503 : 200;
        value = state.sessionFail
          ? { error: { message: "Hors ligne" } }
          : {
              data: { session: state.authenticated ? { user } : null },
              error: null,
            };
      } else if (name === "/api/rpc/has_role")
        value = { data: state.authenticated, error: null };
      else if (name === "/api/config")
        value = {
          captchaEnabled: false,
          captchaSiteKey: null,
          emailEnabled: options.emailEnabled !== false,
        };
      else if (name === "/api/functions/verify-turnstile")
        value = { data: { success: true }, error: null };
      else if (name === "/api/auth/login") {
        state.authenticated = true;
        value = { data: { session: { user }, user }, error: null };
      } else if (name === "/api/auth/logout") {
        state.authenticated = false;
        value = { data: null, error: null };
      } else if (name === "/api/auth/reset-request")
        value = { data: {}, error: null };
      else if (name === "/api/data/projects") {
        if (body?.operation === "delete") {
          const ids = body.filters[0].value;
          state.records = state.records.filter(
            (row) =>
              !(Array.isArray(ids) ? ids.includes(row.id) : row.id === ids),
          );
          value = { data: null, error: null };
        } else {
          let rows = state.records;
          for (const filter of body?.filters ?? []) {
            rows = rows.filter((row) => row[filter.field] === filter.value);
          }
          value = { data: rows, error: null };
        }
      } else if (name === "/api/projects/save") {
        if (state.saveFail) {
          status = 500;
          value = {
            data: null,
            error: { message: "Penyimpanan gagal untuk pengujian." },
          };
        } else {
          const saved = {
            ...body.project,
            updated_at: new Date().toISOString(),
          };
          state.records = state.records
            .filter((row) => row.id !== saved.id)
            .concat(saved);
          value = {
            data: { project: saved, editorial: body.editorial },
            error: null,
          };
        }
      } else if (name.includes("/upload")) {
        if (state.uploadFail) {
          status = 503;
          value = {
            data: null,
            error: { message: "Unggahan gagal untuk pengujian." },
          };
        } else
          value = { data: { path: url.searchParams.get("path") }, error: null };
      } else if (name === "/api/analytics/summary")
        value = {
          data: {
            totalViews: 0,
            uniqueVisitors: 0,
            avgViewsPerDay: 0,
            viewsByPage: [],
            viewsByDate: [],
            topReferrers: [],
          },
          error: null,
        };
      else if (name === "/api/events") {
        await route.fulfill({
          contentType: "text/event-stream",
          body: ": test fixture\n\n",
        });
        return;
      }
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(value),
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(
      base + (options.url || (options.admin ? "/admin" : "/auth")),
      { waitUntil: "networkidle" },
    );
    return { page, context, state };
  }
  async function check(name, action) {
    await action();
    passed.push(name);
    console.log("PASS " + name);
  }
  try {
    await check(
      "auth validation, autofill, password visibility and login",
      async () => {
        const { page, context, state } = await setup();
        await page.screenshot({
          path: path.join(out, "auth-dark-clean.png"),
          fullPage: true,
        });
        await page.getByRole("button", { name: "Masuk", exact: true }).click();
        assert.equal(
          await page.locator("#email").getAttribute("aria-invalid"),
          "true",
        );
        assert.equal(
          await page.evaluate(() => document.activeElement.id),
          "email",
        );
        assert.equal(
          await page.locator("#password").getAttribute("autocomplete"),
          "current-password",
        );
        await page
          .getByLabel("Email", { exact: true })
          .fill("owner@example.com");
        await page
          .getByLabel("Kata sandi", { exact: true })
          .fill("existing-short");
        await page
          .getByRole("button", { name: "Tampilkan kata sandi", exact: true })
          .click();
        assert.equal(
          await page.locator("#password").getAttribute("type"),
          "text",
        );
        await page.screenshot({
          path: path.join(out, "auth-dark-desktop.png"),
          fullPage: true,
        });
        await page.getByRole("button", { name: "Masuk", exact: true }).click();
        await page
          .getByRole("heading", { name: "Karya & studi kasus" })
          .waitFor();
        assert.ok(state.calls.some((call) => call.name === "/api/auth/login"));
        await context.close();
      },
    );
    await check(
      "session errors are retryable instead of anonymous",
      async () => {
        const { page, context, state } = await setup({ sessionFail: true });
        await page
          .getByRole("heading", { name: "Sesi belum dapat diperiksa." })
          .waitFor();
        state.sessionFail = false;
        await page.getByRole("button", { name: "Coba lagi" }).click();
        await page
          .getByRole("heading", { name: "Selamat datang kembali." })
          .waitFor();
        await context.close();
      },
    );
    await check(
      "unavailable recovery and malformed tokens are honest",
      async () => {
        const { page, context, state } = await setup({
          emailEnabled: false,
          url: "/auth?mode=forgot",
        });
        await page
          .getByText("Layanan email belum diaktifkan.", { exact: false })
          .waitFor();
        assert.equal(await page.locator("button[type=submit]").count(), 0);
        assert.ok(
          !state.calls.some((call) => call.name === "/api/auth/reset-request"),
        );
        await page.goto(base + "/auth?reset=true");
        await page
          .getByRole("heading", { name: "Tautan tidak valid." })
          .waitFor();
        await page
          .getByRole("button", { name: "Kembali ke halaman masuk" })
          .click();
        assert.equal(new URL(page.url()).search, "");
        await context.close();
      },
    );
    await check(
      "workspace navigation, contextual actions and theme-scoped dialog",
      async () => {
        const { page, context } = await setup({ admin: true });
        await page
          .getByRole("button", { name: "Tambah karya", exact: true })
          .waitFor();
        await page.screenshot({
          path: path.join(out, "admin-dark-desktop.png"),
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "Hapus Karya riset 1", exact: true })
          .click();
        const dialog = page.getByRole("alertdialog");
        await dialog.waitFor();
        assert.equal(
          await dialog.evaluate((e) => !!e.closest('[data-design="legacy"]')),
          true,
        );
        await dialog
          .getByRole("button", { name: "Batal", exact: true })
          .click();
        await page
          .getByRole("link", { name: "Preferensi", exact: true })
          .click();
        assert.ok(page.url().includes("section=theme"));
        await page
          .getByRole("heading", { name: "Preferensi", exact: true })
          .waitFor();
        assert.equal(
          await page
            .getByRole("button", { name: "Tambah karya", exact: true })
            .count(),
          0,
        );
        await page.reload();
        await page
          .getByRole("heading", { name: "Preferensi", exact: true })
          .waitFor();
        await context.close();
      },
    );
    await check(
      "safe replacement: upload failure never saves or deletes cover",
      async () => {
        const { page, context, state } = await setup({
          admin: true,
          uploadFail: true,
        });
        await page
          .getByRole("button", { name: "Ubah Karya riset 1", exact: true })
          .click();
        await page.getByLabel("Judul karya").waitFor();
        await page.getByLabel("Ganti gambar cover").setInputFiles({
          name: "replacement.png",
          mimeType: "image/png",
          buffer: Buffer.from("pngfixture"),
        });
        await page
          .getByRole("button", { name: "Simpan perubahan", exact: true })
          .click();
        await page
          .getByRole("alert")
          .filter({ hasText: "Unggahan gagal" })
          .waitFor();
        assert.equal(
          state.calls.filter((call) => call.name === "/api/projects/save")
            .length,
          0,
        );
        assert.equal(
          state.calls.filter((call) => call.name.endsWith("/remove")).length,
          0,
        );
        assert.equal(
          state.records[0].image_url,
          "/api/storage/project-images/thumbnails/old.png",
        );
        await page.screenshot({
          path: path.join(out, "editor-upload-error.png"),
          fullPage: true,
        });
        await context.close();
      },
    );
    await check(
      "atomic workspace saves study and project together; failed save retains fields",
      async () => {
        const { page, context, state } = await setup({
          admin: true,
          saveFail: true,
        });
        await page
          .getByRole("button", { name: "Ubah Karya riset 1", exact: true })
          .click();
        await page.getByLabel("Judul karya").fill("Karya yang diperbarui");
        await page
          .getByLabel("Konteks studi kasus")
          .fill("Konteks yang diperbarui");
        await page
          .getByRole("button", { name: "Simpan perubahan", exact: true })
          .click();
        await page
          .getByRole("alert")
          .filter({ hasText: "Penyimpanan gagal" })
          .waitFor();
        assert.equal(
          await page.getByLabel("Judul karya").inputValue(),
          "Karya yang diperbarui",
        );
        state.saveFail = false;
        await page.screenshot({
          path: path.join(out, "editor-desktop.png"),
          fullPage: true,
        });
        await page
          .getByRole("button", { name: "Simpan perubahan", exact: true })
          .click();
        await page
          .getByRole("heading", { name: "Karya & studi kasus" })
          .waitFor();
        const calls = state.calls.filter(
          (call) => call.name === "/api/projects/save",
        );
        assert.equal(
          calls.at(-1).body.editorial.overview,
          "Konteks yang diperbarui",
        );
        await context.close();
      },
    );
    await check(
      "dirty edits block sidebar and browser Back navigation",
      async () => {
        const { page, context } = await setup({ admin: true });
        await page
          .getByRole("button", { name: "Ubah Karya riset 1", exact: true })
          .click();
        await page
          .getByLabel("Judul karya")
          .fill("Perubahan yang belum disimpan");
        await page
          .getByRole("link", { name: "Kunjungan", exact: true })
          .click();
        await page
          .getByRole("alertdialog")
          .getByRole("button", { name: "Kembali ke editor" })
          .click();
        assert.equal(
          await page.getByLabel("Judul karya").inputValue(),
          "Perubahan yang belum disimpan",
        );
        await page.goBack();
        await page
          .getByRole("alertdialog")
          .getByRole("button", { name: "Kembali ke editor" })
          .click();
        assert.equal(
          await page.getByLabel("Judul karya").inputValue(),
          "Perubahan yang belum disimpan",
        );
        await page
          .getByRole("button", { name: "Semua karya", exact: true })
          .click();
        await page
          .getByRole("alertdialog")
          .getByRole("button", { name: "Buang perubahan" })
          .click();
        await page
          .getByRole("heading", { name: "Karya & studi kasus" })
          .waitFor();
        await context.close();
      },
    );
    await check(
      "pagination clamps after deleting final item on last page",
      async () => {
        const { page, context } = await setup({
          admin: true,
          count: 11,
          url: "/admin?page=2",
        });
        await page
          .getByRole("button", { name: "Hapus Karya riset 11", exact: true })
          .click();
        await page
          .getByRole("alertdialog")
          .getByRole("button", { name: "Hapus karya", exact: true })
          .click();
        await page.getByText("Halaman 1 dari 1", { exact: false }).waitFor();
        assert.ok(!page.url().includes("page=2"));
        await context.close();
      },
    );
    for (const theme of ["dark", "light"])
      for (const width of [320, 390, 1440])
        await check(`responsive ${theme} ${width}px`, async () => {
          const { page, context } = await setup({
            admin: true,
            theme,
            viewport: { width, height: 900 },
          });
          await page
            .getByRole("heading", { name: "Karya & studi kasus" })
            .waitFor();
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          await page.screenshot({
            path: path.join(out, `admin-${theme}-${width}.png`),
            fullPage: true,
          });
          if (width < 800) {
            await page.getByRole("button", { name: "Buka navigasi" }).click();
            await page
              .getByRole("dialog")
              .getByRole("link", { name: "Keahlian & CV", exact: true })
              .click();
            await page
              .getByRole("heading", { name: "Keahlian & CV", exact: true })
              .waitFor();
          }
          await page.goto(base + "/auth");
          await page
            .getByRole("heading", { name: "Karya & studi kasus" })
            .waitFor(); // existing admin session returns to console
          await context.close();
        });
    await check("mobile account menu supports logout", async () => {
      const { page, context } = await setup({
        admin: true,
        viewport: { width: 390, height: 844 },
      });
      await page.getByRole("button", { name: "Buka navigasi" }).click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: "Keluar", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Selamat datang kembali." })
        .waitFor();
      await context.close();
    });
    await check(
      "export failures do not produce partial downloads",
      async () => {
        const { page, context } = await setup({
          admin: true,
          url: "/admin?section=export",
        });
        let downloads = 0;
        page.on("download", () => downloads++);
        await page.route("**/api/data/site_settings", (route) =>
          route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ error: { message: "Source unavailable" } }),
          }),
        );
        await page.getByRole("button", { name: "Ekspor semua data" }).click();
        await page
          .getByRole("alert")
          .filter({ hasText: "Tidak ada file yang diunduh" })
          .waitFor();
        assert.equal(downloads, 0);
        await context.close();
      },
    );
    await check("light auth action contrast and mobile reflow", async () => {
      const { page, context } = await setup({
        theme: "light",
        viewport: { width: 390, height: 844 },
      });
      await page
        .getByRole("heading", { name: "Selamat datang kembali." })
        .waitFor();
      const colors = await page
        .locator('button[type="submit"]')
        .evaluate((e) => ({
          foreground: getComputedStyle(e).color,
          background: getComputedStyle(e).backgroundColor,
        }));
      const luminance = (value) => {
        const channels = value
          .match(/[\d.]+/g)
          .slice(0, 3)
          .map(Number)
          .map((v) => v / 255)
          .map((v) =>
            v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
          );
        return (
          channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
        );
      };
      const pair = [
        luminance(colors.foreground),
        luminance(colors.background),
      ].sort((a, b) => b - a);
      assert.ok((pair[0] + 0.05) / (pair[1] + 0.05) >= 4.5);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      await page.screenshot({
        path: path.join(out, "auth-light-mobile.png"),
        fullPage: true,
      });
      await context.close();
    });
    assert.deepEqual(pageErrors, []);
    fs.writeFileSync(
      path.join(out, "results.json"),
      JSON.stringify({ passed, pageErrors }, null, 2),
    );
    console.log(JSON.stringify({ passed: passed.length, screenshots: out }));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

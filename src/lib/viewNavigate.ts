import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import type { NavigateFunction, NavigateOptions } from "react-router-dom";
import { warmRoute } from "./routePrefetch";

export type NavDirection = "forward" | "backward";

export interface ViewNavigateOptions {
  projectId?: string;
  direction?: NavDirection;
}

interface ViewTransitionLike {
  ready: Promise<void>;
  finished: Promise<void>;
  skipTransition?: () => void;
}

type DocumentWithVT = Document & {
  startViewTransition?: (
    arg:
      | (() => void | Promise<void>)
      | { update: () => void | Promise<void>; types?: string[] },
  ) => ViewTransitionLike;
};

const VT_VISUAL_NAME = "celah-project-visual";
const VT_TITLE_NAME = "celah-project-title";

function clearViewTransitionNames() {
  if (typeof document === "undefined") return;
  document
    .querySelectorAll<HTMLElement>('[data-vt-active], [style*="view-transition-name"]')
    .forEach((el) => {
      el.style.removeProperty("view-transition-name");
      delete el.dataset.vtActive;
    });
}

function findFirstVisible(selector: string): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(selector);
  for (const el of candidates) {
    if (el.getClientRects().length > 0) return el;
  }
  return candidates[0] ?? null;
}

function tagSharedElements(projectId?: string) {
  clearViewTransitionNames();
  if (!projectId || typeof document === "undefined") return;
  const escaped =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(projectId)
      : projectId.replace(/"/g, '\\"');
  const visual = findFirstVisible(`[data-vt-visual="${escaped}"]`);
  const title = findFirstVisible(`[data-vt-title="${escaped}"]`);
  if (visual) {
    visual.style.viewTransitionName = VT_VISUAL_NAME;
    visual.dataset.vtActive = "true";
  }
  if (title) {
    title.style.viewTransitionName = VT_TITLE_NAME;
    title.dataset.vtActive = "true";
  }
}

function focusMainHeading() {
  const heading = document.querySelector<HTMLElement>("main h1");
  if (!heading) return;
  heading.tabIndex = -1;
  heading.focus({ preventScroll: true });
}

function waitForRouteMount(targetPath: string, timeoutMs = 450): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  const escaped =
    typeof CSS !== "undefined" && typeof CSS.escape === "function"
      ? CSS.escape(targetPath)
      : targetPath.replace(/"/g, '\\"');
  const selector = `main [data-page-path="${escaped}"]`;
  if (document.querySelector(selector)) return Promise.resolve();

  return new Promise((resolve) => {
    const main = document.getElementById("main-content") ?? document.body;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timer);
      resolve();
    };
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) finish();
    });
    observer.observe(main, { childList: true, subtree: true });
    const timer = window.setTimeout(finish, timeoutMs);
  });
}

export function navigateWithViewTransition(
  event: MouseEvent<HTMLAnchorElement>,
  navigate: NavigateFunction,
  to: string,
  options?: ViewNavigateOptions,
) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }

  event.preventDefault();

  if (typeof document === "undefined" || typeof window === "undefined") {
    navigate(to);
    return;
  }

  const doc = document as DocumentWithVT;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inkBusy = doc.documentElement.dataset.inkBusy === "true";

  window.dispatchEvent(new Event("celah:navigation"));

  if (reduced || inkBusy || typeof doc.startViewTransition !== "function") {
    navigate(to);
    return;
  }

  const direction = options?.direction ?? "forward";
  const targetPath = to.split(/[?#]/)[0] || "/";
  const projectId = options?.projectId;

  doc.documentElement.dataset.vtNav = direction;
  tagSharedElements(projectId);

  const runUpdate = async () => {
    await warmRoute(targetPath);
    flushSync(() => {
      navigate(to, { flushSync: true } as NavigateOptions);
    });
    await waitForRouteMount(targetPath);
    tagSharedElements(projectId);
  };

  let transition: ViewTransitionLike | undefined;
  try {
    try {
      transition = doc.startViewTransition({
        update: runUpdate,
        types: [direction],
      });
    } catch {
      transition = doc.startViewTransition(runUpdate);
    }
  } catch {
    clearViewTransitionNames();
    delete doc.documentElement.dataset.vtNav;
    window.dispatchEvent(new Event("celah:navigation"));
    navigate(to);
    return;
  }

  void transition.finished.finally(() => {
    clearViewTransitionNames();
    delete doc.documentElement.dataset.vtNav;
    focusMainHeading();
    window.dispatchEvent(new Event("celah:navigation"));
  });
}

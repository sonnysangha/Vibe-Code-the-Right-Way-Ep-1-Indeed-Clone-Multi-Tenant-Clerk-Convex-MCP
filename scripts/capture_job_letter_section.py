#!/usr/bin/env python3
"""Headless screenshots of the landing JobLetterOutbound block (requires `next start`)."""

from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "test-artifacts"
BASE = "http://127.0.0.1:3456"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.goto(f"{BASE}/", wait_until="networkidle", timeout=120_000)
        page.wait_for_selector("text=Your desk", timeout=60_000)

        page.locator("text=Reach more teams").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT / "job-letter_section_viewport.png"))

        for frac in (0.18, 0.38, 0.55):
            page.evaluate(
                """(pct) => {
                  const main = document.querySelector('main');
                  if (!main) return;
                  const max = Math.max(0, main.scrollHeight - window.innerHeight);
                  window.scrollTo({ top: max * pct, left: 0, behavior: 'instant' });
                }""",
                frac,
            )
            page.wait_for_timeout(700)
            tag = str(frac).replace(".", "_")
            page.screenshot(path=str(OUT / f"job-letter_scroll_{tag}.png"))

        browser.close()


if __name__ == "__main__":
    main()

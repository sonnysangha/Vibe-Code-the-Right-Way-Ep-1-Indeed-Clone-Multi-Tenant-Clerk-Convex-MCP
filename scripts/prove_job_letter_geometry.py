#!/usr/bin/env python3
"""
Synthetic geometry check + PNG artifact mirroring JobLetterOutbound Bézier routing.

Mirrors logic from components/landing/job-letter-outbound.tsx for QA visualization.
Requires matplotlib + numpy.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

OUT_DIR = Path(__file__).resolve().parents[1] / "test-artifacts"

SPREAD_BY_INDEX = (1.35, -1.05, 0.75, -1.4, 1.15, -0.9)
ARC_LIFT_PX = -26


def ease_out_cubic(t: float) -> float:
    x = min(1.0, max(0.0, t))
    return 1 - (1 - x) ** 3


def cubic_bezier(t: float, p0, p1, p2, p3):
    u = 1 - t
    u2 = u * u
    u3 = u2 * u
    t2 = t * t
    t3 = t2 * t
    return (
        u3 * p0[0] + 3 * u2 * t * p1[0] + 3 * u * t2 * p2[0] + t3 * p3[0],
        u3 * p0[1] + 3 * u2 * t * p1[1] + 3 * u * t2 * p2[1] + t3 * p3[1],
    )


def control_points(start, end, spread: float, lift: float):
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    ln = max(40.0, np.hypot(dx, dy))
    nx = -dy / ln
    ny = dx / ln
    bend = min(140.0, ln * 0.42) * spread
    lift_y = lift * spread
    mid_x = (start[0] + end[0]) / 2
    mid_y = (start[1] + end[1]) / 2 + lift_y
    cp1 = (mid_x + nx * bend, mid_y + ny * bend * 1.05)
    cp2 = (
        mid_x - nx * bend * 0.42,
        mid_y - ny * bend * 0.5 + lift_y * 0.35,
    )
    return cp1, cp2


def approach_target(full_end, start):
    dx = full_end[0] - start[0]
    dy = full_end[1] - start[1]
    ln = max(80.0, np.hypot(dx, dy))
    ux = dx / ln
    uy = dy / ln
    shorten = min(36.0, ln * 0.08)
    return (full_end[0] - ux * shorten, full_end[1] - uy * shorten - 6)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    start = (260.0, 210.0)
    raw_targets = [
        (170 + i * 118 + (i % 3) * 12, 430 + (i % 2) * 28)
        for i in range(6)
    ]

    fig, ax = plt.subplots(figsize=(11, 6), dpi=140)
    ax.set_aspect("equal")
    ax.set_facecolor("#fafaf8")
    ax.axis("off")
    ax.set_title(
        "JobLetterOutbound — synthetic arc separation & shortened endpoints\n"
        "(mirrors TS controlPoints / approachTarget / SPREAD_BY_INDEX)",
        fontsize=10,
        color="#1a1523",
        pad=12,
    )

    ax.add_patch(
        plt.Rectangle((110, 120), 300, 200, fill=True, facecolor="#ffffff", edgecolor="#e8e8e3", linewidth=1.2, zorder=3),
    )
    ax.text(260, 330, "YOUR DESK (mock bounds)", ha="center", fontsize=8, color="#706f6c")

    ax.scatter([start[0]], [start[1]], s=80, c="#30a46c", zorder=5, edgecolors="white")
    for i, raw in enumerate(raw_targets):
        end = approach_target(raw, start)
        spread = SPREAD_BY_INDEX[i % len(SPREAD_BY_INDEX)]
        cp1, cp2 = control_points(start, end, spread, ARC_LIFT_PX)

        ts = np.linspace(0, 1, 160)
        pts = np.array([cubic_bezier(t, start, cp1, cp2, end) for t in ts])
        ax.plot(
            pts[:, 0],
            pts[:, 1],
            color="#30a46c",
            alpha=0.35 + i * 0.03,
            linewidth=1.3,
            zorder=1,
        )

        ax.scatter([raw[0]], [raw[1]], s=45, c="#d4d4cf", zorder=4, marker="s")
        ax.scatter([end[0]], [end[1]], s=28, c="#30a46c", zorder=4, marker="o")

        for frac in (0.35, 0.62):
            pos = cubic_bezier(frac, start, cp1, cp2, end)
            ax.scatter([pos[0]], [pos[1]], s=22, c="#30a46c", alpha=0.55, zorder=2)

        ax.annotate(f"T{i+1}", raw, textcoords="offset points", xytext=(0, -14), ha="center", fontsize=7, color="#706f6c")

    ax.set_xlim(80, 1020)
    ax.set_ylim(90, 520)
    fig.tight_layout()
    out_png = OUT_DIR / "job-letter_geometry_proof.png"
    fig.savefig(out_png, bbox_inches="tight")
    plt.close(fig)

    # Numeric sanity: endpoints sit above raw targets (screen coords: smaller y is higher)
    assert all(approach_target(r, start)[1] < r[1] + 1 for r in raw_targets)
    # Bézier samples stay within bbox of control hull loosely
    for i, raw in enumerate(raw_targets):
        end = approach_target(raw, start)
        spread = SPREAD_BY_INDEX[i % len(SPREAD_BY_INDEX)]
        cp1, cp2 = control_points(start, end, spread, ARC_LIFT_PX)
        pts = [cubic_bezier(t, start, cp1, cp2, end) for t in (0, 0.5, 1)]
        assert all(80 <= p[0] <= 1020 and 90 <= p[1] <= 520 for p in pts)

    eased_mid = ease_out_cubic(0.6)
    assert 0.8 < eased_mid <= 1.0
    print(f"OK — wrote {out_png}")


if __name__ == "__main__":
    main()

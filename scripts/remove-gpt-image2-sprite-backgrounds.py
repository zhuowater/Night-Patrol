#!/usr/bin/env python3
from __future__ import annotations

from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SPRITES = [
    'assets/generated/characters/player-night-patrol.png',
    'assets/generated/enemies/lantern.png',
    'assets/generated/enemies/waterghost.png',
    'assets/generated/enemies/templecorpse.png',
    'assets/generated/enemies/macaque.png',
    'assets/generated/enemies/warlock.png',
    'assets/generated/enemies/foxshade.png',
    'assets/generated/enemies/tigerlord.png',
]


def is_background_pixel(r: int, g: int, b: int) -> bool:
    # GPT-image2 sprite generations often return a very dark studio/cyber-noir
    # background. Remove only edge-connected dark pixels so dark details inside
    # the character are preserved.
    brightness = max(r, g, b)
    teal_blue_cast = b >= r - 8 and g >= r - 12
    return brightness < 72 and teal_blue_cast


def remove_edge_background(path: Path) -> None:
    im = Image.open(path).convert('RGBA')
    w, h = im.size
    px = im.load()
    visited = bytearray(w * h)
    bg = bytearray(w * h)
    q: deque[tuple[int, int]] = deque()

    def idx(x: int, y: int) -> int:
        return y * w + x

    def try_seed(x: int, y: int) -> None:
        i = idx(x, y)
        if visited[i]:
            return
        r, g, b, _ = px[x, y]
        if is_background_pixel(r, g, b):
            visited[i] = 1
            bg[i] = 1
            q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if nx < 0 or ny < 0 or nx >= w or ny >= h:
                continue
            i = idx(nx, ny)
            if visited[i]:
                continue
            visited[i] = 1
            r, g, b, _ = px[nx, ny]
            if is_background_pixel(r, g, b):
                bg[i] = 1
                q.append((nx, ny))

    mask = Image.new('L', (w, h), 255)
    mpx = mask.load()
    removed = 0
    for y in range(h):
        for x in range(w):
            if bg[idx(x, y)]:
                mpx[x, y] = 0
                removed += 1
    # Feather edges for cleaner in-game compositing.
    mask = mask.filter(ImageFilter.GaussianBlur(radius=1.0))
    im.putalpha(mask)
    im.save(path, optimize=True)
    print(f'{path.relative_to(ROOT)} removed={removed} size={path.stat().st_size}')


def main() -> int:
    for rel in SPRITES:
        remove_edge_background(ROOT / rel)
    return 0

if __name__ == '__main__':
    raise SystemExit(main())

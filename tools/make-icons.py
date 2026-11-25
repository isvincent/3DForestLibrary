"""
森嶼書屋 · 心靈微光圖書館 — PWA 圖示產生器
用法：python tools/make-icons.py
輸出：icons/icon.svg、icon-192.png、icon-512.png、maskable-512.png、apple-touch-icon.png、favicon-32.png
需求：Pillow (pip install pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "icons"
OUT.mkdir(exist_ok=True)

S = 512  # design space

TOP = "#eef3ec"
SIDE = "#9e9589"
RIM = "#e6a145"
SAGE = "#4f735b"
PINE = "#587d61"
AMBER = "#f0b562"
PAGE_L = "#fbf8f1"
PAGE_R = "#efe6d3"
BG_TOP = "#9cc2c3"
BG_BOTTOM = "#4f735b"

island_top = [(406, 300), (331, 350), (181, 350), (106, 300), (181, 250), (331, 250)]
island_side = [(106, 300), (181, 350), (331, 350), (406, 300), (406, 330), (331, 392), (181, 392), (106, 330)]
rim_band = [(106, 300), (181, 350), (331, 350), (406, 300), (406, 312), (331, 364), (181, 364), (106, 312)]
tree1 = [(150, 292), (196, 292), (173, 214)]
tree2 = [(330, 286), (366, 286), (348, 226)]
trunk1 = [(169, 292), (177, 292), (177, 306), (169, 306)]
trunk2 = [(345, 286), (351, 286), (351, 298), (345, 298)]
cover_l = [(258, 312), (190, 292), (190, 240), (258, 258)]
cover_r = [(258, 312), (326, 292), (326, 240), (258, 258)]
page_l = [(256, 302), (196, 284), (196, 232), (256, 250)]
page_r = [(260, 302), (320, 284), (320, 232), (260, 250)]
glow = (356, 146, 40)


def svg_markup(maskable=False):
    scale = 0.8 if maskable else 1.0
    offset = S * (1 - scale) / 2
    poly = lambda pts, fill: '<polygon points="%s" fill="%s"/>' % (" ".join(f"{x},{y}" for x, y in pts), fill)
    bg = (
        f'<rect width="{S}" height="{S}" fill="url(#bg)"/>'
        if maskable
        else f'<rect width="{S}" height="{S}" rx="112" fill="url(#bg)"/>'
    )
    gx, gy, gr = glow
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="{BG_TOP}"/>
      <stop offset="1" stop-color="{BG_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="halo">
      <stop offset="0" stop-color="{AMBER}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="{AMBER}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  {bg}
  <g transform="translate({offset} {offset}) scale({scale})">
    <circle cx="{gx}" cy="{gy}" r="{gr * 2.2}" fill="url(#halo)"/>
    <circle cx="{gx}" cy="{gy}" r="{gr}" fill="{AMBER}"/>
    <ellipse cx="256" cy="402" rx="168" ry="26" fill="#26231f" opacity="0.18"/>
    {poly(island_side, SIDE)}
    {poly(rim_band, RIM)}
    {poly(island_top, TOP)}
    {poly(trunk1, "#7d5a3c")}{poly(trunk2, "#7d5a3c")}
    {poly(tree1, PINE)}{poly(tree2, "#6d9169")}
    {poly(cover_l, SAGE)}{poly(cover_r, SAGE)}
    {poly(page_l, PAGE_L)}{poly(page_r, PAGE_R)}
    <line x1="258" y1="250" x2="258" y2="304" stroke="{SAGE}" stroke-width="4"/>
  </g>
</svg>
'''


def hex2rgb(h, a=255):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def render(size, maskable=False, rounded=True):
    ss = 4  # supersample
    W = size * ss
    k = W / S
    scale = 0.8 if maskable else 1.0
    off = W * (1 - scale) / 2
    tf = lambda pts: [(off + x * k * scale, off + y * k * scale) for x, y in pts]

    # gradient background
    bg = Image.new("RGBA", (W, W))
    top, bot = hex2rgb(BG_TOP), hex2rgb(BG_BOTTOM)
    for y in range(W):
        t = y / (W - 1)
        bg.paste(tuple(int(top[i] + (bot[i] - top[i]) * t) for i in range(3)) + (255,), (0, y, W, y + 1))
    mask = Image.new("L", (W, W), 0)
    md = ImageDraw.Draw(mask)
    if maskable or not rounded:
        md.rectangle((0, 0, W, W), fill=255)
    else:
        md.rounded_rectangle((0, 0, W - 1, W - 1), radius=int(112 * k), fill=255)
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    img.paste(bg, (0, 0), mask)

    # halo
    gx, gy, gr = glow
    cx, cy = off + gx * k * scale, off + gy * k * scale
    halo = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    r = gr * 2.0 * k * scale
    hd.ellipse((cx - r, cy - r, cx + r, cy + r), fill=hex2rgb(AMBER, 120))
    halo = halo.filter(ImageFilter.GaussianBlur(radius=gr * 0.7 * k * scale))
    img = Image.alpha_composite(img, halo)

    d = ImageDraw.Draw(img)
    r = gr * k * scale
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=hex2rgb(AMBER))

    shadow = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sx, sy = off + 256 * k * scale, off + 402 * k * scale
    sd.ellipse((sx - 168 * k * scale, sy - 26 * k * scale, sx + 168 * k * scale, sy + 26 * k * scale), fill=(38, 35, 31, 46))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=6 * k * scale))
    img = Image.alpha_composite(img, shadow)
    d = ImageDraw.Draw(img)

    for pts, col in [
        (island_side, SIDE), (rim_band, RIM), (island_top, TOP),
        (trunk1, "#7d5a3c"), (trunk2, "#7d5a3c"), (tree1, PINE), (tree2, "#6d9169"),
        (cover_l, SAGE), (cover_r, SAGE), (page_l, PAGE_L), (page_r, PAGE_R),
    ]:
        d.polygon(tf(pts), fill=hex2rgb(col))
    d.line(tf([(258, 250), (258, 304)]), fill=hex2rgb(SAGE), width=max(1, int(4 * k * scale)))

    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    (OUT / "icon.svg").write_text(svg_markup(), encoding="utf-8")
    (OUT / "maskable.svg").write_text(svg_markup(maskable=True), encoding="utf-8")
    render(192).save(OUT / "icon-192.png", optimize=True)
    render(512).save(OUT / "icon-512.png", optimize=True)
    render(512, maskable=True).save(OUT / "maskable-512.png", optimize=True)
    render(180, rounded=False).convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)
    render(32).save(OUT / "favicon-32.png", optimize=True)
    print("icons generated in", OUT)

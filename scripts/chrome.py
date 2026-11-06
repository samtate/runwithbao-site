"""Adds an Android status bar and gesture pill to the site's app screenshots, keeping their 1080x2316 size.

The content gives up 176 rows: it's clipped just above the tab bar (as if scrolled under it), and the tab bar
moves down to sit on the gesture area."""
import sys
from PIL import Image, ImageDraw, ImageFont
FONT = "/home/smeeps/Projects/bao-run/shared/src/commonMain/composeResources/font/archivo_medium.ttf"
W, H, TOP, BOTTOM = 1080, 2316, 110, 66

def tab_bar_height(im):
    """Rows from the bottom to the tab bar's top border, or 0 if there's no tab bar."""
    px = im.load()
    for y in range(H - 120, H - 300, -1):
        row = [px[x, y] for x in range(40, W - 40, 20)]
        below = [px[x, y + 4] for x in range(40, W - 40, 20)]
        uniform = max(sum(c) for c in row) - min(sum(c) for c in row) < 12
        if uniform and abs(sum(row[0]) - sum(below[0])) > 12 and abs(sum(row[0]) - sum(px[5, y - 4])) > 12:
            return H - y
    return 0

def ink(bg):
    return (43, 33, 24) if sum(bg) > 380 else (242, 232, 216)

def chrome(path, out):
    im = Image.open(path).convert("RGB")
    t = tab_bar_height(im)
    top_bg, bottom_bg = im.getpixel((5, 5)), im.getpixel((5, H - 3))
    new = Image.new("RGB", (W, H), top_bg)
    body = H - TOP - BOTTOM - t
    new.paste(im.crop((0, 0, W, body)), (0, TOP))
    if t: new.paste(im.crop((0, H - t, W, H)), (0, TOP + body))
    d = ImageDraw.Draw(new)
    d.rectangle((0, H - BOTTOM, W, H), fill=bottom_bg)
    c = ink(top_bg)
    # Time on the left; signal, wifi and battery on the right, either side of the camera.
    d.text((66, 56), "9:30", font=ImageFont.truetype(FONT, 40), fill=c, anchor="lm")
    x = W - 66
    d.rounded_rectangle((x - 46, 40, x - 4, 72), radius=7, outline=c, width=4)
    d.rounded_rectangle((x - 4, 50, x + 2, 62), radius=2, fill=c)
    d.rounded_rectangle((x - 40, 46, x - 16, 66), radius=3, fill=c)
    x -= 72
    for i, r in enumerate((30, 21, 12)):
        d.pieslice((x - r, 74 - r, x + r, 74 + r), 225, 315, fill=c if i == 0 else None, outline=c, width=0)
    d.pieslice((x - 30, 44, x + 30, 104), 225, 315, fill=c)
    x -= 66
    d.polygon([(x, 74), (x + 34, 74), (x + 34, 40)], fill=c)
    pill = ink(bottom_bg)
    d.rounded_rectangle((W / 2 - 72, H - 38, W / 2 + 72, H - 28), radius=5, fill=pill)
    new.save(out)
    return t

for theme in ("light", "dark"):
    for name in ("today", "plan", "calendar", "rate", "progress", "rundetail", "garmin"):
        src = f"/tmp/bao-dev/screens-orig/{theme}/{name}.png"
        dst = f"/home/smeeps/Projects/runwithbao-site/src/assets/screens/{theme}/{name}.png"
        print(theme, name, "tab bar", chrome(src, dst))

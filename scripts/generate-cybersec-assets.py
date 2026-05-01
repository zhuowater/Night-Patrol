from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import math
import random

ROOT = Path(__file__).resolve().parents[1]
CYAN = (37, 224, 255, 255)
GOLD = (241, 190, 92, 255)
RED = (255, 68, 86, 255)
DARK = (4, 12, 22, 255)
PANEL = (8, 28, 46, 230)

try:
    FONT = ImageFont.truetype("/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf", 32)
    SMALL = ImageFont.truetype("/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf", 18)
except Exception:
    FONT = ImageFont.load_default()
    SMALL = ImageFont.load_default()


def ensure(path: str) -> Path:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def glow_line(draw: ImageDraw.ImageDraw, xy, color, width=3):
    draw.line(xy, fill=tuple((*color[:3], 80)), width=width + 6)
    draw.line(xy, fill=color, width=width)


def background(size=(1920, 1080), seed=1, title=None):
    random.seed(seed)
    img = Image.new("RGBA", size, DARK)
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = size
    for y in range(h):
        r = int(4 + y / h * 8)
        g = int(12 + y / h * 16)
        b = int(22 + y / h * 24)
        draw.line((0, y, w, y), fill=(r, g, b, 255))
    for x in range(0, w, 90):
        draw.line((x, 0, x, h), fill=(36, 218, 255, 20), width=1)
    for y in range(0, h, 70):
        draw.line((0, y, w, y), fill=(241, 190, 92, 16), width=1)
    for _ in range(40):
        x1 = random.randint(0, w)
        y1 = random.randint(0, h)
        x2 = min(w, max(0, x1 + random.randint(-260, 260)))
        y2 = min(h, max(0, y1 + random.randint(-140, 140)))
        glow_line(draw, (x1, y1, x2, y2), random.choice([CYAN, GOLD, RED]), width=random.choice([1, 2]))
    # SOC panels
    for i in range(6):
        x = 90 + i * 295
        y = 90 + (i % 2) * 70
        draw.rounded_rectangle((x, y, x + 230, y + 120), radius=16, fill=PANEL, outline=(37, 224, 255, 90), width=2)
        for k in range(6):
            yy = y + 22 + k * 15
            draw.rectangle((x + 18, yy, x + 18 + random.randint(80, 180), yy + 4), fill=random.choice([CYAN, GOLD, RED]))
    # server racks
    for i in range(11):
        x = 80 + i * 165
        draw.rounded_rectangle((x, h - 330, x + 110, h - 80), radius=10, fill=(3, 16, 28, 220), outline=(37, 224, 255, 55))
        for k in range(9):
            yy = h - 305 + k * 24
            draw.rectangle((x + 14, yy, x + 96, yy + 10), fill=(10, 42, 62, 255), outline=(37, 224, 255, 40))
            draw.ellipse((x + 20, yy + 3, x + 26, yy + 9), fill=random.choice([CYAN, GOLD, RED]))
    if title:
        draw.text((90, 70), title, fill=(230, 248, 255, 255), font=FONT)
    return img


def transparent_canvas(size=(720, 960)):
    return Image.new("RGBA", size, (0, 0, 0, 0))


def character(path: str):
    img = transparent_canvas()
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    # glow silhouette
    draw.ellipse((170, 80, 550, 900), fill=(37, 224, 255, 26))
    draw.ellipse((290, 90, 430, 230), fill=(210, 235, 245, 255), outline=CYAN, width=5)
    draw.rounded_rectangle((240, 225, 480, 700), radius=70, fill=(12, 35, 54, 250), outline=CYAN, width=5)
    draw.polygon([(235, 380), (80, 780), (310, 700)], fill=(6, 25, 42, 230), outline=GOLD)
    draw.polygon([(485, 380), (640, 780), (410, 700)], fill=(6, 25, 42, 230), outline=GOLD)
    # holo terminal
    draw.rounded_rectangle((420, 360, 650, 500), radius=18, fill=(37, 224, 255, 35), outline=CYAN, width=4)
    for y in range(385, 485, 22):
        draw.line((445, y, 620, y), fill=(37, 224, 255, 180), width=3)
    # circuit robe lines
    for x in [290, 340, 380, 430]:
        glow_line(draw, (x, 255, x + random.randint(-60, 60), 690), GOLD, 2)
    draw.text((150, 820), "SOC", fill=(37, 224, 255, 210), font=FONT)
    img.save(ensure(path))


def enemy(path: str, seed: int, label: str, boss=False):
    random.seed(seed)
    img = transparent_canvas((860, 860) if boss else (720, 720))
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    center = (w // 2, h // 2)
    radius = 250 if boss else 180
    draw.ellipse((center[0]-radius-50, center[1]-radius-50, center[0]+radius+50, center[1]+radius+50), fill=(255, 68, 86, 28))
    points=[]
    n=12 if boss else 9
    for i in range(n):
        ang=i/n*math.tau
        r=radius*random.uniform(0.65,1.15)
        points.append((center[0]+math.cos(ang)*r, center[1]+math.sin(ang)*r))
    draw.polygon(points, fill=(11, 28, 45, 235), outline=RED)
    for p in points:
        glow_line(draw, (center[0], center[1], p[0], p[1]), random.choice([CYAN, GOLD, RED]), 3 if boss else 2)
        draw.ellipse((p[0]-16, p[1]-16, p[0]+16, p[1]+16), fill=random.choice([CYAN, GOLD, RED]))
    for i in range(6 if boss else 4):
        rr=radius*(0.25+i*0.11)
        draw.ellipse((center[0]-rr, center[1]-rr, center[0]+rr, center[1]+rr), outline=(37,224,255,80), width=2)
    # core eye/lock
    draw.rounded_rectangle((center[0]-90, center[1]-55, center[0]+90, center[1]+55), radius=20, fill=(255,68,86,190), outline=GOLD, width=4)
    draw.text((center[0]-70, center[1]-20), label[:8], fill=(255,245,220,255), font=SMALL)
    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=130, threshold=3))
    img.save(ensure(path))


def poster(path: str, seed: int, label: str, boss=False):
    img = background((1920, 1080), seed, "INCIDENT CONTAINED" if not boss else "DOMAIN CONTROL RESTORED")
    draw = ImageDraw.Draw(img, "RGBA")
    w,h=img.size
    draw.rounded_rectangle((210, 730, 1710, 965), radius=34, fill=(4, 12, 22, 205), outline=(37,224,255,120), width=3)
    draw.text((270, 770), label, fill=(245, 250, 255, 255), font=FONT)
    draw.text((270, 835), "logs collapse into IOC sparks / response window secured", fill=(37,224,255,220), font=SMALL)
    for i in range(80):
        x=random.randint(220,1700); y=random.randint(180,700)
        draw.ellipse((x,y,x+random.randint(3,10),y+random.randint(3,10)), fill=random.choice([CYAN,GOLD,RED]))
    img.save(ensure(path))


def icon(path: str, size=512):
    img=Image.new('RGBA',(size,size),(3,10,20,255))
    draw=ImageDraw.Draw(img,'RGBA')
    draw.rounded_rectangle((18,18,size-18,size-18), radius=90, fill=(5,20,34,255), outline=CYAN, width=10)
    shield=[(size/2,70),(size-115,135),(size-145,size-105),(size/2,size-48),(145,size-105),(115,135)]
    draw.polygon(shield, fill=(11,44,62,255), outline=GOLD)
    draw.ellipse((size/2-95,size/2-65,size/2+95,size/2+65), outline=CYAN, width=16)
    draw.ellipse((size/2-36,size/2-36,size/2+36,size/2+36), fill=RED, outline=(255,245,220,255), width=6)
    for ang in range(0,360,45):
        x=size/2+math.cos(math.radians(ang))*145
        y=size/2+math.sin(math.radians(ang))*145
        glow_line(draw,(size/2,size/2,x,y),CYAN,4)
    img.save(ensure(path))


if __name__ == '__main__':
    background(seed=9, title='NIGHT PATROL SOC').save(ensure('assets/generated/backgrounds/night-temple-battle.png'))
    character('assets/generated/characters/player-night-patrol.png')
    enemies=[
        ('lantern','PORT SCAN'),('waterghost','PHISH'),('templecorpse','ZOMBIE'),('macaque','LATERAL'),('warlock','C2'),('foxshade','TOKEN'),('tigerlord','RANSOM')]
    for i,(key,label) in enumerate(enemies,1):
        enemy(f'assets/generated/enemies/{key}.png', i*13, label, boss=key=='tigerlord')
        slug = 'boss-tigerlord' if key=='tigerlord' else key
        poster(f'assets/generated/cinematics/victory-{slug}-poster.png', i*17, label, boss=key=='tigerlord')
    icon('assets/marketing/icon.png',512)
    icon('public/favicon.png',256)
    print('generated cybersec P0 assets')

#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
GEN = Path('/root/.hermes/skills/media/gpt-image2-image-gen/scripts/gpt_image2_generate.py')
PROMPTS = ROOT / 'docs/gpt-image2-asset-prompts.json'
TMP = ROOT / '.tmp/gpt-image2-assets'

POSTERS = {
    'assets/generated/cinematics/victory-lantern-poster.png': ('lantern', '噪声告警蜂群被压制，SOC 控制台恢复清晰，误报风暴散去。'),
    'assets/generated/cinematics/victory-waterghost-poster.png': ('waterghost', '钓鱼凭据回传被阻断，凭据气泡在边界网关前破碎。'),
    'assets/generated/cinematics/victory-templecorpse-poster.png': ('templecorpse', '遗留服务僵尸被隔离，陈旧端口关闭，补丁光束穿过服务器机柜。'),
    'assets/generated/cinematics/victory-macaque-poster.png': ('macaque', '横向移动脚本被切断，网络节点之间的红色跳板链路熄灭。'),
    'assets/generated/cinematics/victory-warlock-poster.png': ('warlock', 'C2 编排者失去控制，命令线程断裂，botnet 拓扑崩解。'),
    'assets/generated/cinematics/victory-foxshade-poster.png': ('foxshade', '伪装进程被揭露，进程树中红色恶意核心暴露并被封存。'),
    'assets/generated/cinematics/victory-boss-tigerlord-poster.png': ('tigerlord', '勒索核心被阻断，域控上方的加密锁链崩碎，天亮前核心资产恢复控制。'),
}


def verify_png(path: Path) -> tuple[int, int, int]:
    if not path.exists() or path.stat().st_size < 10_000:
        raise RuntimeError(f'invalid or too small: {path}')
    if path.read_bytes()[:8] != b'\x89PNG\r\n\x1a\n':
        raise RuntimeError(f'not png: {path}')
    with Image.open(path) as im:
        im.verify()
    with Image.open(path) as im:
        return im.size[0], im.size[1], path.stat().st_size


def resize_cover(src: Path, dst: Path, size: tuple[int, int]) -> None:
    with Image.open(src).convert('RGBA') as im:
        target_w, target_h = size
        scale = max(target_w / im.width, target_h / im.height)
        resized = im.resize((round(im.width * scale), round(im.height * scale)), Image.Resampling.LANCZOS)
        left = (resized.width - target_w) // 2
        top = (resized.height - target_h) // 2
        out = resized.crop((left, top, left + target_w, top + target_h))
        dst.parent.mkdir(parents=True, exist_ok=True)
        out.save(dst, optimize=True)


def run_generate(item: dict) -> Path:
    TMP.mkdir(parents=True, exist_ok=True)
    out = TMP / f"{item['id']}.png"
    if out.exists() and out.stat().st_size > 100_000:
        return out
    cmd = [sys.executable, str(GEN), '--prompt', item['prompt'], '--output', str(out), '--size', item['size'], '--quality', 'high', '--timeout', '360']
    subprocess.run(cmd, cwd=str(ROOT), check=True)
    verify_png(out)
    return out


def build_poster_prompt(base_prompt: str, event: str, desc: str) -> str:
    return (
        'Task type: cinematic victory poster / game key art. Objective: polished 16:9 victory still for 夜巡 SOC：边界告警. '
        'Format: landscape, single finished cinematic image, no UI, no readable text. '
        f'Scene result: {desc} '
        'Composition: SOC responder silhouette on the left foreground, defeated threat visual on the right or center background, boundary gateway glow, clean space for future UI overlays. '
        'Style: premium 2D game key art, cyber-noir Eastern night-patrol atmosphere, teal/cyan security light, crimson threat residue, amber dawn edge light, painterly cinematic detail. '
        'Constraints: no subtitles, no random text, no logos, no watermark, no card frame, no mockup. '
        f'Enemy visual consistency reference description: {base_prompt}'
    )


def main() -> int:
    items = json.loads(PROMPTS.read_text())
    generated = {}
    for item in items:
        print(f"GENERATE {item['id']} -> {item['target']}", flush=True)
        raw = run_generate(item)
        target = ROOT / item['target']
        resize_cover(raw, target, tuple(item['final_size']))
        generated[item['id']] = item
        if item.get('copy_to'):
            resize_cover(raw, ROOT / item['copy_to'], tuple(item['copy_size']))
        print('OK', item['target'], verify_png(target), flush=True)

    for target, (enemy_id, desc) in POSTERS.items():
        enemy_item = generated[enemy_id]
        poster_item = {
            'id': f'poster-{enemy_id}',
            'target': target,
            'size': '1536x1024',
            'final_size': [1920, 1080],
            'prompt': build_poster_prompt(enemy_item['prompt'], enemy_id, desc),
        }
        print(f"GENERATE {poster_item['id']} -> {target}", flush=True)
        raw = run_generate(poster_item)
        resize_cover(raw, ROOT / target, (1920, 1080))
        print('OK', target, verify_png(ROOT / target), flush=True)

    print('DONE')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())

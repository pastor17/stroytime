#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""为「童心灯塔」批量生成高音质朗读音频（微软晓晓 · 神经语音）。

为什么用这个：浏览器自带的系统语音（Web Speech API）音色因设备而异、
往往偏机械；微软晓晓（zh-CN-XiaoxiaoNeural）是免费可用的中文神经语音，
音色温柔自然，适合儿童故事。生成后的 MP3 由站点播放器自动识别为
“高音质音源”，加载失败时自动回退到系统语音兜底。

用法：
  1) 安装依赖：  pip install edge-tts
  2) 生成全部故事：  python3 scripts/gen_audio.py
     只生成指定几篇： python3 scripts/gen_audio.py little-sapling moon-boat

输出目录：static/audio/<slug>.mp3（与播放器 data-audio 自动对接）
"""

import os
import re
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORIES = os.path.join(ROOT, "content", "stories")
OUT = os.path.join(ROOT, "static", "audio")

VOICE = "zh-CN-XiaoxiaoNeural"  # 晓晓：温柔女声
RATE = "-5%"                    # 略慢，更舒缓


def extract_text(md_path):
    """从 markdown 提取可朗读正文（去 front matter 与符号）。"""
    with open(md_path, encoding="utf-8") as f:
        s = f.read()
    s = re.sub(r"^---.*?---\s*", "", s, flags=re.S)          # front matter
    s = re.sub(r"^#{1,6}\s*", "", s, flags=re.M)              # 标题符号
    s = re.sub(r"[`*_\[\]()]", "", s)                          # 行内符号
    s = re.sub(r"^\s*[0-9]+\.\s*", "", s, flags=re.M)          # 思考题编号
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def generate(slug):
    md_path = os.path.join(STORIES, slug + ".md")
    if not os.path.exists(md_path):
        print("跳过（文件不存在）:", slug)
        return
    text = extract_text(md_path)
    if len(text) < 100:
        print("跳过（正文过短）:", slug)
        return
    os.makedirs(OUT, exist_ok=True)
    out_path = os.path.join(OUT, slug + ".mp3")

    with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
        f.write(text)
        tmp = f.name
    try:
        subprocess.run(
            ["edge-tts", "--voice", VOICE, "--rate", RATE,
             "--file", tmp, "--write-media", out_path],
            check=True,
        )
        print("已生成:", out_path, "（正文 %d 字）" % len(text))
    finally:
        os.unlink(tmp)


def main():
    args = sys.argv[1:]
    if args:
        slugs = args
    else:
        slugs = sorted(
            re.sub(r"\.md$", "", f)
            for f in os.listdir(STORIES)
            if f.endswith(".md") and not f.startswith("_")
        )
    for slug in slugs:
        generate(slug)


if __name__ == "__main__":
    main()

---
name: "monochrome-cinematic"
version: "1.0.0"
theme: "strictly-black-and-white"
---

# Frame Design Specification

## Palette Tokens
- `--bg-canvas`: `#000000` (Pure pitch black)
- `--bg-desktop`: `#080808` (Obsidian workstation surface)
- `--bg-window`: `#0e0e0e` (Deep charcoal application background)
- `--bg-panel`: `#151515` (Elevated card/drawer surfaces)
- `--bg-inset`: `#090909` (Recessed inputs and code containers)
- `--border-subtle`: `#1f1f1f`
- `--border-prominent`: `#333333`
- `--border-highlight`: `#ffffff`
- `--text-primary`: `#ffffff`
- `--text-secondary`: `#cccccc`
- `--text-muted`: `#777777`
- `--text-dim`: `#444444`
- `--badge-bg`: `#202020`
- `--badge-text`: `#f0f0f0`
- `--meter-fill`: `#ffffff`

## Typography
- Display: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
- Monospace: "JetBrains Mono", "SF Mono", Consolas, monospace
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

## Visual Architecture
- 16:9 Aspect Ratio: 1920x1080 resolution
- macOS-style Browser Chrome: Close, Minimize, Maximize indicators, SSL lock, URL bar
- Staggered GSAP timelines for seekable deterministic frame rendering

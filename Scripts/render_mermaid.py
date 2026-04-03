"""
Render all Mermaid .mmd files in a directory to WebP (via PNG intermediate).

Pipeline: .mmd -> mmdc -> .png -> Pillow -> .webp (lossless)

Usage:
    python scripts/render_mermaid.py posts/<slug>/images/
    python scripts/render_mermaid.py posts/<slug>/images/ --format png     # keep PNG instead
    python scripts/render_mermaid.py posts/<slug>/images/ --theme forest
    python scripts/render_mermaid.py posts/<slug>/images/ --width 1000

Requirements:
    npm install -g @mermaid-js/mermaid-cli
    pip install Pillow
"""

import sys
import subprocess
import json
import shutil
import tempfile
from pathlib import Path

from PIL import Image


# Default Mermaid config for clean, blog-friendly diagrams
# Palette: Mermaid default lavender with modern Inter font
DEFAULT_CONFIG = {
    "theme": "base",
    "themeCSS": "text.flowchartTitleText { font-size: 28px !important; font-weight: 600 !important; } svg > text { font-size: 24px !important; font-weight: 600 !important; }",
    "themeVariables": {
        "fontFamily": "Inter, Segoe UI, system-ui, -apple-system, sans-serif",
        "fontSize": "16px",
        "primaryColor": "#ECECFF",
        "primaryTextColor": "#333333",
        "primaryBorderColor": "#9370DB",
        "secondaryColor": "#ffffde",
        "secondaryTextColor": "#333333",
        "tertiaryColor": "#f4f4f4",
        "lineColor": "#9370DB",
        "textColor": "#333333",
        "mainBkg": "#ECECFF",
        "nodeBorder": "#9370DB",
        "clusterBkg": "#F5F5F5",
        "clusterBorder": "#CCCCCC",
        "edgeLabelBackground": "#ffffff",
        "noteBkgColor": "#ffffde",
        "noteTextColor": "#333333",
        "noteBorderColor": "#9370DB",
    },
    "flowchart": {
        "htmlLabels": True,
        "curve": "basis",
        "padding": 15,
        "nodeSpacing": 70,
        "rankSpacing": 80,
    },
    "sequence": {
        "mirrorActors": False,
        "messageAlign": "center",
    },
}


def find_mmdc() -> str:
    """Find the mmdc executable (works on Windows, macOS, Linux)."""
    found = shutil.which("mmdc") or shutil.which("mmdc.cmd")
    if found:
        return found
    raise FileNotFoundError(
        "mmdc not found. Install with: npm install -g @mermaid-js/mermaid-cli"
    )


def png_to_webp(png_path: Path, webp_path: Path | None = None, quality: int = 90) -> Path:
    """Convert a PNG file to lossless WebP using Pillow.

    Args:
        png_path: Path to input PNG
        webp_path: Path to output WebP (default: same name, .webp extension)
        quality: Quality for lossy fallback (not used in lossless mode)

    Returns:
        Path to the WebP file.
    """
    png_path = Path(png_path)
    if webp_path is None:
        webp_path = png_path.with_suffix(".webp")
    webp_path = Path(webp_path)

    img = Image.open(png_path)
    img.save(webp_path, "WEBP", lossless=True)
    return webp_path


def render_mmd(
    mmd_path: Path,
    output_format: str = "webp",
    width: int = 1100,
    height: int = 800,
    scale: int = 2,
    config: dict | None = None,
    background: str = "white",
    output_dir: Path | None = None,
) -> Path | None:
    """Render a single .mmd file to WebP (default) or PNG.

    Pipeline: .mmd -> mmdc -> .png [-> Pillow -> .webp]

    Args:
        mmd_path: Path to .mmd file
        output_format: "webp" (default) or "png"
        width: Width in pixels
        height: Height in pixels (max -- actual height fits content)
        scale: Scale factor (2 = retina-quality)
        config: Mermaid config dict (default: DEFAULT_CONFIG)
        background: Background color
        output_dir: Directory for rendered output (default: same as .mmd file)

    Returns:
        Path to the rendered file, or None on failure.
    """
    mmd_path = Path(mmd_path)
    if not mmd_path.exists():
        raise FileNotFoundError(f"Mermaid file not found: {mmd_path}")

    # Determine output paths
    if output_dir:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        png_path = output_dir / mmd_path.with_suffix(".png").name
    else:
        png_path = mmd_path.with_suffix(".png")

    mmdc = find_mmdc()
    cfg = config or DEFAULT_CONFIG

    # Write config to a temp file
    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".json", delete=False, dir=mmd_path.parent
    ) as f:
        json.dump(cfg, f)
        config_path = Path(f.name)

    try:
        cmd = [
            mmdc,
            "-i", str(mmd_path),
            "-o", str(png_path),
            "-c", str(config_path),
            "-w", str(width),
            "-H", str(height),
            "-s", str(scale),
            "-b", background,
            "--quiet",
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode != 0:
            print(f"  ERROR rendering {mmd_path.name}: {result.stderr.strip()}")
            return None
    finally:
        config_path.unlink(missing_ok=True)

    if not png_path.exists():
        return None

    # If PNG requested, we're done
    if output_format == "png":
        return png_path

    # Add white margin for breathing room
    margin = 40
    img = Image.open(png_path)
    padded = Image.new("RGB", (img.width + 2 * margin, img.height + 2 * margin), "white")
    padded.paste(img, (margin, margin))
    padded.save(png_path)

    # Determine webp output path
    if output_dir:
        webp_path = output_dir / mmd_path.with_suffix(".webp").name
    else:
        webp_path = mmd_path.with_suffix(".webp")

    # Convert PNG -> WebP (lossless)
    png_to_webp(png_path, webp_path)

    # Remove the intermediate PNG
    png_path.unlink(missing_ok=True)

    return webp_path


def render_directory(
    directory: str | Path,
    output_format: str = "webp",
    width: int = 1100,
    height: int = 800,
    scale: int = 2,
    config: dict | None = None,
    output_dir: str | Path | None = None,
) -> list[Path]:
    """Render all .mmd files in a directory.

    Args:
        directory: Path to directory containing .mmd files
        output_format: "webp" (default) or "png"
        width: Width in pixels
        height: Height in pixels
        scale: Scale factor
        config: Mermaid config dict
        output_dir: Directory for rendered output (default: same as input)

    Returns:
        List of rendered output file paths.
    """
    directory = Path(directory)
    if not directory.is_dir():
        print(f"ERROR: Not a directory: {directory}")
        sys.exit(1)

    out_dir = Path(output_dir) if output_dir else None

    mmd_files = sorted(directory.glob("*.mmd"))
    if not mmd_files:
        print(f"No .mmd files found in {directory}")
        return []

    ext = output_format.upper()
    print(f"Found {len(mmd_files)} Mermaid file(s) in {directory}")
    if out_dir:
        print(f"Output directory: {out_dir}")
    print(f"Output format: {ext} {'(lossless)' if ext == 'WEBP' else ''}")
    print("=" * 50)

    rendered = []
    for mmd_file in mmd_files:
        out_name = mmd_file.with_suffix(f".{output_format}").name
        print(f"  {mmd_file.name} -> {out_name} ... ", end="")
        result = render_mmd(mmd_file, output_format, width, height, scale, config, output_dir=out_dir)
        if result and result.exists():
            size_kb = result.stat().st_size / 1024
            print(f"OK ({size_kb:.0f} KB)")
            rendered.append(result)
        else:
            print("FAILED")

    print("=" * 50)
    print(f"Rendered: {len(rendered)}/{len(mmd_files)} files")
    return rendered


def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Render Mermaid .mmd files to WebP (default) or PNG"
    )
    parser.add_argument("directory", help="Directory containing .mmd files")
    parser.add_argument(
        "--format", choices=["webp", "png"], default="webp",
        help="Output format (default: webp)"
    )
    parser.add_argument("--width", type=int, default=1100, help="Width in px (default: 1100)")
    parser.add_argument("--height", type=int, default=800, help="Max height in px (default: 800)")
    parser.add_argument("--scale", type=int, default=2, help="Scale factor (default: 2 = retina)")
    parser.add_argument(
        "--theme", default=None,
        help="Mermaid theme override (default, forest, dark, neutral)"
    )
    parser.add_argument(
        "--output", default=None,
        help="Output directory for rendered files (default: same as input directory)"
    )
    args = parser.parse_args()

    config = dict(DEFAULT_CONFIG)
    if args.theme:
        config["theme"] = args.theme

    render_directory(args.directory, args.format, args.width, args.height, args.scale, config, args.output)


if __name__ == "__main__":
    main()

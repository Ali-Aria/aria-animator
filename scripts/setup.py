"""Initialize shared settings and install project-local LXGW WenKai fonts."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sys
import urllib.request

from shared_config import config_path, initialize, public_status, save_workspace, shared_override, shared_root, workspace_root, SKILL_ROOT

FONT_TAG = "v1.522"
FONT_BASE = f"https://github.com/lxgw/LxgwWenKai/releases/download/{FONT_TAG}"
FONT_FILES = {
    "LXGWWenKai-Regular.ttf": "39ad71264b588165b469e35e6afb162a378dacd1f95348160240ba9038ac3009",
    "LXGWWenKai-Medium.ttf": "d4bdeb38a39151d74d084cba5090f8cb7d20bf83eedb78c35939ae70b9f4e3f6",
}
LICENSE_URL = f"https://raw.githubusercontent.com/lxgw/LxgwWenKai/{FONT_TAG}/OFL.txt"


def download(url):
    request = urllib.request.Request(url, headers={"User-Agent": "aria-animator-setup"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def install_fonts(root):
    folder = root / "fonts/LxgwWenKai"
    folder.mkdir(parents=True, exist_ok=True)
    for name, expected in FONT_FILES.items():
        path = folder / name
        if path.exists():
            if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
                raise ValueError(f"现有字体校验不符，已保留原文件，请检查：{path}")
            continue
        data = download(f"{FONT_BASE}/{name}")
        if hashlib.sha256(data).hexdigest() != expected:
            raise ValueError(f"下载的 {name} 校验失败，未安装。")
        with path.open("xb") as handle:
            handle.write(data)
    license_path = folder / "OFL.txt"
    if not license_path.exists():
        license_data = download(LICENSE_URL)
        if b"SIL OPEN FONT LICENSE" not in license_data:
            raise ValueError("字体许可证下载异常。")
        with license_path.open("xb") as handle:
            handle.write(license_data)
    metadata = {"repository": "https://github.com/lxgw/LxgwWenKai", "release": FONT_TAG,
                "files": FONT_FILES, "license": "OFL-1.1", "installation": "shared library; load locally in each project"}
    (folder / "source.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    return folder


def copy_fonts_to_project(root, project):
    folder = root / "fonts/LxgwWenKai"
    # Check the complete installation before writing any project files.
    for name, digest in FONT_FILES.items():
        p = folder / name
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != digest:
            raise ValueError("共享字体未安装或校验失败，请先运行 setup.py --install-fonts。")
    if not (folder / "OFL.txt").is_file():
        raise ValueError("缺少字体许可证，请重新运行 setup.py --install-fonts。")
    pairs = [(folder / n, project / "public/fonts/LxgwWenKai" / n) for n in (*FONT_FILES, "OFL.txt", "source.json")]
    pairs.append((SKILL_ROOT / "assets/LxgwFont.tsx", project / "src/LxgwFont.tsx"))
    for src, dst in pairs:
        if dst.exists() and dst.read_bytes() != src.read_bytes():
            raise ValueError(f"项目已有不同内容，已保留原文件：{dst}")
    for src, dst in pairs:
        dst.parent.mkdir(parents=True, exist_ok=True)
        if not dst.exists():
            shutil.copy2(src, dst)
    return str(project / "public/fonts/LxgwWenKai")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--workspace-root", type=Path, help="Remember the chosen video save directory; shared library lives in _shared")
    parser.add_argument("--shared-root", type=Path)
    parser.add_argument("--install-fonts", action="store_true")
    parser.add_argument("--project", type=Path, help="Copy installed fonts and loader into this project")
    args = parser.parse_args()
    if args.workspace_root:
        workspace = args.workspace_root.expanduser().resolve()
        root = workspace / "_shared"
        if args.shared_root:
            raise ValueError("--workspace-root 与 --shared-root 不能同时使用。")
        override = shared_override()
        if override and Path(override).expanduser().resolve() != root:
            raise ValueError("共享库环境变量（ARIA_ANIMATOR_SHARED 或旧版 MOTION_EXPLAINER_SHARED）与所选目录的 _shared 不一致，请先调整或清除该环境变量。")
    else:
        root = shared_root(args.shared_root)
        if not (args.shared_root or shared_override() or workspace_root() or config_path(root).is_file()):
            raise ValueError("请先选择成品保存目录，再运行 setup.py --workspace-root \"<用户选择的目录>\" --install-fonts；共享库将保存在该目录的 _shared 中。")
    created = initialize(root)
    if args.workspace_root:
        save_workspace(workspace)
    status = public_status(root)
    status["created_empty_tts_config"] = created
    status["purpose"] = {"skill": "制作规则、脚本和可复用镜头", "shared_library": "跨项目保存个人配音配置、发音规则和字体；更新 Skill 时保留"}
    # Print paths even when a subsequent font download fails.
    print(json.dumps(status, ensure_ascii=False, indent=2), flush=True)
    if args.install_fonts:
        print(json.dumps({"font_installed_at": str(install_fonts(root)), "release": FONT_TAG}, ensure_ascii=False))
    if args.project:
        print(json.dumps({"project_fonts": copy_fonts_to_project(root, args.project.expanduser().resolve()),
                          "next_step": "在 composition 根部使用 src/LxgwFont.tsx 的 LxgwFont 包裹内容。"}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"初始化失败：{exc}", file=sys.stderr)
        sys.exit(1)

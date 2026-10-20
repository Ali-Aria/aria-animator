"""Portable local settings for the distribution skill (Python 3.10+)."""
from __future__ import annotations

import json
import os
from pathlib import Path
import tempfile

SKILL_ROOT = Path(__file__).resolve().parents[1]
MODEL = "doubao-seed-tts-2-0"
RESOURCE = "seed-tts-2.0"
ENDPOINT = "https://openspeech.bytedance.com/api/v3/tts/unidirectional/sse"
KEY_URL = "https://console.volcengine.com/speech/new/setting/apikeys?projectName=default"
VOICE_URL = "https://www.volcengine.com/docs/6561/1257544"


def locations_path():
    current = Path.home() / ".aria-animator" / "locations.json"
    legacy = Path.home() / ".motion-explainer-studio" / "locations.json"
    return legacy if not current.exists() and legacy.exists() else current


def shared_override():
    return os.environ.get("ARIA_ANIMATOR_SHARED") or os.environ.get("MOTION_EXPLAINER_SHARED")


def workspace_root():
    path = locations_path()
    if not path.exists():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
        value = data.get("workspace_root") if isinstance(data, dict) else None
        if not isinstance(value, str) or not value.strip() or not Path(value).is_absolute():
            raise ValueError
    except (ValueError, UnicodeError):
        raise ValueError(f"保存目录记录无效，请检查：{path}") from None
    return Path(value).resolve()


def save_workspace(root):
    path = locations_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    # Write only a directory pointer here; credentials stay in the chosen shared library.
    with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                     prefix="locations-", suffix=".tmp", delete=False) as handle:
        temporary = Path(handle.name)
        json.dump({"workspace_root": str(root.expanduser().resolve())}, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    try:
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def shared_root(explicit=None):
    value = explicit or shared_override()
    if value:
        return Path(value).expanduser().resolve()
    workspace = workspace_root()
    if workspace:
        return workspace / "_shared"
    current = Path.home() / ".aria-animator" / "shared"
    legacy = Path.home() / ".motion-explainer-studio" / "shared"
    return legacy if not config_path(current).is_file() and config_path(legacy).is_file() else current


def config_path(root):
    return root / "config" / "tts.json"


def write_new_json(path, value, private=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive create: rerunning initialization must never reset a user's key.
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600 if private else 0o644)
    except FileExistsError:
        return False
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    return True


def initialize(root):
    for folder in ("config", "fonts", "tts", "cache"):
        (root / folder).mkdir(parents=True, exist_ok=True)
    template = json.loads((SKILL_ROOT / "assets/tts-config.example.json").read_text(encoding="utf-8"))
    created = write_new_json(config_path(root), template, private=True)
    write_new_json(root / "tts/pronunciations.json", {"replacements": {}})
    ignore = root / ".gitignore"
    if not ignore.exists():
        with ignore.open("x", encoding="utf-8") as handle:
            handle.write("*\n!.gitignore\n")
    return created


def load_config(root, require_credentials=True):
    path = config_path(root)
    if not path.is_file():
        raise ValueError(f"请先运行 setup.py，配置文件应位于：{path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8-sig"))
    except (ValueError, UnicodeError):
        raise ValueError(f"配置不是有效的 UTF-8 JSON，请检查：{path}") from None
    if not isinstance(data, dict) or data.get("model") != MODEL:
        raise ValueError(f"model 必须为 {MODEL}。")
    for field in ("api_key", "voice_id"):
        if not isinstance(data.get(field), str):
            raise ValueError(f"{field} 必须是字符串。")
        data[field] = data[field].strip()
        if require_credentials and not data[field]:
            raise ValueError(f"请在 {path} 填写 {field}。Key：{KEY_URL}；音色：{VOICE_URL}")
    if any(c in data["api_key"] for c in "\r\n"):
        raise ValueError("api_key 含换行，请重新填写。")
    if data["voice_id"].startswith("S_"):
        raise ValueError("本入口固定使用语音合成 2.0 公版音色，请从对应音色列表选择，不能填写复刻资源音色。")
    if type(data.get("sample_rate")) is not int or data["sample_rate"] not in (8000, 16000, 22050, 24000, 32000, 44100, 48000):
        raise ValueError("sample_rate 不是受支持的采样率。")
    for field in ("speech_rate", "loudness_rate"):
        if type(data.get(field)) is not int or not -50 <= data[field] <= 100:
            raise ValueError(f"{field} 必须是 -50 到 100 的整数。")
    return data


def public_status(root):
    root = root.expanduser().resolve()
    data = load_config(root, require_credentials=False)
    workspace = workspace_root()
    return {
        "skill_path": str(SKILL_ROOT), "shared_library_path": str(root),
        "workspace_root": str(workspace) if workspace and root == (workspace / "_shared").resolve() else None,
        "locations_config_path": str(locations_path()),
        "tts_config_path": str(config_path(root)), "font_path": str(root / "fonts/LxgwWenKai"),
        "model": MODEL, "voice_id_configured": bool(data["voice_id"]),
        "api_key_configured": bool(data["api_key"]),
        "tts_fields_complete": bool(data["voice_id"] and data["api_key"]),
        "credentials_verified_online": False,
        "api_key_url": KEY_URL, "voice_list_url": VOICE_URL,
    }

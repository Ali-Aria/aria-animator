"""Standalone Doubao Seed TTS 2.0 client; Python standard library only."""
from __future__ import annotations

import argparse
import base64
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request
import uuid
import wave

from shared_config import ENDPOINT, MODEL, RESOURCE, config_path, load_config, shared_root


def prepare_text(text, rules_path):
    text = text.strip()
    if not text:
        raise ValueError("配音文本为空。")
    if re.search(r"</?(?:cot|speak)\b", text, re.I):
        raise ValueError("此入口使用纯口播正文，请移除 Cot 或 SSML 标签。")
    if not rules_path.is_file():
        raise ValueError("共享发音规则文件不存在，请运行 setup.py。")
    rules = json.loads(rules_path.read_text(encoding="utf-8-sig")).get("replacements")
    if not isinstance(rules, dict) or any(not isinstance(k, str) or not k or not isinstance(v, str) or not v for k, v in rules.items()):
        raise ValueError("发音规则需要非空字符串到非空字符串的 replacements 映射。")
    if rules:
        pattern = "|".join(re.escape(k) for k in sorted(rules, key=len, reverse=True))
        return re.sub(pattern, lambda match: rules[match.group()], text)
    return text


def build_request(text, settings):
    payload = {"user": {"uid": "remotion-explainer"}, "req_params": {
        "text": text, "speaker": settings["voice_id"],
        "audio_params": {"format": "pcm", "sample_rate": settings["sample_rate"],
                         "speech_rate": settings["speech_rate"], "loudness_rate": settings["loudness_rate"],
                         "enable_subtitle": True}}}
    return urllib.request.Request(ENDPOINT, data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "text/event-stream",
                 "X-Api-Key": settings["api_key"], "X-Api-Resource-Id": RESOURCE,
                 "X-Api-Request-Id": str(uuid.uuid4())}, method="POST")


def stream_messages(response):
    pending = []
    for raw in response:
        line = raw.decode("utf-8").rstrip("\r\n")
        if not line:
            if pending:
                yield json.loads("\n".join(pending))
                pending = []
        elif line.startswith("data:"):
            pending.append(line[5:].lstrip())
    if pending:
        yield json.loads("\n".join(pending))


def decode_audio(response):
    audio = bytearray()
    events = []
    finished = False
    for item in stream_messages(response):
        if not isinstance(item, dict):
            raise ValueError("语音接口返回了无效事件。")
        code = item.get("code", 0)
        if code not in (0, 20000000):
            # Do not echo provider bodies; they may contain submitted text or credentials.
            raise ValueError(f"豆包合成失败，服务状态码：{code}。请检查音色、权限和文本长度。")
        if item.get("data"):
            audio.extend(base64.b64decode(item["data"], validate=True))
        metadata = {k: v for k, v in item.items() if k != "data"}
        if metadata:
            events.append(metadata)
        if code == 20000000:
            finished = True
            break
    if not finished:
        raise ValueError("语音流没有完成标记；未保存不完整音频，请检查网络后手动重试。")
    if not audio or len(audio) % 2:
        raise ValueError("语音流没有返回完整的 16 位 PCM 数据。")
    return bytes(audio), events


def wav_bytes(pcm, sample_rate):
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(sample_rate)
        wav.writeframes(pcm)
    return buffer.getvalue()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError("语音接口发生重定向，已停止请求。")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--shared-root", type=Path)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = shared_root(args.shared_root)
    settings = load_config(root)
    original = args.input.read_text(encoding="utf-8-sig").strip()
    speech = prepare_text(original, root / "tts/pronunciations.json")
    output = args.output.expanduser().resolve()
    if output.suffix.lower() != ".wav":
        raise ValueError("输出必须使用 .wav 扩展名。")
    record = output.with_suffix(".json")
    spoken = output.with_suffix(".tts.txt")
    transcript = output.with_suffix(".txt")
    paths = (output, record, spoken, transcript)
    if any(p.exists() for p in paths):
        raise ValueError("输出或同名记录已存在，请使用新的文件名。")
    safe_settings = {k: settings[k] for k in ("model", "voice_id", "sample_rate", "speech_rate", "loudness_rate")}
    summary = {"config_path": str(config_path(root)), "output": str(output), **safe_settings,
               "api_key_configured": True, "input_characters": len(speech), "dry_run": args.dry_run}
    if args.dry_run:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return
    request = build_request(speech, settings)
    try:
        with urllib.request.build_opener(NoRedirect()).open(request, timeout=120) as response:
            pcm, events = decode_audio(response)
            logid = response.headers.get("X-Tt-Logid", "")
    except urllib.error.HTTPError as exc:
        raise ValueError(f"豆包 HTTP {exc.code}；请检查 Key、服务权限与音色。未自动重试。") from None
    duration = len(pcm) / (2 * settings["sample_rate"])
    metadata = {**safe_settings, "resource_id": RESOURCE, "duration_seconds": duration,
                "timing_basis": "returned_audio", "request_count": 1, "events": events, "logid": logid,
                "source_text_sha256": hashlib.sha256(original.encode()).hexdigest(),
                "pronunciations_applied": speech != original, "generated_at": datetime.now(timezone.utc).isoformat()}
    # Key is never intentionally recorded; redact it if a server event echoed it.
    metadata_text = json.dumps(metadata, ensure_ascii=False, indent=2).replace(settings["api_key"], "[REDACTED]") + "\n"
    output.parent.mkdir(parents=True, exist_ok=True)
    values = (wav_bytes(pcm, settings["sample_rate"]), metadata_text.encode("utf-8"), (speech + "\n").encode("utf-8"), (original + "\n").encode("utf-8"))
    for path, value in zip(paths, values):
        with path.open("xb") as handle:
            handle.write(value)
    print(json.dumps({"audio": str(output), "duration_seconds": duration, "record": str(record),
                      "config_path": str(config_path(root))}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # Exception messages created above contain only actionable, non-secret details.
        if isinstance(exc, (ValueError, FileNotFoundError)):
            print(str(exc), file=sys.stderr)
        else:
            print(f"配音失败（{type(exc).__name__}），检查网络、文件权限和输入格式。未自动重试。", file=sys.stderr)
        sys.exit(1)

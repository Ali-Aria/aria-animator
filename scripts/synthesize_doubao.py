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

DEFAULT_MAX_SEGMENT_CHARS = 300


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


def split_text(text, max_chars):
    """Prefer natural boundaries near the limit; preserve punctuation and word order."""
    if max_chars < 1:
        raise ValueError("每段字符上限必须为正整数。")
    patterns = (r"\n+", r"(?:[。！？!?]+|\.(?=\s|$))[\"'”’」』）)]*",
                r"[，,；;：:、]+", r"\s+")
    boundaries = [[m.end() for m in re.finditer(pattern, text)] for pattern in patterns]
    chunks = []
    start = 0
    while len(text) - start > max_chars:
        limit = start + max_chars
        cut = None
        # Avoid tiny fragments when a later clause or word boundary is available.
        for lower in (start + max(1, max_chars // 2), start + 1):
            for ends in boundaries:
                candidates = [end for end in ends if lower <= end <= limit]
                if candidates:
                    cut = candidates[-1]
                    break
            if cut is not None:
                break
        cut = cut or limit
        chunk = text[start:cut]
        if chunk.strip():
            chunks.append(chunk)
        start = cut
    if text[start:].strip():
        chunks.append(text[start:])
    return chunks


def plan_segments(original, rules_path, max_chars, plan_path=None):
    """Validate AI-authored semantic boundaries against the approved source text."""
    if max_chars < 1:
        raise ValueError("每段字符上限必须为正整数。")
    plan = [{"text": original}]
    if plan_path is not None:
        plan = json.loads(plan_path.read_text(encoding="utf-8-sig"))
        if not isinstance(plan, list) or not plan:
            raise ValueError("语义分段计划必须是非空 JSON 数组。")
    cursor = 0
    segments = []
    for item in plan:
        if (not isinstance(item, dict) or set(item) - {"text", "pause_after_ms"}
                or not isinstance(item.get("text"), str) or not item["text"].strip()):
            raise ValueError("每个语义段需要非空 text，可选 pause_after_ms。")
        pause = item.get("pause_after_ms", 0)
        if type(pause) is not int or not 0 <= pause <= 5000:
            raise ValueError("pause_after_ms 必须为 0～5000 的整数。")
        text = item["text"].strip()
        while cursor < len(original) and original[cursor].isspace():
            cursor += 1
        if not original.startswith(text, cursor):
            raise ValueError("语义分段必须按顺序完整保留已确认正文，只允许省略段间空白。")
        cursor += len(text)
        prepared = prepare_text(text, rules_path)
        if not prepared.strip():
            raise ValueError("发音替换后的配音文本为空。")
        chunks = split_text(prepared, max_chars)
        segments.extend({"text": chunk, "pause_after_ms": pause if i == len(chunks) - 1 else 0}
                        for i, chunk in enumerate(chunks))
    if original[cursor:].strip():
        raise ValueError("语义分段遗漏了已确认正文。")
    # A boundary must not split a pronunciation replacement into separate requests.
    full_speech = prepare_text(original, rules_path)
    joined = "".join(segment["text"] for segment in segments)
    if re.sub(r"\s+", "", joined) != re.sub(r"\s+", "", full_speech):
        raise ValueError("语义边界切断了发音替换，请把完整专有名词放在同一段。")
    return full_speech, segments


def write_json(path, value, api_key):
    content = json.dumps(value, ensure_ascii=False, indent=2).replace(api_key, "[REDACTED]") + "\n"
    with path.open("x", encoding="utf-8") as handle:
        handle.write(content)


def build_request(text, settings):
    payload = {"user": {"uid": "aria-animator"}, "req_params": {
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
    parser.add_argument("--max-segment-chars", type=int, default=DEFAULT_MAX_SEGMENT_CHARS,
                        help="发音替换后每段最多字符数，默认 300，含标点和空白")
    parser.add_argument("--segments-json", type=Path,
                        help="按定稿编排的语义分段 JSON，可指定 pause_after_ms")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = shared_root(args.shared_root)
    settings = load_config(root)
    original = args.input.read_text(encoding="utf-8-sig").strip()
    speech, segments = plan_segments(original, root / "tts/pronunciations.json",
                                     args.max_segment_chars, args.segments_json)
    output = args.output.expanduser().resolve()
    if output.suffix.lower() != ".wav":
        raise ValueError("输出必须使用 .wav 扩展名。")
    record = output.with_suffix(".json")
    spoken = output.with_suffix(".tts.txt")
    transcript = output.with_suffix(".txt")
    paths = (output, record, spoken, transcript)
    segment_dir = output.with_suffix(".segments")
    if any(p.exists() for p in (*paths, segment_dir)):
        raise ValueError("输出或同名记录已存在，请使用新的文件名。")
    safe_settings = {k: settings[k] for k in ("model", "voice_id", "sample_rate", "speech_rate", "loudness_rate")}
    summary = {"config_path": str(config_path(root)), "output": str(output), **safe_settings,
               "api_key_configured": True, "input_characters": len(speech), "dry_run": args.dry_run,
               "max_segment_chars": args.max_segment_chars, "segment_count": len(segments),
               "segments_directory": str(segment_dir),
               "segments": [{"index": i, "characters": len(segment["text"]),
                             "pause_after_ms": segment["pause_after_ms"]}
                            for i, segment in enumerate(segments, 1)]}
    if args.dry_run:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
        return
    segment_dir.mkdir(parents=True, exist_ok=False)
    opener = urllib.request.build_opener(NoRedirect())
    combined = bytearray()
    timeline = []
    sample_rate = settings["sample_rate"]
    for index, segment in enumerate(segments, 1):
        request = build_request(segment["text"], settings)
        try:
            with opener.open(request, timeout=120) as response:
                pcm, events = decode_audio(response)
                logid = response.headers.get("X-Tt-Logid", "")
        except Exception as exc:
            if isinstance(exc, urllib.error.HTTPError):
                detail = f"豆包 HTTP {exc.code}；请检查 Key、服务权限与音色。"
            elif isinstance(exc, ValueError):
                detail = str(exc)
            else:
                detail = f"网络或语音流错误（{type(exc).__name__}）。"
            raise ValueError(f"第 {index}/{len(segments)} 段失败：{detail} "
                             f"未自动重试，未生成完整配音；已完成分段保留在 {segment_dir}。") from None
        start_sample = len(combined) // 2
        end_sample = start_sample + len(pcm) // 2
        pause_samples = sample_rate * segment["pause_after_ms"] // 1000
        audio_path = segment_dir / f"{index:04d}.wav"
        segment_record = {"index": index, "audio": audio_path.name,
                          "text": segment["text"], "characters": len(segment["text"]),
                          "start_sample": start_sample, "end_sample": end_sample,
                          "start_seconds": start_sample / sample_rate,
                          "end_seconds": end_sample / sample_rate,
                          "duration_seconds": len(pcm) / (2 * sample_rate),
                          "pause_after_ms": segment["pause_after_ms"], "pause_samples": pause_samples,
                          "sample_rate": sample_rate, "events": events, "logid": logid,
                          "event_time_basis": "segment_local"}
        with audio_path.open("xb") as handle:
            handle.write(wav_bytes(pcm, sample_rate))
        write_json(audio_path.with_suffix(".json"), segment_record, settings["api_key"])
        with audio_path.with_suffix(".tts.txt").open("x", encoding="utf-8") as handle:
            handle.write(segment["text"] + "\n")
        timeline.append({**segment_record, "audio": audio_path.relative_to(output.parent).as_posix()})
        combined.extend(pcm)
        combined.extend(b"\0\0" * pause_samples)
    duration = len(combined) / (2 * sample_rate)
    metadata = {**safe_settings, "resource_id": RESOURCE, "duration_seconds": duration,
                "timing_basis": "returned_audio_with_explicit_pauses" if any(s["pause_samples"] for s in timeline) else "returned_audio",
                "request_count": len(segments),
                "max_segment_chars": args.max_segment_chars, "segments": timeline,
                "events": timeline[0]["events"] if len(segments) == 1 else [],
                "logid": timeline[0]["logid"] if len(segments) == 1 else "",
                "source_text_sha256": hashlib.sha256(original.encode()).hexdigest(),
                "pronunciations_applied": speech != original, "generated_at": datetime.now(timezone.utc).isoformat()}
    write_json(record, metadata, settings["api_key"])
    values = (wav_bytes(combined, sample_rate), (speech + "\n").encode("utf-8"), (original + "\n").encode("utf-8"))
    for path, value in zip((output, spoken, transcript), values):
        with path.open("xb") as handle:
            handle.write(value)
    print(json.dumps({"audio": str(output), "duration_seconds": duration, "record": str(record),
                      "segment_count": len(segments), "segments_directory": str(segment_dir),
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

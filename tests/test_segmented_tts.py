"""Offline checks for semantic splitting, PCM stitching and partial failures."""
import contextlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import urllib.error
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import shared_config as config
import synthesize_doubao as tts
from test_distribution import stream


class SegmentedTTSTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.folder = Path(self.temp.name)
        self.root = self.folder / "shared"
        config.initialize(self.root)
        self.settings = config.load_config(self.root, require_credentials=False)
        self.settings.update(voice_id="test-voice", api_key="offline-secret")
        config.config_path(self.root).write_text(json.dumps(self.settings), encoding="utf-8")
        self.rules = self.root / "tts/pronunciations.json"
        self.source = self.folder / "source.txt"
        self.output = self.folder / "audio/voiceover.wav"
        self.argv = ["synthesize_doubao.py", "--input", str(self.source), "--output", str(self.output),
                     "--shared-root", str(self.root)]

    def plan_file(self, items):
        path = self.folder / "segments.json"
        path.write_text(json.dumps(items, ensure_ascii=False), encoding="utf-8")
        return path

    def response(self, pcm, complete=True):
        response = stream(pcm, complete)
        response.headers = {"X-Tt-Logid": "offline-secret"}
        return response

    def run_main(self, extra=(), responses=()):
        stdout = io.StringIO()
        with patch.object(sys, "argv", [*self.argv, *extra]), \
                patch.object(tts.urllib.request, "build_opener") as opener, \
                contextlib.redirect_stdout(stdout):
            opener.return_value.open.side_effect = responses
            tts.main()
        return json.loads(stdout.getvalue()), opener

    def test_default_limit_exact_limit_and_lossless_splitting(self):
        for text, expected in (("甲" * 299, 1), ("甲" * 300, 1), ("甲" * 301, 2)):
            with self.subTest(length=len(text)):
                parts = tts.split_text(text, tts.DEFAULT_MAX_SEGMENT_CHARS)
                self.assertEqual(len(parts), expected)
                self.assertEqual("".join(parts), text)
                self.assertTrue(all(len(part) <= 300 for part in parts))
        for text in ("这里是完整句子。”下一句继续。" * 60,
                     "Paragraph one.\n\nParagraph two, with detail; and more words. " * 30,
                     "模型 2.0，访问 example.com，然后继续。" * 50):
            text = text.strip()
            with self.subTest(text=text[:30]):
                parts = tts.split_text(text, 60)
                self.assertEqual("".join(parts), text)
                self.assertTrue(all(0 < len(part) <= 60 for part in parts))

    def test_boundary_preference_paragraph_sentence_clause_and_word(self):
        self.assertEqual(tts.split_text("甲" * 7 + "\n\n" + "乙" * 15, 12)[0], "甲" * 7 + "\n\n")
        self.assertEqual(tts.split_text("甲" * 7 + "。”" + "乙" * 15, 12)[0], "甲" * 7 + "。”")
        self.assertEqual(tts.split_text("甲" * 8 + "，" + "乙" * 15, 12)[0], "甲" * 8 + "，")
        self.assertEqual(tts.split_text("alpha beta gamma delta", 12)[0], "alpha beta ")
        self.assertEqual(tts.split_text("版本2.0" + "甲" * 15, 12)[0], "版本2.0" + "甲" * 7)
        for limit in (0, -1):
            with self.assertRaises(ValueError):
                tts.split_text("测试", limit)

    def test_semantic_plan_preserves_source_and_applies_pause_only_after_last_subchunk(self):
        original = "第一段。\n\n" + "甲" * 21 + "。"
        plan = self.plan_file([{"text": "第一段。", "pause_after_ms": 180},
                               {"text": "甲" * 21 + "。", "pause_after_ms": 250}])
        speech, segments = tts.plan_segments(original, self.rules, 10, plan)
        self.assertEqual(speech, original)
        self.assertEqual([s["pause_after_ms"] for s in segments], [180, 0, 0, 250])
        self.assertTrue(all(len(s["text"]) <= 10 for s in segments))

    def test_invalid_semantic_plans_fail_before_network_or_output(self):
        self.source.write_text("第一句。第二句。", encoding="utf-8")
        invalid = [[], {}, [{"text": "第一句。"}], [{"text": "改写第一句。第二句。"}],
                   [{"text": "第二句。"}, {"text": "第一句。"}], [{"text": ""}]]
        invalid.extend([{"text": "第一句。第二句。", "pause_after_ms": pause}]
                       for pause in (-1, 5001, 1.5, True, "200"))
        for items in invalid:
            with self.subTest(plan=items):
                plan = self.plan_file(items)
                with patch.object(sys, "argv", [*self.argv, "--segments-json", str(plan)]), \
                        patch.object(tts.urllib.request, "build_opener") as opener:
                    with self.assertRaises(ValueError):
                        tts.main()
                    opener.assert_not_called()
                self.assertFalse(self.output.parent.exists())

    def test_pronunciation_expansion_respects_limit_and_rejects_split_replacement(self):
        self.rules.write_text(json.dumps({"replacements": {"ABC": "甲" * 25}}), encoding="utf-8")
        speech, segments = tts.plan_segments("ABC。", self.rules, 10)
        self.assertEqual("".join(s["text"] for s in segments), speech)
        self.assertEqual(len(segments), 3)
        plan = self.plan_file([{"text": "AB"}, {"text": "C。"}])
        with self.assertRaisesRegex(ValueError, "发音替换"):
            tts.plan_segments("ABC。", self.rules, 10, plan)

    def test_dry_run_reports_plan_without_network_or_files(self):
        self.source.write_text("甲" * 601, encoding="utf-8")
        summary, opener = self.run_main(["--dry-run"])
        opener.assert_not_called()
        self.assertEqual(summary["segment_count"], 3)
        self.assertEqual([s["characters"] for s in summary["segments"]], [300, 300, 1])
        self.assertNotIn("offline-secret", json.dumps(summary))
        self.assertFalse(self.output.parent.exists())

    def test_stitching_is_sample_exact_and_event_times_are_segment_local(self):
        self.source.write_text("第一句。\n第二句。", encoding="utf-8")
        plan = self.plan_file([{"text": "第一句。", "pause_after_ms": 150}, {"text": "第二句。"}])
        pcm1, pcm2 = b"\x01\0" * 240, b"\x02\0" * 480
        summary, opener = self.run_main(["--segments-json", str(plan)],
                                        [self.response(pcm1), self.response(pcm2)])
        self.assertEqual(opener.return_value.open.call_count, 2)
        texts = []
        for call in opener.return_value.open.call_args_list:
            request = json.loads(call.args[0].data)["req_params"]
            texts.append(request["text"])
            self.assertEqual(request["speaker"], self.settings["voice_id"])
            self.assertEqual(request["audio_params"]["sample_rate"], self.settings["sample_rate"])
        self.assertEqual(texts, ["第一句。", "第二句。"])
        with wave.open(str(self.output), "rb") as wav:
            self.assertEqual(wav.getparams()[:3], (1, 2, 24000))
            self.assertEqual(wav.readframes(wav.getnframes()), pcm1 + b"\0\0" * 3600 + pcm2)
        record_text = self.output.with_suffix(".json").read_text(encoding="utf-8")
        self.assertNotIn("offline-secret", record_text)
        record = json.loads(record_text)
        self.assertEqual(record["request_count"], 2)
        self.assertEqual(record["duration_seconds"], 0.18)
        self.assertEqual(record["events"], [])
        first, second = record["segments"]
        self.assertEqual((first["start_sample"], first["end_sample"]), (0, 240))
        self.assertEqual((second["start_sample"], second["end_sample"]), (3840, 4320))
        self.assertEqual(second["start_seconds"], 0.16)
        for entry, expected in zip(record["segments"], [pcm1, pcm2]):
            audio = self.output.parent / entry["audio"]
            with wave.open(str(audio), "rb") as wav:
                self.assertEqual(wav.readframes(wav.getnframes()), expected)
            saved = audio.with_suffix(".json").read_text(encoding="utf-8")
            self.assertNotIn("offline-secret", saved)
            self.assertEqual(json.loads(saved)["event_time_basis"], "segment_local")
        self.assertEqual(summary["segment_count"], 2)

    def test_auto_split_concatenates_without_extra_silence(self):
        self.source.write_text("甲" * 301, encoding="utf-8")
        pcm1, pcm2 = b"\x01\0" * 100, b"\x02\0" * 200
        self.run_main(responses=[self.response(pcm1), self.response(pcm2)])
        with wave.open(str(self.output), "rb") as wav:
            self.assertEqual(wav.readframes(wav.getnframes()), pcm1 + pcm2)
        record = json.loads(self.output.with_suffix(".json").read_text(encoding="utf-8"))
        self.assertEqual(record["timing_basis"], "returned_audio")

    def test_partial_failure_keeps_completed_segments_and_stops_without_final_audio(self):
        for failure in (self.response(b"\0\0", complete=False),
                        urllib.error.HTTPError(config.ENDPOINT, 429, "offline-secret", {}, None),
                        TimeoutError("offline-secret")):
            with self.subTest(failure=type(failure).__name__):
                self.output = self.folder / f"{type(failure).__name__}/voiceover.wav"
                self.argv[self.argv.index("--output") + 1] = str(self.output)
                self.source.write_text("甲" * 601, encoding="utf-8")
                with patch.object(sys, "argv", self.argv), \
                        patch.object(tts.urllib.request, "build_opener") as opener:
                    opener.return_value.open.side_effect = [self.response(b"\0\0" * 240), failure]
                    with self.assertRaisesRegex(ValueError, "第 2/3 段失败") as caught:
                        tts.main()
                    self.assertNotIn("offline-secret", str(caught.exception))
                    self.assertEqual(opener.return_value.open.call_count, 2)
                self.assertFalse(self.output.exists())
                self.assertFalse(self.output.with_suffix(".json").exists())
                folder = self.output.with_suffix(".segments")
                self.assertTrue((folder / "0001.wav").is_file())
                self.assertTrue((folder / "0001.json").is_file())
                self.assertFalse((folder / "0002.wav").exists())

    def test_existing_segment_folder_stops_before_network(self):
        self.source.write_text("测试。", encoding="utf-8")
        self.output.with_suffix(".segments").mkdir(parents=True)
        with patch.object(sys, "argv", self.argv), \
                patch.object(tts.urllib.request, "build_opener") as opener:
            with self.assertRaisesRegex(ValueError, "已存在"):
                tts.main()
            opener.assert_not_called()


if __name__ == "__main__":
    unittest.main()

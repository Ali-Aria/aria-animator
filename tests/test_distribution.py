"""Offline checks for initialization, credential isolation and streaming output."""
import base64
import contextlib
import hashlib
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
import wave

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import shared_config as config
import setup
import synthesize_doubao as tts


def stream(pcm, complete=True):
    messages = [{"code": 0, "data": base64.b64encode(pcm[:2]).decode()},
                {"code": 0, "data": base64.b64encode(pcm[2:]).decode(), "sentence": "测试"}]
    if complete:
        messages.append({"code": 20000000, "message": "OK"})
    return io.BytesIO("".join("event: message\ndata: " + json.dumps(m) + "\n\n" for m in messages).encode())


class DistributionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / "shared"
        config.initialize(self.root)

    def configured(self):
        settings = config.load_config(self.root, require_credentials=False)
        settings.update(voice_id="test-system-voice", api_key="offline-test-secret")
        config.config_path(self.root).write_text(json.dumps(settings), encoding="utf-8")
        return settings

    def test_initialization_preserves_user_settings_and_reports_only_presence(self):
        path = config.config_path(self.root)
        initial = json.loads(path.read_text())
        self.assertEqual(initial["api_key"], "")
        self.assertEqual(initial["voice_id"], "")
        self.configured()
        before = path.read_bytes()
        self.assertFalse(config.initialize(self.root))
        self.assertEqual(before, path.read_bytes())
        status = json.dumps(config.public_status(self.root))
        self.assertNotIn("offline-test-secret", status)
        self.assertTrue(config.public_status(self.root)["tts_fields_complete"])
        self.assertFalse(config.public_status(self.root)["credentials_verified_online"])

    def test_empty_credentials_stop_before_network(self):
        with patch.object(tts.urllib.request, "build_opener") as network:
            with self.assertRaisesRegex(ValueError, "填写"):
                config.load_config(self.root)
            network.assert_not_called()

    def test_rejects_cloned_voice_and_wrong_model(self):
        settings = self.configured()
        for key, value in (("voice_id", "S_test-clone"), ("model", "other-model")):
            bad = {**settings, key: value}
            config.config_path(self.root).write_text(json.dumps(bad), encoding="utf-8")
            with self.assertRaises(ValueError):
                config.load_config(self.root)

    def test_custom_shared_path(self):
        with patch.dict("os.environ", {"MOTION_EXPLAINER_SHARED": str(self.root)}):
            self.assertEqual(config.shared_root(), self.root.resolve())
            explicit = self.root / "override"
            self.assertEqual(config.shared_root(explicit), explicit.resolve())

    def test_protocol_model_mapping_and_key_placement(self):
        request = tts.build_request("测试", self.configured())
        body = json.loads(request.data)
        self.assertEqual(request.get_header("X-api-resource-id"), "seed-tts-2.0")
        self.assertEqual(body["req_params"]["speaker"], "test-system-voice")
        self.assertNotIn("offline-test-secret", request.data.decode())
        self.assertEqual(request.full_url, config.ENDPOINT)
        self.assertNotIn("model", body["req_params"])

    def test_complete_stream_produces_single_valid_wav(self):
        pcm = b"\0\0\x01\0" * 120
        result, events = tts.decode_audio(stream(pcm))
        self.assertEqual(result, pcm)
        self.assertTrue(all("data" not in event for event in events))
        with wave.open(io.BytesIO(tts.wav_bytes(result, 24000))) as wav:
            self.assertEqual(wav.getnframes(), 240)
            self.assertEqual(wav.getframerate(), 24000)
            self.assertEqual(wav.readframes(240), pcm)

    def test_truncated_stream_and_provider_error_fail(self):
        with self.assertRaisesRegex(ValueError, "完成标记"):
            tts.decode_audio(stream(b"\0\0", complete=False))
        with self.assertRaisesRegex(ValueError, "状态码"):
            tts.decode_audio(io.BytesIO(b'data: {"code": 45000000, "message": "secret"}\n\n'))
        with self.assertRaises(ValueError):
            tts.decode_audio(stream(b"\0"))

    def test_pronunciation_is_longest_match_without_cascading(self):
        path = self.root / "tts/pronunciations.json"
        path.write_text(json.dumps({"replacements": {"ABC": "AB", "AB": "X"}}))
        self.assertEqual(tts.prepare_text("ABC AB", path), "AB X")

    def test_synthesis_output_does_not_include_credentials(self):
        self.configured()
        source = Path(self.temp.name) / "narration.txt"
        source.write_text("你好。", encoding="utf-8")
        output = Path(self.temp.name) / "audio.wav"
        response = stream(b"\0\0" * 240)
        response.headers = {"X-Tt-Logid": "offline-test"}
        argv = ["synthesize_doubao.py", "--input", str(source), "--output", str(output), "--shared-root", str(self.root)]
        stdout = io.StringIO()
        with patch.object(sys, "argv", argv), patch.object(tts.urllib.request, "build_opener") as opener, contextlib.redirect_stdout(stdout):
            opener.return_value.open.return_value = response
            tts.main()
        self.assertTrue(output.is_file())
        self.assertNotIn("offline-test-secret", stdout.getvalue())
        self.assertNotIn("offline-test-secret", output.with_suffix(".json").read_text())
        self.assertEqual(output.with_suffix(".txt").read_text(encoding="utf-8").strip(), "你好。")
        with patch.object(sys, "argv", argv), patch.object(tts.urllib.request, "build_opener") as opener:
            with self.assertRaisesRegex(ValueError, "已存在"):
                tts.main()
            opener.assert_not_called()

    def test_font_download_hash_and_idempotence(self):
        payload = b"fake-font-for-offline-test"
        files = {"test.ttf": hashlib.sha256(payload).hexdigest()}
        with patch.object(setup, "FONT_FILES", files), patch.object(setup, "download", side_effect=[payload, b"SIL OPEN FONT LICENSE test"]) as download:
            folder = setup.install_fonts(self.root)
            self.assertEqual(download.call_count, 2)
            setup.install_fonts(self.root)
            self.assertEqual(download.call_count, 2)
            (folder / "test.ttf").write_bytes(b"changed-user-file")
            with self.assertRaisesRegex(ValueError, "校验不符"):
                setup.install_fonts(self.root)
            self.assertEqual((folder / "test.ttf").read_bytes(), b"changed-user-file")


if __name__ == "__main__":
    unittest.main()

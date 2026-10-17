"""Exercise discovery with simulated installs; no browser or network is started."""
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'assets/shot-library/scripts/preview_generation.py'
spec = importlib.util.spec_from_file_location('preview_generation', SCRIPT)
preview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preview)


class BrowserDiscoveryTests(unittest.TestCase):
    def use_patch(self, patcher):
        value = patcher.start()
        self.addCleanup(patcher.stop)
        return value

    def setUp(self):
        folder = tempfile.TemporaryDirectory(prefix='motion browser ')
        self.addCleanup(folder.cleanup)
        self.root = Path(folder.name).resolve()
        original_is_file = Path.is_file
        self.use_patch(patch.object(Path, 'home', return_value=self.root))
        self.use_patch(patch.dict(os.environ, {
            'LOCALAPPDATA': str(self.root / 'Local App Data'),
            'PROGRAMFILES': str(self.root / 'Program Files'),
            'PROGRAMFILES(X86)': str(self.root / 'Program Files (x86)'),
        }, clear=True))
        self.which = self.use_patch(patch.object(preview.shutil, 'which', return_value=None))
        # Ignore real installed browsers on the test host.
        self.use_patch(patch.object(Path, 'is_file', lambda p: p.is_relative_to(self.root) and original_is_file(p)))

    def make_browser(self, relative):
        file = self.root / relative
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(b'fixture')
        return file

    def test_linux_path_chromium(self):
        browser = self.make_browser('bin/chromium')
        self.which.side_effect = lambda name: str(browser) if name == 'chromium' else None
        self.assertEqual(preview.browser_path(), str(browser))

    def test_windows_user_install(self):
        browser = self.make_browser('Local App Data/Google/Chrome/Application/chrome.exe')
        self.assertEqual(preview.browser_path(), str(browser))

    def test_windows_32bit_system_install(self):
        browser = self.make_browser('Program Files (x86)/Google/Chrome/Application/chrome.exe')
        self.assertEqual(preview.browser_path(), str(browser))

    def test_macos_user_install(self):
        browser = self.make_browser('Applications/Chromium.app/Contents/MacOS/Chromium')
        self.assertEqual(preview.browser_path(), str(browser))

    def test_playwright_cache_on_linux_and_mac(self):
        for suffix in ['chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
                       'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing']:
            with self.subTest(suffix=suffix):
                browser = self.make_browser('custom cache/chromium-123/' + suffix)
                os.environ['PLAYWRIGHT_BROWSERS_PATH'] = str(self.root / 'custom cache')
                self.assertEqual(preview.browser_path(), str(browser))
                browser.unlink()

    def test_explicit_then_environment_then_discovery(self):
        explicit = self.make_browser('explicit/browser')
        configured = self.make_browser('configured/browser')
        discovered = self.make_browser('bin/chromium')
        self.which.return_value = str(discovered)
        os.environ['REMOTION_BROWSER_EXECUTABLE'] = str(configured)
        self.assertEqual(preview.browser_path(str(explicit)), str(explicit))
        self.assertEqual(preview.browser_path(), str(configured))
        os.environ['REMOTION_BROWSER_EXECUTABLE'] = str(self.root / 'missing')
        with self.assertRaisesRegex(RuntimeError, 'Browser not found'):
            preview.browser_path()
        with self.assertRaisesRegex(RuntimeError, 'Browser not found'):
            preview.browser_path(str(self.root / 'missing'))

    def test_absent_browser_reports_manual_option(self):
        with self.assertRaisesRegex(RuntimeError, 'pass --browser'):
            preview.browser_path()


if __name__ == '__main__':
    unittest.main()

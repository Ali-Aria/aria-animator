const fs = require('node:fs');
const path = require('node:path');
const {bundle} = require('@remotion/bundler');
const {getCompositions, renderMedia, renderStill} = require('@remotion/renderer');
const root = path.resolve(__dirname, '..');
async function main() {
  const req = JSON.parse(fs.readFileSync(0, 'utf8'));
  if (req.command === 'bundle') {
    const location = await bundle({entryPoint: path.join(root, 'src/index.ts'), outDir: req.outDir, publicDir: path.join(root, 'public'), onProgress: () => {}});
    process.stdout.write(JSON.stringify({serveUrl: location})); return;
  }
  const common = {serveUrl: req.serveUrl, browserExecutable: req.browser, chromiumOptions: {gl: 'angle'}, logLevel: 'error', timeoutInMilliseconds: 120000};
  const comps = await getCompositions({...common, inputProps: req.inputProps ?? {}});
  if (req.command === 'list') {process.stdout.write(JSON.stringify(comps)); return;}
  const composition = comps.find(c => c.id === req.composition);
  if (!composition) throw new Error(`Composition not registered: ${req.composition}`);
  const inputProps = req.inputProps ?? {};
  if (req.command === 'still') await renderStill({...common, composition, inputProps, output: req.output, frame: req.frame, scale: req.scale ?? .5, imageFormat: 'png', overwrite: true});
  else await renderMedia({...common, composition, inputProps, outputLocation: req.output, scale: req.scale ?? .5, codec: 'h264', crf: 25, concurrency: req.concurrency ?? 2, muted: true, overwrite: true});
  process.stdout.write(JSON.stringify({ok: true, composition: composition.id, width: composition.width, height: composition.height, fps: composition.fps, durationInFrames: composition.durationInFrames, props: composition.props}));
}
main().catch(error => {process.stderr.write(error.stack + '\n'); process.exitCode = 1;});

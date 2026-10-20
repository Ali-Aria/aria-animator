# 共享库与项目依赖

## 共享库保存什么

共享库位置由用户在 [首次使用引导](first-use.md) 中选择成品保存目录后确定。共享库使用该目录下的 `_shared`，与各视频文件夹并列。它保存跨项目复用的设置与素材：

```text
_shared/
├── config/tts.json
├── tts/pronunciations.json
├── fonts/LxgwWenKai/
└── cache/
```

`tts.json` 保存用户音色与 Key。项目只保存合成音频和必要的非敏感参数，不复制此文件。字体从共享库复制到项目，保证项目交付后仍能加载。更新 Skill 时保留共享库。

新安装在用户主目录下的 `.aria-animator/locations.json` 记录成品保存目录，不含配音凭证。该文件不存在时复用旧版 `.motion-explainer-studio/locations.json`，不另建记录。脚本依次使用显式 `--shared-root`、`ARIA_ANIMATOR_SHARED`、旧版 `MOTION_EXPLAINER_SHARED`、已记录目录的 `_shared`。

无目录记录时兼容已有的 `.aria-animator/shared` 或 `.motion-explainer-studio/shared` 配置。首次初始化必须先选择保存位置；新安装不自动在用户主目录创建共享库。切换记录不会迁移旧配置。

## 项目运行环境

每个新项目默认使用自己的 `package.json`、锁文件与 `node_modules`。在所选成品保存目录下为本片建立独立文件夹，与 `_shared` 并列；维护已有项目时复用原位置。文件布局和路径展示按首次引导执行，不要求固定盘符或额外的建项目脚本。

Node.js 最低版本为 22.18.0，推荐使用 Node.js 24。先检查 `node --version` 和 `npm --version`。动作测试直接导入 `.ts` 文件，需要 Node.js 原生类型移除支持；低版本先升级再运行。镜头库的 `package.json` 已声明 `engines.node`，npm 默认可能只警告，不能据此跳过版本检查。

镜头库的 [package.json](../assets/shot-library/package.json) 与同目录 `package-lock.json` 提供当前依赖版本基线。制作独立项目时，把两份清单复制到该项目，按项目内容调整入口后再安装。使用相同版本的 Remotion 系列包，检查 Node.js 是否满足这些包的 engines 要求。

确认目标项目的 `node_modules` 不是链接到其他项目的共享目录后，可在该项目运行 `npm ci`。不要在带有依赖链接的目录运行会修改依赖树的 npm 命令。维护已有项目时沿用其依赖与锁文件，不覆盖用户现有清单。

镜头库预览脚本需要已有 Chromium 或 Chrome。依次使用 `--browser`、`REMOTION_BROWSER_EXECUTABLE`、PATH 中的浏览器、常见系统安装位置和 Playwright 缓存。Windows 支持用户级与系统级 Chrome；macOS 支持 Chrome 与 Chromium；Linux 可识别 PATH 中的 `google-chrome`、`chromium` 和 `chromium-browser`。显式路径无效时会报错。自动发现失败时，传入浏览器可执行文件的实际路径。

镜头库的两个 Python npm 命令使用 `scripts/run-python.cjs` 自动选择 Python 3.10 或以上版本，支持 `ARIA_ANIMATOR_PYTHON` 指定解释器，兼容旧版 `MOTION_EXPLAINER_PYTHON`。只复制依赖清单创建项目时，应删除不使用的镜头库脚本命令，或一并复制其脚本和所需资源。直接运行其他 Python 脚本前，按 [首次使用引导](first-use.md#识别-python-命令) 确认解释器。

媒体检查使用 PATH 中的 `ffmpeg` 与 `ffprobe`。Python 图像比较需要 Pillow，镜头结构校验的对应分支使用 `jsonschema`，安装到已确认的 Python 环境中。

首次制作检查依赖可加载、浏览器可启动、字体已就绪，并实际渲染代表帧。安装成功不等于已完成渲染验证。不要把其他机器的旧检查记录当作本机结果。

## 可选三维实现

默认制作使用 2D。用户明确要求 Three.js 或维护已有三维项目时，阅读 [三维实现](remotion-three-shader.md)。

使用 `@remotion/three` 时检查 Three.js、React Three Fiber 和 Remotion 的兼容版本。采用随附 `assets/three-shader-starter` 时，保留其 vendored Three.js 源码与许可证。依赖调整只作用于当前项目。

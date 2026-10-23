<h1 align="center">阿梨动画机</h1>

<p align="center"><strong>把主题、资料或定稿，制作成可编辑的 2D 动画讲解视频。</strong></p>

<p align="center">
  <a href="SKILL.md"><img src="https://img.shields.io/badge/Skill-aria--animator-3B5CCC?style=flat-square" alt="Skill: aria-animator"></a>
  <a href="https://github.com/Ali-Aria/aria-animator/stargazers"><img src="https://img.shields.io/github/stars/Ali-Aria/aria-animator?style=flat-square&amp;label=Stars&amp;color=E58B2A" alt="GitHub Stars"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-2E9B57?style=flat-square" alt="License: MIT"></a>
  <a href="references/shared-dependencies.md"><img src="https://img.shields.io/badge/React-2D-149ECA?style=flat-square&amp;logo=react&amp;logoColor=white" alt="React: 2D"></a>
  <a href="references/shared-dependencies.md"><img src="https://img.shields.io/badge/Video-Remotion-5B5BD6?style=flat-square" alt="Video: Remotion"></a>
</p>

阿梨动画机（Aria Animator，Skill 标识 `aria-animator`）是一个动画讲解制作 Skill。它把主题、资料或定稿制作成可编辑的视频，涵盖口播写作、配音、画面编排、音效和导出。

默认使用 React 与 Remotion 制作极简 2D 动画，画布采用所选配色预设的纸色，字体为霞鹜文楷。相关段落共用画布，主体跨段接续，镜头随内容移动。完整制作规则见 [SKILL.md](SKILL.md)。

## 配色预览

青瓷蓝、椰林绿、编辑部红和石墨青四套配色均使用各自的纸色背景。具体色值和语义角色见 [配色规则](references/color-presets.md)。

下方 20 秒视频为旧版白底示例，尚未更新本次纸色背景、强调色和色阶调整。

https://github.com/user-attachments/assets/c422eb5a-d348-43b4-ac0a-2df6ae285913

[观看旧版配色预览（MP4）](assets/readme/palette-preview.mp4) · [查看配色规则](references/color-presets.md)

## 默认制作方式

口播和画面在配音前分配信息。口播讲清因果、判断和必要条件；画面展示名称、数值、位置、对照和操作细节，并留出阅读时间。稿外交代核查过程和次要待核项，正文保留有依据的适用条件，交稿前逐句清理空泛的免责和重复说明。

| 项目 | 默认规则 |
| --- | --- |
| 动作与镜头 | 使用 `process` 节奏，主体错峰响应，结果接入下一步。镜头按传递关系和关注点跟随，证据落稳后保持可读。 |
| 配色 | 全片或同组交付选用青瓷蓝、椰林绿、编辑部红或石墨青中的一套。画布默认使用预设的纸色（`BG`），仅按平台或明确制作要求改为纯白。真实界面和证据保留必要的原色。 |
| 字体 | 标题、标签和字幕使用霞鹜文楷真实 Medium 500；次要长说明可用 Regular 400。加载组件默认禁用合成字重。 |
| 轮廓 | 以 1080p 落稳画面为基准，主体 8 px、连线 6 px、辅助细节 4 px。检查局部缩放、镜头缩放和预览缩小后的可见粗细。 |
| 声音 | 使用已配置的豆包配音，或原样使用用户指定的成品配音。按可见事件安排音效，不增加背景音乐或额外旁白。 |

仅修改画面时，复用已确认的配音和实测时间。口播、发音、语速或有语义作用的停顿变化时，重做配音和时间校准。

## 运行环境

使用前准备以下工具。具体依赖版本和项目配置见 [共享库与项目依赖](references/shared-dependencies.md)。

| 工具 | 用途 |
| --- | --- |
| 支持 Skill 和本地命令的 AI 助手 | 读取制作规则，编写并执行项目代码。 |
| Python 3.10 或以上版本 | 初始化配置、下载字体和调用配音接口。上述脚本只使用标准库。 |
| Node.js 22.18.0 或以上版本与 npm | 推荐 Node.js 24。安装项目依赖，运行 Remotion 和原生 TypeScript 动作测试。 |
| Chromium 或 Chrome | 预览和渲染视频。 |
| FFmpeg 与 ffprobe | 处理音频、检查视频参数。需能从命令行调用。 |

镜头库的部分检查脚本还需要 Pillow 和 `jsonschema`，使用对应检查时再准备。

## 安装与首次配置

### 让 AI 助手安装

把本仓库的 GitHub 链接发给支持本地命令和 Skill 的 AI 助手，可以这样说：

```text
请从这个仓库安装 aria-animator（阿梨动画机）：
https://github.com/Ali-Aria/aria-animator
先阅读仓库根目录的 AGENTS.md，按我的 AI 宿主完成安装和首次配置引导。
先说明共享库与各视频文件夹的用途，再引导我选择成品保存目录。
共享库放在所选目录的 _shared 中，与各视频文件夹并列。
安装后展示各位置的完整路径。
```

[AI Agent 使用指南](AGENTS.md) 包含目录识别、安装、初始化和检查步骤。安装请求只完成安装与首次配置引导。AI 会先解释目录用途，让你选择成品保存位置，再创建共享库。配音音色和 API Key 由你在本机填写，初始化时会给出文件位置与配置链接。

### 手动安装

将完整的 `aria-animator` 文件夹放到 AI 助手支持的 skills 目录。先按 [Python 命令识别](references/first-use.md#识别-python-命令) 确认可用的 Python 3.10 或以上版本。

先选择一个成品保存目录。共享库和每个视频文件夹都放在其中，各自保存以下内容：

| 目录 | 保存内容 |
| --- | --- |
| `<成品保存目录>/_shared` | 跨项目复用的配音配置（含音色 ID 和 API Key）、发音规则、字体及许可证、缓存。更新 Skill 时保留。 |
| `<成品保存目录>/<视频名称>` | 该视频的正式成片、预览、口播稿、源码、素材、配音、字幕和检查记录。每个视频独立保存。 |
| Skill 安装目录 | 制作规则、工具脚本、镜头源码和内置预览视频。 |

例如，选择 `D:/我的视频` 后，`D:/我的视频/_shared` 与 `D:/我的视频/dns-explainer-20261020` 并列。示例路径按你的系统和偏好替换。

以下示例中的 `python` 表示已确认的解释器命令。只有 `python3` 的系统请替换为 `python3`；Windows 使用 Python 启动器时替换为 `py -3`。后续命令沿用同一解释器。在 Skill 文件夹中运行：

```sh
python scripts/setup.py --workspace-root "<你选择的成品保存目录>" --install-fonts
```

脚本会在所选目录创建 `_shared`，并展示各位置的绝对路径。保存目录记录在用户主目录下的 `.aria-animator/locations.json`，其中只有路径，后续调用自动复用。安装阶段不创建具体视频项目。暂不选择目录时，可以先完成 Skill 文件安装，待首次制作前再配置。

已有 `.motion-explainer-studio/locations.json` 时自动复用旧记录，不另建一份。旧版独立共享库可能位于用户主目录下的 `.motion-explainer-studio/shared`。共享库环境变量使用 `ARIA_ANIMATOR_SHARED`，兼容旧版 `MOTION_EXPLAINER_SHARED`，也可用 `--shared-root` 显式指定。已有配置先复用；需要调整为并列结构时，先核对迁移方式，脚本不会自动搬迁。详细步骤见 [首次使用引导](references/first-use.md)。

### 填写豆包配音配置

配音固定使用 `doubao-seed-tts-2-0`，对应豆包语音合成 2.0 的系统音色。初始化后，打开脚本展示的 `config/tts.json`，填写以下两项：

| 字段 | 填写内容 |
| --- | --- |
| `voice_id` | 语音合成 2.0 的系统音色 ID。 |
| `api_key` | 你在豆包语音控制台创建的 API Key。 |

这两项初始值为空，由你自行填写。

- [豆包语音控制台](https://console.volcengine.com/speech)：开通所需服务。
- [API Key 管理](https://console.volcengine.com/speech/new/setting/apikeys?projectName=default)：创建密钥。
- [官方音色列表](https://www.volcengine.com/docs/6561/1257544)：选择“豆包语音合成模型 2.0”的系统音色。
- [API Key 使用说明](https://docs.volcengine.com/docs/DoubaoVoice/APIKeyUsage?lang=zh)：查看鉴权方式。

填写后，在 Skill 目录重新运行：

```sh
python scripts/setup.py
```

脚本检查配置格式，并展示保存位置，只报告 Key 是否已填写。服务权限和音色是否可用，需要通过实际合成验证。

提供成品配音时，可以跳过合成配置。发音规则、音频参数和合成命令见 [豆包配音](references/doubao-tts.md)。

配音前，AI 会按定稿安排语义分段，需要强调或转折时可指定额外停顿。每次请求默认最多 300 个字符，长段自动拆分，再按顺序拼接完整 WAV。使用同一音色和音频参数，保留各段音频与实测时间；普通句间停顿交给标点和 TTS。上限可用 `--max-segment-chars` 调整，计划格式见豆包配音文档。300 是本 Skill 的默认值，实际效果需听检。

### 准备字体与视频项目

初始化会从 [LxgwWenKai 官方 GitHub](https://github.com/lxgw/LxgwWenKai) 下载霞鹜文楷，核对文件校验值，并保留字体许可证。字体保存到共享库，供多个项目复用。

开始制作时，在所选成品保存目录中，为本片建立独立文件夹，与 `_shared` 并列。源码、素材、配音和字幕保存在这个项目内；完整低清预览放在 `previews/`，正式成片和导出的独立音效轨放在 `renders/`，检查记录放在 `qc/`。已有项目沿用原目录与布局。

确定本片项目目录后，在 Skill 目录运行以下命令，将占位路径替换成实际位置：

```sh
python scripts/setup.py --project "<项目目录>"
```

命令会把 Regular、Medium 字体、许可证和加载组件复制到项目。按 [字体接入](references/fonts.md) 在视频根组件加载字体，等待字体就绪后再渲染。渲染时从项目本地读取字体。

已有项目中的字体或加载组件与当前版本不同时，脚本会保留原文件并报出冲突路径。核对后按项目需要合并，避免覆盖已有修改。

每个视频项目默认使用自己的 JavaScript 依赖。安装方法见 [共享库与项目依赖](references/shared-dependencies.md)。

## 制作第一个视频

引用 Skill，提供主题、文本或图片材料，再说“帮我做视频”即可。例如：

```text
使用 aria-animator（阿梨动画机），根据这些材料帮我做个视频。
```

也可以只给一个主题，例如“帮我做个解释 DNS 原理的视频”。已有定稿或音频时直接附上；有时长、画幅或风格偏好时再补充。

AI 会按 Skill 的默认流程写口播、使用已配置的配音和字体，并安排画面与音效。首次使用缺少配置或尚未选择保存目录时，AI 会引导你完成。开始制作和交付时会展示本片项目、预览和成片的完整路径。

默认有两次确认：先检查口播稿，确认后开始合成配音和制作视频；再检查完整低清预览，确认后渲染正式版。低清预览包含完整时间线、配音、启用的字幕和音效，16:9 默认使用 960×540。

你也可以明确跳过某一步，例如“口播不用审核，直接配音制作”或“不用预览，直接渲染正式版”。若希望全程由 AI 完成，可以说“全程不用确认，直接做成片”。已经确认的同一版本无需重复确认。

交付内容包括视频、最终配音、使用的字幕、全片关键帧缩略图、检查记录和简短的可复用组件清单。使用音效时另交付独立音效轨，最终配音源文件保留为纯配音。项目保留可编辑源码与素材。需要项目压缩包时，在任务中说明。

检查覆盖静帧、连续动作、跨段镜头、字体字重和缩放后的线宽。关闭口播字幕时，画面中的必要标签、数值和操作仍须可辨；只听配音时，主线和必要条件仍须清楚。检查记录保存在 `qc/workflow-evidence.json`，问题、修复和复查保存在 `qc/production-learning.json`。方法见 [制作检查](references/production-and-qc.md)。

## 查看镜头示例

可以从 [镜头目录](assets/shot-library/shot-library.json) 查找可复用的镜头，也可下载后打开 [预览页面](assets/shot-library/review.html) 查看动作效果。示例用于参考构图、动作和接续方式，实际视频按你的内容重新编排。

## 制作规则索引

| 任务 | 文档 |
| --- | --- |
| 安装和配置 | [Agent 使用指南](AGENTS.md)、[首次使用引导](references/first-use.md)、[共享库与项目依赖](references/shared-dependencies.md) |
| 写稿和安排信息 | [口播与画面信息分工](references/information-design.md)、[口播写作](references/voiceover-writing.md) |
| 接入配音和音效 | [豆包配音](references/doubao-tts.md)、[音效设计与接入](references/sound-effects.md) |
| 设计画面 | [视觉设计](references/code-motion-design.md)、[配色规则](references/color-presets.md)、[字体接入](references/fonts.md) |
| 实现动态过程 | [process 制作与接入](references/process-production.md)、[动作编排](references/motion-production-patterns.md)、[连续运动](references/continuous-motion.md) |
| 确认和交付 | [口播与预览确认](references/review-checkpoints.md)、[制作检查](references/production-and-qc.md) |

## 来源与许可证

本 Skill 基于 [vibe-motion/remotion-code-motion-explainer](https://github.com/vibe-motion/remotion-code-motion-explainer) 修改。原项目由 [Bingo](https://github.com/DWCD-Bingo) 创建。

阿梨动画机增加了首次使用引导、独立共享配置、豆包语音合成 2.0 接入、霞鹜文楷加载和内置中文口播写作。制作规则包含口播与画面的信息分工、统一字重与轮廓线宽，以及口播、预览两次确认和检查记录。

原项目采用 [MIT 许可证](LICENSE)。镜头库来源见 [SOURCES.md](assets/shot-library/SOURCES.md)。霞鹜文楷使用 SIL Open Font License（OFL）1.1，下载和复制字体时一并保留许可证。随附 Three.js 源码保留其 MIT 许可证。

# AI Agent 使用指南

本仓库发布“阿梨动画机”（Aria Animator），Skill 标识为 `aria-animator`。先按用户任务选择执行范围：

| 用户任务 | 执行范围 |
| --- | --- |
| 安装 Skill | 执行下方安装与首次配置步骤，不自动开始视频制作。 |
| 制作或修改视频 | 阅读 [SKILL.md](SKILL.md)，按 [确认节点](references/review-checkpoints.md) 执行制作流程。 |
| 维护仓库或更新文档 | 阅读相关源码和规则，按本文末尾的仓库维护要求修改与验证。无需初始化个人配音配置。 |

## 安装与首次配置

### 1. 确定安装位置

读取当前 AI 宿主的配置、已有 Skill 目录或官方安装说明，确定它实际支持的目录和作用范围。用户指定项目内安装时使用项目目录，否则优先使用宿主的用户级 Skill 目录。不要假定所有宿主都使用 `~/.codex/skills`。

优先使用宿主提供的 Skill 安装工具。需要手动安装时，将完整仓库安装到该目录下的 `aria-animator` 文件夹，使 `SKILL.md` 位于此文件夹根部。若无法确定宿主或目录，只询问这项缺失信息。

### 2. 获取完整仓库

使用用户提供的本仓库 GitHub 链接。用户指定分支、标签或提交时遵循该版本；否则使用远端默认分支。README 中的上游来源链接用于署名，不能代替用户指定的安装来源。

当前发布仓库为 [Ali-Aria/aria-animator](https://github.com/Ali-Aria/aria-animator)。

手动安装且目标目录不存在时，可执行以下命令。先把占位符替换为实际值，并按当前 shell 正确引用路径：

```text
git clone "<用户提供的本仓库 GitHub URL>" "<宿主实际 skills 目录>/aria-animator"
```

没有 Git 时，可下载所选版本的完整源码归档并解压到相同位置。保留目录结构，包括 `references/`、`scripts/`、`agents/` 和 `assets/`。不要只下载 `SKILL.md`。

目标目录已存在时，先检查来源、版本和本地修改。已安装相同版本则复用；需要更新时保留用户修改和共享库，不强制覆盖、重置或删除已有目录。发生冲突时说明具体文件，再让用户选择处理方式。

### 3. 初始化与引导配置

阅读已安装的 [SKILL.md](SKILL.md) 和 [首次使用引导](references/first-use.md)。初始化前先解释：共享库保存配音配置（含音色 ID 和 API Key）、发音规则、字体及许可证、缓存；每个视频文件夹保存该片的成片、预览、源码、素材、配音、字幕和检查记录。

告诉用户共享库和视频项目放在同一个目录下，`_shared` 与各视频文件夹并列，然后引导用户选择成品保存目录。用户已经指定或本机已记录同一选择时直接复用；尚未选择时等待回复，不先创建默认共享库。暂不选择时只报告 Skill 文件安装完成、目录配置待完成。

按首次引导识别 `python`、`python3` 或 Windows 的 `py -3`，确认版本至少为 3.10。用户选好位置后，将下例占位符替换为实际绝对路径，后续脚本沿用同一解释器：

```text
python "<实际 Skill 安装目录>/scripts/setup.py" --workspace-root "<用户选择的成品保存目录>" --install-fonts
```

命令在所选目录创建 `_shared` 和空白配音配置，从 [LxgwWenKai 官方 GitHub](https://github.com/lxgw/LxgwWenKai) 下载字体，并把保存目录记入本机 `locations.json`。后续脚本自动复用所选共享库，不覆盖用户设置。安装阶段不创建具体视频文件夹。

根据实际输出，向用户展示以下绝对路径和用途：

| 输出字段 | 向用户说明 |
| --- | --- |
| `workspace_root` | 用户选择的成品保存目录，包含 `_shared` 与各视频文件夹。 |
| `skill_path` | Skill 安装位置，保存制作规则、脚本和镜头库。 |
| `shared_library_path` | 共享库位置，跨项目保存个人配置、字体、发音规则和缓存。 |
| `tts_config_path` | 配音配置位置，由用户填写音色 ID 和 API Key。 |
| `font_path` | 字体及许可证位置。 |
| `locations_config_path` | 本机保存目录记录，只含路径，不含配音凭证。 |

路径须以完整绝对路径文本展示，可同时提供可点击链接，不只用“共享库”等标签隐藏路径。旧版独立共享库的 `workspace_root` 为空时，如实说明成品位置尚未配置。已有旧版共享库、环境变量或自定义路径时，先核对位置；需要迁移时遵循首次引导，不自动搬迁或另建空配置。

配音模型固定为 `doubao-seed-tts-2-0`；新配置中的 `voice_id` 和 `api_key` 保持为空。向用户提供 [豆包语音控制台](https://console.volcengine.com/speech)、[API Key 管理](https://console.volcengine.com/speech/new/setting/apikeys?projectName=default) 和 [官方音色列表](https://www.volcengine.com/docs/6561/1257544)，让用户自行选择语音合成 2.0 系统音色并在本机填写。

不要从其他项目查找凭证，不要求用户把 Key 发到聊天里，也不回显配置文件全文。用户填好后重新运行 `setup.py`，展示保存位置，只报告字段是否已填。

### 4. 验证并报告结果

检查根部 `SKILL.md` 的 `name` 为 `aria-animator`，并确认以下资源存在：

- `scripts/setup.py`、`scripts/shared_config.py` 和 `scripts/synthesize_doubao.py`。
- `references/first-use.md`、`references/shared-dependencies.md` 和 `references/review-checkpoints.md`。
- `references/information-design.md`、`references/voiceover-writing.md`、`references/fonts.md` 和 `references/code-motion-design.md`。
- `assets/LxgwFont.tsx`、`assets/tts-config.example.json`、`assets/shot-library/shot-library.json` 和 `agents/openai.yaml`。

检查初始化的实际退出状态和输出；下载或初始化失败时报告具体错误和未完成步骤。字体下载成功时确认 Regular、Medium 两个字体文件及 OFL 许可证齐全，不把仅创建字体目录视为安装成功。

安装完成与配音配置完成分别报告。凭证留空不影响 Skill 文件安装，但不能声称已经验证配音服务。安装时不调用真实 TTS，不渲染测试视频。视频所需的 Node.js、Remotion、浏览器和媒体工具按 [运行环境](README.md#运行环境) 与 [项目依赖](references/shared-dependencies.md) 在制作前检查。

如宿主需要重新加载或新开会话才能发现 Skill，按其实际机制提示用户。给出调用示例：

```text
使用 aria-animator（阿梨动画机），根据这些材料帮我做个视频。
```

告诉用户可以提供主题、文本或图片材料，有其他偏好时再补充。配音、字体和制作流程由 Skill 默认规则决定，无需用户在调用提示词中逐项指定。后续制作遵循 [确认节点](references/review-checkpoints.md)。用户明确授权跳过某项确认时，按授权范围继续。

## 视频制作入口

具体制作规则以 [SKILL.md](SKILL.md) 及其引用文档为准。开始视频任务时，特别核对以下要求：

- 按 [首次使用引导](references/first-use.md) 复用所选成品保存目录，在其中为本片建立独立文件夹，与 `_shared` 并列。尚未选择时先完成目录引导；已有项目复用原位置。制作和交付时展示项目、预览与成片的实际绝对路径。
- 写稿前阅读 [信息分工](references/information-design.md) 和 [口播写作](references/voiceover-writing.md)。口播讲因果、判断和必要条件，画面承接有依据的可视细节并留出阅读时间。交稿前完成逐句检查。
- 配音前按 [豆包配音](references/doubao-tts.md) 编排已确认正文的语义分段，通过 `--segments-json` 提交，按需指定段后停顿。脚本默认每段最多 300 个字符，超长自动拆分并拼接；保留分段音频和实测时间。分段不改正文，不逐句添加固定静音。
- 默认使用极简 2D 与 `process` 节奏，画布采用所选配色预设的纸色（`BG`）。阅读 [process 接入](references/process-production.md)，将参数接到主体变化和镜头任务中，保留跨段接续。
- 按 [配色规则](references/color-presets.md) 为全片选择一套预设。仅在交付平台或明确制作要求需要时将画布改为纯白，其他语义色沿用预设。各配色共用霞鹜文楷真实 Medium 500，次要长说明可用 Regular 400；按 [字体接入](references/fonts.md) 加载本地字体，禁用合成字重。
- 按 [视觉设计](references/code-motion-design.md#统一轮廓线宽) 检查轮廓。1080p 落稳画面中，主体默认 8 px、连线 6 px、辅助细节 4 px。检查缩放后的实际粗细，不再叠加旧版 `strokeScale: 1.8`。
- 按 [制作检查](references/production-and-qc.md) 审阅完整预览，核对阅读时间、真实字体、连续动作和声音。静态检查不能代替播放与听检。

默认先确认口播，再合成配音和实现视频；完整低清预览确认后，再渲染正式版。沿用用户已给出的确认或跳过授权，不新增风格、模板或音效审批。

## 仓库维护

修改前检查 Git 状态和差异，保留用户已有修改、共享配置和无关项目。用户要求推送时，检查远端与分支，只提交本次任务相关文件，不强制推送。

更新规则时，同步核对 [SKILL.md](SKILL.md)、对应参考文档、[README.md](README.md) 和本文。涉及默认字体或字重时，同时核对 `assets/LxgwFont.tsx`；不要把静态文档更新报告成已完成渲染验证。

文档修改检查相对链接、标题锚点、命令、字段和路径是否与源码一致。涉及初始化、配音封装或浏览器发现时，使用已确认的 Python 运行现有离线测试：

```text
python -m unittest discover -s tests -v
```

涉及镜头运行时或项目依赖时，按 `assets/shot-library/package.json` 和对应测试检查。使用已有环境，依赖缺失时如实说明未完成的检查。离线测试无需真实 TTS 凭证，不调用线上配音，也不修改用户的共享配置。

提交前检查 `git diff --check` 和待提交文件。不要提交 API Key、个人配音配置、依赖目录或临时检查产物。报告实际完成的检查、提交和推送结果。

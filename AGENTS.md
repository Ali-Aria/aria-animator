# AI Agent 安装指南

用户要求从本仓库安装“动态图解工坊”时，按以下步骤执行。Skill 标识为 `motion-explainer-studio`。安装请求只包含安装和首次配置引导，不自动开始视频制作。

## 1. 确定安装位置

读取当前 AI 宿主的配置、已有 Skill 目录或官方安装说明，确定它实际支持的目录和作用范围。用户指定项目内安装时使用项目目录，否则优先使用宿主的用户级 Skill 目录。不要假定所有宿主都使用 `~/.codex/skills`。

优先使用宿主提供的 Skill 安装工具。需要手动安装时，将完整仓库安装到该目录下的 `motion-explainer-studio` 文件夹，使 `SKILL.md` 位于此文件夹根部。若无法确定宿主或目录，只询问这项缺失信息。

## 2. 获取完整仓库

使用用户提供的本仓库 GitHub 链接。用户指定分支、标签或提交时遵循该版本；否则使用远端默认分支。README 中的上游来源链接用于署名，不能代替用户指定的安装来源。

手动安装且目标目录不存在时，可执行以下命令。先把占位符替换为实际值，并按当前 shell 正确引用路径：

```text
git clone "<用户提供的本仓库 GitHub URL>" "<宿主实际 skills 目录>/motion-explainer-studio"
```

没有 Git 时，可下载所选版本的完整源码归档并解压到相同位置。保留目录结构，包括 `references/`、`scripts/`、`agents/` 和 `assets/`。不要只下载 `SKILL.md`。

目标目录已存在时，先检查来源、版本和本地修改。已安装相同版本则复用；需要更新时保留用户修改和共享库，不强制覆盖、重置或删除已有目录。发生冲突时说明具体文件，再让用户选择处理方式。

## 3. 初始化与引导配置

阅读已安装的 [SKILL.md](SKILL.md) 和 [首次使用引导](references/first-use.md)。先按首次引导识别 `python`、`python3` 或 Windows 的 `py -3`，确认版本至少为 3.10。将下例中的 `python` 替换为已确认的命令，后续脚本沿用同一解释器：

```text
python "<实际 Skill 安装目录>/scripts/setup.py" --install-fonts
```

命令创建共享库和空白配音配置，从 [LxgwWenKai 官方 GitHub](https://github.com/lxgw/LxgwWenKai) 下载字体。复用已有配置，不覆盖用户设置。若用户指定共享库位置，统一使用 `MOTION_EXPLAINER_SHARED` 或 `--shared-root`。

根据实际输出，向用户展示以下绝对路径和用途：

| 输出字段 | 向用户说明 |
| --- | --- |
| `skill_path` | Skill 安装位置，保存制作规则、脚本和镜头库。 |
| `shared_library_path` | 共享库位置，跨项目保存个人配置、字体、发音规则和缓存。 |
| `tts_config_path` | 配音配置位置，由用户填写音色 ID 和 API Key。 |
| `font_path` | 字体及许可证位置。 |

默认共享库为用户主目录下的 `.motion-explainer-studio/shared`。配音模型固定为 `doubao-seed-tts-2-0`；新配置中的 `voice_id` 和 `api_key` 保持为空。向用户提供 [豆包语音控制台](https://console.volcengine.com/speech)、[API Key 管理](https://console.volcengine.com/speech/new/setting/apikeys?projectName=default) 和 [官方音色列表](https://www.volcengine.com/docs/6561/1257544)，让用户自行选择语音合成 2.0 系统音色并在本机填写。

不要从其他项目查找凭证，不要求用户把 Key 发到聊天里，也不回显配置文件全文。用户填好后重新运行 `setup.py`，展示保存位置，只报告字段是否已填。

## 4. 验证并报告结果

检查根部 `SKILL.md` 的 `name` 为 `motion-explainer-studio`，并确认 `scripts/setup.py`、`scripts/synthesize_doubao.py`、`references/first-use.md`、`references/review-checkpoints.md` 和 `assets/shot-library/shot-library.json` 均存在。检查初始化的实际退出状态和输出；下载或初始化失败时报告具体错误和未完成步骤。

安装完成与配音配置完成分别报告。凭证留空不影响 Skill 文件安装，但不能声称已经验证配音服务。安装时不调用真实 TTS，不渲染测试视频。视频所需的 Node.js、Remotion、浏览器和媒体工具按 [运行环境](README.md#运行环境) 与 [项目依赖](references/shared-dependencies.md) 在制作前检查。

如宿主需要重新加载或新开会话才能发现 Skill，按其实际机制提示用户。给出调用示例：

```text
使用 motion-explainer-studio（动态图解工坊），根据这些材料帮我做个视频。
```

告诉用户可以提供主题、文本或图片材料，有其他偏好时再补充。配音、字体和制作流程由 Skill 默认规则决定，无需用户在调用提示词中逐项指定。后续制作遵循 [确认节点](references/review-checkpoints.md)。用户明确授权跳过某项确认时，按授权范围继续。

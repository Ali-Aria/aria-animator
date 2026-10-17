# 首次使用引导

## 识别 Python 命令

先检查 `python --version`。命令不存在或版本低于 3.10 时，检查 `python3 --version`；Windows 还可以检查 `py -3 --version`。使用第一个满足要求的解释器。命令打开应用商店或没有返回 Python 版本时，继续检查下一个候选。

本 Skill 文档中的 `python` 均指这一步确认的命令。只有 `python3` 时替换为 `python3`，使用 Windows 启动器时替换为 `py -3`。初始化、配音和检查沿用同一解释器，避免混用虚拟环境。自定义可执行文件路径含空格时，按当前 shell 引用；PowerShell 调用带引号的路径时，在前面加 `&`。

镜头库的 `npm run render:previews` 和 `npm run validate:shots` 会自动检测上述命令并检查版本。需要指定解释器时，将环境变量 `MOTION_EXPLAINER_PYTHON` 设为可执行文件路径；变量值不加额外引号或命令参数，不能填成 `py -3`。显式配置无效时会报错，不切换到其他环境。直接运行 Python 脚本时，仍使用已确认的解释器命令。

## 展示位置与用途

安装完成后，用已确认的 Python 命令运行下列脚本。宿主没有安装后钩子时，由 Agent 在首次调用 Skill 时执行。`<skill目录>` 必须解析为当前 `SKILL.md` 所在目录。

```text
python "<skill目录>/scripts/setup.py" --install-fonts
```

Python 需要 3.10 或以上版本。初始化和配音脚本只使用标准库。初始化不会调用配音服务，不会自动填写凭证，也不会覆盖已有配置。

将脚本返回的真实绝对路径整理成简短说明，明确展示：

| 位置 | 作用 |
| --- | --- |
| `skill_path` | 存放制作规则、脚本和镜头库。 |
| `shared_library_path` | 跨项目保存个人配音配置、发音规则、字体与缓存。升级 Skill 时保留此目录。 |
| `tts_config_path` | 用户自行填写音色 ID 和 API Key 的配置文件。 |
| `font_path` | 从 GitHub 下载的霞鹜文楷字体及许可证。 |

共享库默认放在用户主目录的 `.motion-explainer-studio/shared`。用户另选目录时，统一设置 `MOTION_EXPLAINER_SHARED`，或在各脚本中传入相同的 `--shared-root`。新路径不会自动迁移旧配置，不要在多个目录各保存一套凭证。

## 引导填写配音配置

向用户展示以下链接与配置文件的实际路径，让用户在本机编辑文件：

- [豆包语音控制台](https://console.volcengine.com/speech)：开通语音合成 2.0 服务。
- [API Key 管理](https://console.volcengine.com/speech/new/setting/apikeys?projectName=default)：创建豆包语音 API Key。
- [官方音色列表](https://www.volcengine.com/docs/6561/1257544)：在“豆包语音合成模型 2.0”列表中选择音色，复制对应 ID。
- [API Key 使用说明](https://docs.volcengine.com/docs/DoubaoVoice/APIKeyUsage?lang=zh)。

配置模板中的 `voice_id` 和 `api_key` 均为空。`model` 固定为 `doubao-seed-tts-2-0`，其他音频参数已有初始值。说明这里需要系统音色，声音复刻 2.0 的克隆音色属于另一类资源；方舟文本模型的 Key 也不能直接当作豆包语音 Key。

用户填写后运行 `setup.py`，检查字段格式并再次展示 `tts_config_path`。报告“配置已保存在此处”，仅说明 Key 是否已填，不回显文件全文。字段齐全表示本地配置完成，服务权限与音色可用性仍需首次真实合成验证。

Key 留空时，可以继续口播和画面规划。合成需要等待用户填好，并遵循 [口播与预览确认](review-checkpoints.md)，先确认口播内容。用户明确要求原样使用成品配音时，跳过合成。不要从其他项目、环境文件或历史输出中查找用户的声音和密钥。

## 首次项目检查

按 [共享库与项目依赖](shared-dependencies.md) 准备 Node.js、项目依赖、浏览器和媒体工具，再按 [字体接入](fonts.md) 把共享字体复制到项目。

后续调用复用已有配置。若文件缺失、字段为空或用户要求更换配置，再展示对应设置步骤；不要每次都让用户重填。

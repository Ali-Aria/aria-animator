# 豆包语音合成 2.0

## 配置与资源

固定模型名为 `doubao-seed-tts-2-0`，对应官方语音接口资源 `seed-tts-2.0`。使用语音合成 2.0 系统音色，初始化时音色与 API Key 留空。填写入口见 [首次使用](first-use.md)。

配置保存在 `<共享库>/config/tts.json`，模板见 [tts-config.example.json](../assets/tts-config.example.json)。

| 字段 | 初始值 | 说明 |
| --- | --- | --- |
| `model` | `doubao-seed-tts-2-0` | 固定模型名称，由脚本映射成请求头中的资源标识。 |
| `voice_id` | 空字符串 | 用户从官方 2.0 音色列表选取。 |
| `api_key` | 空字符串 | 用户在豆包语音控制台创建的 Key。 |
| `sample_rate` | `24000` | 输出采样率，单位 Hz。 |
| `speech_rate` | `0` | 默认语速，范围为 -50～100。 |
| `loudness_rate` | `0` | 默认音量，范围为 -50～100。 |

脚本不读取外部项目、历史播报记录或全局 `.env`。配音请求固定发送到官方 `openspeech.bytedance.com`，不自动更换服务、音色或模型。

## 合成

合成前按 [口播与预览确认](review-checkpoints.md) 展示完整正文，取得用户对当前版本的确认，或已有明确的跳过口播审核授权。配置齐全不能代替内容确认。画面提示放在稿外。输入采用纯正文，保留段落与自然标点，不使用声音复刻 Expressive 的 Cot 标签。

发音规则位于 `<共享库>/tts/pronunciations.json`，初始内容为 `{"replacements": {}}`。用户可添加专有名词的字面替换。脚本只修改配音副本，保留原文供画面和字幕使用；替换按最长匹配执行，不循环替换。

```text
python "<skill目录>/scripts/synthesize_doubao.py" --input "<项目目录>/voiceover.txt" --output "<项目目录>/public/audio/voiceover.wav" --dry-run
```

`--dry-run` 仅检查输入与配置，不表示用户已经批准口播。检查通过且当前口播已获确认或明确免审后，去掉 `--dry-run` 执行合成。自定义共享库时，添加 `--shared-root "<共享库目录>"`，或使用同一个环境变量。

每次调用提交一段完整口播，不自动重试。服务拒绝过长文本时，按完整语义段落分批，记录请求并测量音频后拼接，不在每句后插入固定静音。输出文件存在时停止，重做配音应使用新文件名。

采用官方 HTTP SSE 接口，接收 PCM 数据后写成单个 16 位单声道 WAV。保留同名 JSON 中的返回事件和实测时长、`.txt` 原文与 `.tts.txt` 配音副本。成功完成标记缺失时，不把音频当作完整产物保存。

## 校准与交付

服务返回的时间事件应对照最终音频检查。没有词级时间时，不得用句级时间或字数估计冒充词级时间。发音替换可能让返回文字与字幕原文不同，须建立对应关系。

默认不做额外变速或母带处理。用户要求后期音频处理时，保留原始音频、记录参数，并重新校准最终音频与字幕。听检开头、专有名词、段落衔接和最后一个音节。

Key 只保存在共享配置中，不进入项目素材、日志或交付包。初始化检查只验证格式；空 Key 和空音色不能发起合成，也不能标记为服务验证通过。

协议依据：[HTTP Chunked / SSE 单向流式 V3](https://www.volcengine.com/docs/6561/1598757)、[API Key 使用说明](https://docs.volcengine.com/docs/DoubaoVoice/APIKeyUsage?lang=zh)。

# process 制作与接入

默认主动使用 `process`。先把内容组织成输入、动作、响应和结果，再安排镜头与节奏。画布按 [配色规则](color-presets.md) 使用所选预设的纸色，证据落稳后固定阅读，主体动作与镜头变化由内容决定。

## 选择动作机制

制作前检索 `assets/shot-library/shot-library.json`。按内容选择、改编或组合，不必向用户列出候选并等待选择。下列组合适合技术讲解：

| 内容 | 可用机制 | 需要呈现的变化 |
| --- | --- | --- |
| 调查、分析或处理流程 | 持续知识画布 `wide-knowledge-world` | 同一请求或数据进入下一环节，镜头跟随接收方 |
| 自然语言驱动工具 | 提示词工作流 `ui-ae-prompt-agent-flow` | 输入变成请求，接收方响应，工作开始 |
| 解包、分类或汇合 | 群聚重组 `ui-ae-card-swarm-timeline` | 已有部件错峰拆分或汇合，保留身份与因果 |
| 函数调用或模块关系 | 节点聚焦 `wide-relationship-focus` | 局部近景看连接，整体景别看上下文 |

复用机制，重做构图、标签和顺序。其他题材可选别的镜头或原创动作，记录理由。镜头移动要有关注点和目的地。主体正在充分解释关系时可以停住。

## 把配置接到动作

沿用 `src/data/choreography-plan.json`。记录 `motionProfile`、事件窗口、镜头轨迹、阅读窗口和对应源码位置。

默认复用动作运行时，或实现等效的帧驱动控制器。下例中的 `clock` 实际控制出现时差、位移和执行进度：

```tsx
const clock = motionClock(displayFrame, fps, {
  motionProfile: plan.motionProfile ?? 'process',
  timingSeconds: plan.timingSeconds,
});
const onset = event.startFrame / fps + index * clock.stagger;
const entry = clock.progress('entry', {start: onset, duration: clock.entry});
const y = targetY + (1 - entry) * 50 * clock.profile.amplitude;
const action = clock.progress('action', {
  start: event.startFrame / fps,
  duration: event.durationInFrames === undefined
    ? clock.action
    : event.durationInFrames / fps,
});
```

用 `action` 控制真实传递、拆分、装配或状态变化。明示事件时长优先于默认值，阅读停顿独立安排。

禁止独立调用 `motionClock()` 后丢弃结果。仅在 JSON 中填入 `process`，或只改变字幕、标签和透明度，不能证明动态过程已经实现。

在计划中增加 `runtimeBindings`，注明配置消费位置和主要事件的实现。例如：

```json
{
  "runtimeBindings": [
    {"file": "src/motion/direction.tsx", "symbol": "directedClock", "consumes": ["entry", "stagger", "profile.amplitude"]},
    {"file": "src/ProcessWorld.tsx", "symbol": "ProcessWorld", "events": ["request-travel", "findings-assemble"]}
  ]
}
```

制作后运行 `node <技能目录>/scripts/audit-motion.mjs <项目目录>`。脚本检查计划结构、源码位置和明显丢弃的节奏调用。它不证明画面生动，实际消费和动作含义仍须审阅。
脚本使用项目已有的 `@babel/parser` 解析 TSX。依赖缺失时报告具体错误，按共享依赖规则处理，脚本不安装包。

## 截图进出场

把 `runtime.ts`、`evidence.ts` 和 `EvidenceTransition.tsx` 从镜头库复制到项目的 `src/motion/`。容器放在移动世界之外，包含完整图片、白底和来源对应的强调层。字幕保留在容器外。

```tsx
<EvidenceTransition
  time={displayFrame / fps}
  start={readingStartSeconds}
  end={readingEndSeconds}
  motionProfile="process"
>
  <Img src={source} style={{width: '100%', height: '100%', objectFit: 'contain'}} />
  <SourceAlignedEmphasis />
</EvidenceTransition>
```

`start` 表示入场已经落稳，`end` 表示出场开始。默认在 `start - 0.4` 秒到 `start` 秒入场，在 `end` 秒到 `end + 0.3` 秒出场。阅读区间位移严格为 0。

图片组件须在完整过渡窗口内存在。用原来的 `start <= time < end` 条件卸载组件，会截断动画。连续两张截图允许过渡交叠，分别保留两个图层，由进入的截图接管画面。截图退出前，让下一主体就绪。

`enabled={false}` 用于用户要求静态展示。调整片头、片尾或短阅读段的过渡时，保留配音和字幕时间，另记实际窗口。

## 验收当前效果

审阅包含主体接续的连续片段。确认主体变形、拆分、传递和接收方反馈实际可见，镜头揭示了对应关系。读图时保持静止，主动停顿注明阅读用途。

从新渲染结果填写 `qc/workflow-evidence.json`。记录参数消费位置、动作采样帧、跨段边界和截图三个阶段。检查证据绑定当前源码和素材校验值。正常速度观看、连续帧审阅和音频听检分别记录，未执行的检查不能写成通过。

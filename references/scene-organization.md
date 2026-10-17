# 场景组织与跨段镜头

## 规划共享空间

相关讲解段归入一个 `continuousSpan`，按因果关系设置区域。
区域可以是工作台的不同位置、同一张图的局部或系统周围的工位。结合主体大小和移动时间确定间距与构图，避免等距排列整张页面。
默认 2D 使用共享 SVG／DOM 画布，父级视窗负责平移和缩放。技术图纸、手帐或科技信号风格按用户另选的方向采用。

每个区域记录世界坐标、关注点、可读范围、输入、结果和下一步位置。
每个跨段边界记录持续主体、起止关注点、镜头出发和到达时间，以及结果如何参与下一步。
镜头可以在章节点前出发、在节点后到达。章节时间只驱动讲解状态，不重建世界。

保留 `src/data/choreography-plan.json` 原有字段，按需添加空间计划：

```json
{
  "continuousSpans": [{
    "id": "context-process",
    "beats": ["gather", "process", "retain"],
    "worldOwner": "context-world",
    "stations": [
      {"id": "desk", "origin": [-5, 0, 0]},
      {"id": "processor", "origin": [0, 0, 0]},
      {"id": "archive", "origin": [5, 0, 0]}
    ],
    "bridgeActor": "context-bundle",
    "boundaries": [{
      "from": "gather", "to": "process", "mode": "travel",
      "bridgeActor": "context-bundle",
      "camera": {"departCue": "gather-result", "arriveCue": "process-onset"},
      "consequence": "The gathered material enters processing."
    }]
  }]
}
```

坐标仅说明结构，生产时间取自当前成品音频。区域数量和排列按内容确定。
准确的界面、图表和固定截图可保留各自的表现方式。

## 用结果组织接续

资料、信号或结构在承担解释任务时持续存在。记录主体身份、世界位置、状态、进入和退出控制器及移除条件。
一个过程可以由多个主体接力。变形、拆分或组合在同一控制器内完成；换用形状时展示对应关系和中间状态。
水印、主持人或装饰边框的重复出现，不能证明内容接续。

例如，上下文过程可用“资料摊开 → 工具返回加入 → 上下文积累 → 压缩 → DNA 条带 → 增量”。
条带进入增量图时，让条目形成可追踪的新增、保留和移除。数据不支持对应时，换用准确的接续，并注明示意属性。
不能制造过程来掩盖切换。

| 内容关系 | 镜头和主体的接续 |
| --- | --- |
| 结果进入下一环节 | 保留主体，镜头跟随到接收方 |
| 局部属于更大系统 | 拉远显示整体，再推进相关部分 |
| 同一数据换种表达 | 保留数据身份，在原处变形后改构图 |
| 前后状态需要比较 | 揭示另一侧，保留可识别的共同部分 |
| 进入证据阅读 | 镜头落稳后显示固定证据层，退出后继续保留的世界 |
| 主题确实改变 | 明确切镜头，记录改变的内容 |

连续镜头允许停住阅读。普通重构图及较长跟随的时长见 [动作编排](motion-production-patterns.md)。
不要用整屏淡入、推走页面或空白后重建，替代计划中的空间移动或形变。
段落或章节变化不能单独成为切镜头理由；尊重用户指定的一镜到底范围。

证据图片按 [视觉设计](code-motion-design.md) 完整、固定展示。阅读时保留背后的世界，退出后从合理构图继续。
世界持续存在只证明生命周期连续，证据的进入和返回仍须有可见关系。

## 让世界独立于章节

每个连续过程保留同一世界、视窗和需要接续的主体。3D 维护路径还须保留 canvas、renderer、Scene 和 camera。
初始化只依赖固定内容、尺寸和质量配置；帧、章节或当前段落不能成为重建依赖。
按统一的 `displayFrame / fps` 每帧完整计算区域、主体和镜头状态。局部时钟只转换一次。

```tsx
<ContinuousWorld time={displayFrame / fps} />
<FixedEvidenceOverlay active={evidenceWindow} />
<Subtitles time={displayFrame / fps} />
```

章节驱动事件、姿态和可见性，不能用互斥的全屏组件切换实现声明的连续过程。
主体在解释任务结束后才隐藏；进入证据层也保留世界，可用覆盖层或不透明度控制显示。
实际接入仍须处理就绪等待、最新请求帧、错误报告和资源清理。
平滑缓动只改善运动轨迹，不能接续已卸载的世界。

## 调度器和历史示例

底层轨迹见 [连续运动](continuous-motion.md)。`assets/three-shader-starter/src/scene-director.ts` 不依赖渲染器，按章节、区域坐标和全局相机轨迹调度。
`createSceneDirector(plan).sample(seconds)` 返回章节、跨段移动窗口和相机状态。
`worldPoint(stationId, localPosition)` 转换区域坐标。位置与关注点共用连续轨迹，阅读停顿用同值平台节点。
真正的硬切由片级编辑器处理，调度器只管理一个连续过程。

以下 Three.js 示例用于维护历史实现或明确请求的 3D 制作，不作为新 2D 项目的起点。
生命周期接入见 `assets/three-shader-starter/src/OrganizedFixture.tsx`。沿用 [共享依赖](shared-dependencies.md) 和连续运动文档中的 Node.js 要求：

```powershell
node --test tests/scene-director.test.mjs tests/motion-runtime.test.mjs
npx --no-install tsc --noEmit
npx --no-install remotion render src/organization-index.tsx SharedWorldLinear30 out/shared-world-linear.mp4 --scale=0.5 --codec=h264 --crf=26 --concurrency=2
npx --no-install remotion render src/organization-index.tsx SharedWorldCorner60 out/shared-world-corner.mp4 --scale=0.5 --codec=h264 --crf=26 --concurrency=2
```

两个无配音示例各 12 秒，分别使用直线和转角布局。同一资料束经过三个区域、两次章节移动，最后拉远显示整体。
在当前项目的 `qc/` 保存本机运行记录。这些示例验证技术机制，不替代生产配音或内容编排。
连续片段及至少两次有意义接续的检查方法统一见 [制作检查](production-and-qc.md)。

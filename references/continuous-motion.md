# 连续轨迹与动作反馈

## 适用范围

先按 [场景组织](scene-organization.md) 规划共享世界和跨段镜头。本参考处理经过关注点、跨段移动及动作反馈的轨迹。
`assets/three-shader-starter/src/motion-runtime.ts` 不依赖 React、Three.js 或 GSAP，可复制到项目供 DOM、SVG 或 Three.js 使用。

## 经过节点与停住阅读

`createTrack(keys)` 返回 `sample(seconds)`，结果包含 `position` 和 `velocity`。
轨迹在初始化时创建，逐帧采样。节点 `time` 使用秒且严格递增，`value` 数组长度一致，数值有限；区间外保持端点。
相机位置、关注点、距离或主体位置均可使用该轨迹。

```ts
const focus = createTrack([
  {time: 0, value: [-2, .5, 11]},
  {time: .4, value: [-2, .5, 11]}, // 初始观察停顿。
  {time: .9, value: [-.5, .5, 11]}, // 连续经过。
  {time: 1.5, value: [1.5, .6, 10], stop: true},
]);
const {position, velocity} = focus.sample(displayFrame / fps);
```

节点共享 Hermite 切线，使位置和速度连续；单调限制减少越过目标的风险。
首尾、同值平台和方向反转会让相应坐标轴停住，`stop: true` 停住全部坐标。
用两个同位置节点界定阅读时长。经过节点保留速度，避免每段都使用首尾静止的独立补间。

轨迹不保证加速度连续。高速近景仍有顿挫时，检查曲率和节点间距，再选择适合路径的样条。
旋转角先展开，避免跨越 ±π 时反转；不能逐轴插值四元数。

## 动作与反馈交叠

`sampleAction(seconds, action)` 提供预备、主动作、接收方反馈和衰减反冲。
根据重量和事实决定哪些输出可见，不要求每个动作弹跳。以下是调参起点，事件时间取自当前制作的成品配音：

```ts
const state = sampleAction(seconds, {
  start: event.onsetSeconds, duration: .5,
  anticipation: .16, settle: .4, index: i, stagger: .09, strength: .06,
});
const flight = cubicPath(controlPoints, state.progress);
const pose = [
  flight.position[0] + state.anticipationOffset,
  flight.position[1] - state.recoil,
  flight.position[2],
];
const receiverOpening = state.response;
```

| 输出 | 含义 |
| --- | --- |
| `anticipationOffset` | 主动作前短暂预备，开始时归零 |
| `progress` | 从 0 到 1 的五次平滑曲线，适合独立起落 |
| `response` | 默认在路程后 30% 开始，到达后略迟完成 |
| `recoil` | 到达后衰减，在 `settle` 结束时归零 |

`index × stagger` 为不同主体错峰。提前反馈仅用于迎接、准备接触等有依据的动作；成功确认保留真实触发时间。
主姿态、预备和反冲由一个 transform 控制器合成。所有输出使用统一显示时间和主文件的结尾冻结规则。

`cubicPath` 接收四个控制点，返回位置和对进度求导的 `tangent`。
计算每秒速度时，还须乘进度对秒的导数。直接使用切线不能检查速度接续。
穿越多个区域使用整条 `createTrack`；独立落地才用首尾速度归零的 `progress`。
接续曲线路径时检查方向和速度。

## 接续与属性控制检查

每个边界记录 `carry`、`hold` 或 `cut`，注明主体和属性。
`auditHandoff` 比较两段函数在同一边界时刻的世界位置和每秒速度：

```ts
const result = auditHandoff({
  actor: 'signal', mode: 'carry',
  outgoing: previousMotion.sample(boundarySeconds),
  incoming: nextMotion.sample(0), // 下一段使用局部时间。
  positionTolerance: .01, velocityTolerance: .03,
});
```

`carry` 要求位置和速度接上；`hold` 还要求两边停住；`cut` 须记录切镜头原因。
容差按项目坐标单位设置并注明理由。相邻两帧的正常位移不能直接当成跳跃。
`auditOwnership` 检查同一 actor、property 的不同 owner 是否在活动区间重叠。
结果写入 `qc/workflow-evidence.json`；渲染前修复错误，或改为有具体依据的切镜头。

这些函数不判断构图、旋转、透视、文字残留或视觉流畅度。
屏幕关注点、大小和方向的检查见 [制作检查](production-and-qc.md)。

## 运行历史示例

以下为已有 Three.js 技术示例，仅按主文件的 3D 适用条件使用。
复制完整 starter，保留 `src/vendor` 的版本和许可；新入口独立于原 Shader 示例。
在已配置共享依赖的项目中运行：

```powershell
node --test tests/motion-runtime.test.mjs
npx --no-install tsc --noEmit
npx --no-install remotion render src/continuity-index.tsx ContinuousTransfer30 out/continuous-transfer.mp4 --scale=0.5 --codec=h264 --crf=26 --concurrency=2
npx --no-install remotion render src/continuity-index.tsx CurvedAssembly60 out/curved-assembly.mp4 --scale=0.5 --codec=h264 --crf=26 --concurrency=2
```

运行环境按 [项目依赖](shared-dependencies.md) 准备，测试需要 Node.js 22.18.0 或以上版本，推荐 Node.js 24。
两个无配音场景分别验证连续传送和曲线装配，使用 30 fps 和 60 fps。
在当前项目的 `qc/` 保存本机验证结果，历史机器的验证报告不随分发版提供。
示例数量、时间、布局和调色不构成制作要求；正式配音遵循 [豆包配音](doubao-tts.md)。
复用机制的跨帧率、跳帧、移动帧和结尾检查统一见制作检查文档。

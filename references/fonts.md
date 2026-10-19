# 霞鹜文楷字体

## 安装到共享库

默认使用 [lxgw/LxgwWenKai](https://github.com/lxgw/LxgwWenKai) 的霞鹜文楷。先按 [首次使用引导](first-use.md) 解释目录用途，让用户选择成品保存目录。首次安装运行：

```text
python "<skill目录>/scripts/setup.py" --workspace-root "<用户选择的成品保存目录>" --install-fonts
```

脚本从官方 GitHub Release 下载 `v1.522` 的 Regular 和 Medium 字体，核对固定 SHA-256，并保存 OFL 许可证及来源记录。字体位于 `<共享库>/fonts/LxgwWenKai`，供各项目复用，无需系统管理员权限或系统字体安装。

共享库为所选目录下的 `_shared`。已记录保存目录后，重装或检查字体可直接运行 `setup.py --install-fonts`，自动复用同一位置。

已有文件校验通过时直接复用。网络失败时报告下载失败与共享路径，不能声称安装完成或悄悄换字体。可按脚本中固定版本的链接手动下载到同一目录，再运行检查。

## 接入视频项目

```text
python "<skill目录>/scripts/setup.py" --project "<项目目录>"
```

该命令将字体、许可证和来源记录复制到项目 `public/fonts/LxgwWenKai`，将 [LxgwFont.tsx](../assets/LxgwFont.tsx) 复制到 `src/LxgwFont.tsx`。遇到同名但不同内容的文件时保留原文件并报错。

在 composition 的根组件使用：

```tsx
import {LxgwFont} from './LxgwFont';

export const Video = () => (
  <LxgwFont>
    {/* 当前视频的场景、标签和字幕 */}
  </LxgwFont>
);
```

加载器使用 Remotion 的渲染等待机制，字体加载失败时停止渲染。

## 主要字体与字重

新视频所有配色默认使用霞鹜文楷。标题、标签和字幕采用真实 Medium 500；次要长说明可用 Regular 400。配色预设不改变这项字体规则。

将 `LXGWWenKai-Medium.ttf` 注册为 500，将 `LXGWWenKai-Regular.ttf` 注册为 400。根组件默认设置 `fontWeight: 500` 和 `fontSynthesis: 'none'`。次要长说明按需显式设置 400。
默认不请求 600、700 或 `bold`，也不使用文字描边模拟加粗。确认 500 映射到已加载的 Medium 字体文件，不能仅凭计算样式中的 `font-weight: 500` 判断字体正确。

复用镜头时检查内部 `fontFamily` 和 `fontWeight`。字体统一使用 `"LXGW WenKai"` 或继承根部设置，标题、标签和字幕使用 500。小标签应检查最终字号，避免随图标缩小后难以阅读。

原始截图、用户提供的界面证据保留原字形。导出时读取项目本地字体，不依赖系统是否已安装，也不在逐帧渲染时从 GitHub 下载。

字体随工程提供时，保留 `OFL.txt` 和原文件名。来源：[GitHub Release](https://github.com/lxgw/LxgwWenKai/releases/tag/v1.522)、[OFL 许可证](https://github.com/lxgw/LxgwWenKai/blob/v1.522/OFL.txt)。

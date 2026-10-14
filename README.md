# 隔空画画 · GitHub Pages 网页版

本仓库包含可直接部署的浏览器画画页面，以及 `desktop/` 中完整保留的原 Python 桌面程序。

**原项目可以上传 GitHub 保存源码，但不能直接在 GitHub Pages 运行。** 原入口是 `main.py`，依赖 Python、OpenCV 和本地系统接口。本次新增的 `index.html` + JavaScript 网页版在浏览器里完成手势识别，不需要服务器、Python、npm install 或构建。

## 上传与部署（GitHub 网页操作）

1. 解压提供的 ZIP，打开其中的 `gesture-drawing-web` 文件夹。
2. 在 GitHub 创建仓库，例如 `gesture-drawing`。最省事的方式是使用公开仓库。
3. 进入仓库，选择 **Add file → Upload files**；空仓库可点击 **uploading an existing file**。
4. **上传 `gesture-drawing-web` 文件夹里面的全部内容，不要把最外层文件夹整体作为一个子目录上传，也不要只上传 ZIP。** `assets` 和 `desktop` 文件夹要保留目录结构。提交到 `main` 分支。
5. 上传完成后，仓库首页应该直接看到 `index.html`、`app.js`、`styles.css` 和 `assets/`。
6. 打开 **Settings → Pages**：
   - Source：**Deploy from a branch**
   - Branch：**main**
   - Folder：**/(root)**
   - 点击 **Save**。
7. 等待 GitHub 完成部署，在 Pages 页面打开网站地址，一般为 `https://你的用户名.github.io/仓库名/`。如果仓库名为 `你的用户名.github.io`，则地址不带仓库路径。
8. 点击页面里的 **开启摄像头**，在浏览器提示中允许摄像头权限。

所有资源都使用相对路径，适用于 GitHub Pages 的仓库子路径。`.nojekyll` 是空文件，用于按静态资源发布；请尽量一起上传，Windows 如果不显示该文件，可启用显示隐藏文件。

> 不要只补一个空的 `index.html`：GitHub Pages 不能执行 Python，原程序必须在电脑本地运行。本目录的网页入口实际实现了浏览器绘画和手势识别。

## 网页版功能

- 摄像头本地识别一只手，Worker 线程处理模型推理。
- 捏合拇指与食指绘画，松开立即抬笔，识别丢失后结束当前笔画。
- 霓虹、彩虹、压感、星尘、毛笔、喷枪、浮雕、拖尾、魔术、橡皮，共 10 种网页笔触。
- 七色调色板、粗细与捏合阈值调节。
- 撤销 / 重做（最近 30 次操作）、清空并可撤销恢复。
- 张开手掌保持约 0.55 秒，移动整张画作；改变手势或离开镜头即可放下。
- 竖拇指保持约 0.55 秒撤销；握拳保持约 0.55 秒切换橡皮。
- 可关闭手势快捷操作，保留捏合绘画；可切换镜像方向。
- 鼠标左键按住拖动、触屏拖动绘画。未开摄像头也能使用。
- 黑白背景切换、保存 1280×800 PNG；保存图片不包含摄像头、光标和操作按钮。
- 摄像头未授权、设备缺失、设备被占用、模型加载失败时显示提示。

快捷键：`U` 或 `Ctrl+Z` 撤销，`Ctrl+Shift+Z` / `Ctrl+Y` 重做，`F` 换笔，`E` 橡皮，`S` 保存，`1–7` 换色。macOS 可用 Command 替代 Ctrl。

**功能范围：网页移植保留画画核心流程，并非原桌面程序全部功能的逐项复刻。** 原版的系统鼠标 / 键盘 / 媒体控制、专门的签名卡片、音乐玩法、小游戏、单笔抓取和动态粒子动画仍在 `desktop/` 中。网页的压感为移动速度模拟，星尘和拖尾为静态笔触效果，毛笔、魔术等渲染也与 OpenCV 原版不同。

## 使用条件与注意事项

- 优先使用新版 Chrome 或 Edge；移动端的性能、模块 Worker 和摄像头兼容性需在实际设备上确认。
- 摄像头需要 HTTPS 或 localhost。GitHub Pages 提供 HTTPS；不要通过双击 `index.html` 的 `file://` 地址测试手势模块。
- 模型、JavaScript 和 WASM 全部随仓库部署，不依赖运行时访问第三方 CDN。首次加载仍需从你的网站下载这些文件，可能需要一点时间。
- 摄像头画面在浏览器本地处理，本页面没有上传视频、图片或统计数据的代码。PNG 保存到自己的设备。
- 网页不会自动保存画作。刷新、关闭页面或离开网站前，请保存 PNG。
- 镜头前保持明亮，把整个手掌放进画面。默认捏合阈值为 0.38；难以落笔时可以适度调高灵敏度。

## 本地预览（可选）

部署到 GitHub Pages 不需要 Node.js。若希望部署前在自己电脑测试：

1. 安装 Node.js。
2. 双击 `本地预览.bat`，服务就绪后会自动打开浏览器；或在本目录终端运行 `node preview.cjs`。
3. 在 Chrome / Edge 打开 `http://localhost:8080`，点击开启摄像头。
4. 关闭预览终端，或按 Ctrl+C 停止服务。

本地服务器只监听本机，不用于生产部署。8080 被占用时，可在 PowerShell 运行 `$env:PORT=8081`，再运行 `node preview.cjs` 并访问 `http://localhost:8081`。

## 文件结构

```text
gesture-drawing-web/         ← 上传此目录内的内容
  index.html                ← 必须位于仓库根目录
  styles.css
  app.js
  gesture.js
  tracker-worker.js
  .nojekyll
  .gitignore
  assets/
    models/hand_landmarker.task
    vendor/vision_bundle.mjs
    vendor/wasm/             ← 请上传其中的全部文件
    vendor/LICENSE
  desktop/                  ← 原始 Python 项目，文件未修改
  preview.cjs                ← 可选的本地预览服务器
  本地预览.bat
  README.md
  THIRD_PARTY_NOTICES.md
  验证说明.md
```

不要删除 `assets` 中的 WASM / 模型文件，否则开启摄像头后无法识别手势。`desktop/` 中旧 README 的机器路径是原作者环境信息，不代表你电脑已安装相应环境。

## 常见问题

**网站 404**：检查 Pages 是否选择 `main` 和 `/(root)`，检查根目录是否直接包含小写的 `index.html`。等待部署完成后再刷新。

**页面出现但摄像头不开**：使用 HTTPS 地址；允许网站摄像头权限；关闭可能占用摄像头的视频会议软件。也可先用鼠标画画。

**点击摄像头按钮完全没反应**：若地址栏开头是 `file:///`，请关闭页面，双击 `本地预览.bat`，使用自动打开的 `http://localhost:8080` 测试。直接打开 HTML 会被浏览器拦截模块，旧版因此没有绑定按钮。新版会显示“查看启动问题”并说明原因。若已部署 GitHub Pages，请上传修复版的 `index.html`、`app.js`、`preview.cjs` 和 `本地预览.bat`（最省事是覆盖上传修复包的全部内容），再按 Ctrl+F5 强制刷新。

**一直等待摄像头授权**：检查地址栏附近的摄像头权限提示。新版会在等待 10 秒后继续显示说明，并允许点击“取消启动”后重试。允许摄像头后还需要加载手势模型，页面会显示“加载模型”。

**模型加载失败 / 文件 404**：检查 `assets/models/hand_landmarker.task` 和整个 `assets/vendor/wasm/` 是否已提交，文件名大小写是否正确。不要直接打开本地 HTML 文件。

**网页无法上传文件**：本包单个文件均小于 25 MB。如果 GitHub 网页批量上传失败，可以分批上传，或使用 Git / GitHub Desktop 提交；文件夹结构必须保持一致。

**桌面程序如何运行**：见 `desktop/README.md` 与 `desktop/requirements.txt`。桌面 `run.bat` 保留了原来的机器路径，网页部署不使用这个文件。

参考：[GitHub Pages 官方部署说明](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)、[MediaPipe Web 手部检测文档](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js)、[浏览器摄像头 API 条件](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)。

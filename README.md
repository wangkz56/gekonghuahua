# 隔空画画 · 全部文件平铺上传版

本版把网页、手势模型和运行库全部放在同一层。**包内没有子文件夹，可以通过 GitHub 的 choose your files 一次全选上传。**

## 上传到现有仓库

1. 下载并完整解压本版 ZIP。不要把 ZIP 本身上传到仓库。
2. 打开 GitHub 仓库 `wangkz56/gekonghuahua` 的 Code 页面。
3. 点击 **Add file → Upload files → choose your files**。
4. 在文件选择窗口打开解压目录，按 **Ctrl+A** 选中全部文件，再点击 **打开**。如果隐藏文件 `.nojekyll` 未显示，也可以上传其余 14 个文件；本版资源名均不以 `_` 开头，不依赖这个标记文件。
5. 等所有文件上传完毕，点击页面底部 **Commit changes**，提交到 `main`。同名的网页程序文件会更新，新增模型和运行库直接放在仓库根目录。
6. Settings → Pages 应选择 **Deploy from a branch → main → /(root)**，点击 Save（已正确设置则无需重复修改）。
7. 等 Pages 部署完成，打开 `https://wangkz56.github.io/gekonghuahua/`，按 **Ctrl+F5** 刷新，点击开启摄像头并允许访问。

可以继续使用原仓库。旧版 `assets` 中的资源不会被本版调用。

## 上传后仓库根目录应出现

```text
index.html
styles.css
app.js
gesture.js
tracker-worker.js
vision-bundle.js
vision_wasm_module_internal.js
vision_wasm_module_internal.wasm
hand_landmarker.task
MEDIAPIPE-LICENSE.txt
preview.cjs
本地预览.bat
README.md
验证说明.md
.nojekyll
```

**上面所有文件都放在同一层，无需上传任何文件夹。** 不要重命名手势模型和运行库，不要只上传 HTML / JS 而漏掉 `.wasm` 和 `.task` 文件。

## 本地预览

电脑安装 Node.js 后，双击 `本地预览.bat`，服务启动成功后会打开浏览器。地址为 `http://localhost:8080`。不要直接双击 `index.html`，本地文件协议会被浏览器拦截脚本模块。

## 功能与使用

开启摄像头后，捏合拇指与食指落笔，松开抬笔。支持十种笔触、七种颜色、粗细调整、撤销重做、橡皮、移动整张画作、黑白背景和保存 PNG。不启用摄像头也可以用鼠标或触屏绘画。

张开手掌保持半秒移动整张画作；竖拇指保持半秒撤销；握拳保持半秒切换橡皮。可以在手势小抄中关闭手势快捷操作。

网页不会自动保存画作，刷新前请保存 PNG。原桌面版音乐、小游戏、系统控制等附加功能没有移植。

推荐使用新版 Chrome 或 Edge。摄像头需要 HTTPS 或 localhost。模型推理在浏览器本地进行，不上传摄像头视频。本版随站点加载所有资源，不需要第三方 CDN。

如果遗漏文件，页面会显示具体缺失的文件名及 HTTP 状态；补传相应文件到根目录，再等待部署并刷新。

## 第三方资源

`vision-bundle.js` 原文件为官方 npm 包 `@mediapipe/tasks-vision@1.1.0` 的 `vision_bundle.mjs`，仅改扩展名，文件内容未改动。`vision_wasm_module_internal.js` 和 `.wasm` 来自同一包。许可正文见 `MEDIAPIPE-LICENSE.txt`，Apache-2.0。

`hand_landmarker.task` 来自用户原项目，文件未修改，未独立确认其来源及许可。原 Python 桌面程序保留在之前的完整交付包，本包仅含浏览器部署文件。

# 第三方资源

- `assets/vendor/vision_bundle.mjs` 与 `assets/vendor/wasm/*` 来自官方 npm 包 `@mediapipe/tasks-vision@1.1.0`，Apache-2.0 许可。许可正文位于同目录 `LICENSE`。
  - 包：https://www.npmjs.com/package/@mediapipe/tasks-vision
  - 上游：https://github.com/google-ai-edge/mediapipe
  - 固定版本归档：https://registry.npmjs.org/@mediapipe/tasks-vision/-/tasks-vision-1.1.0.tgz
- `assets/models/hand_landmarker.task` 复制自用户提供的原项目，并已验证可以被 Web Hand Landmarker 加载和执行。其校验值与原文件相同；未独立验证原模型的来源和许可。
  - 官方模型说明：https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker
- `desktop/` 是用户提供压缩包的原始内容，保留原文件，不在此替原作者声明开源许可。

未为用户的整个项目自动选择开源许可证；如需对外授权，可自行添加合适的 LICENSE。

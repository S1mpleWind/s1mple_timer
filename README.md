# README
**S1mple Timer** 是一个简单的电脑使用计时器桌面应用，主要特点：

**功能：**
- ⏱️ 实时计时器 - 显示用户使用电脑的时间
- 🔔 定时提醒 - 定时弹出系统通知提醒休息眼睛
- 💬 友好提示 - "你已经使用电脑 X min 了，休息一下眼睛，起身走走吧"

**技术栈：**
- **前端：** React 18 + TypeScript + Vite
- **桌面框架：** Electron 28（跨平台桌面应用）
- **构建：** electron-builder（打包为 portable exe）

**特点：**
- 支持系统通知（Electron + Web Notification API 双层支持）
- 安全的进程隔离（contextIsolation + preload 脚本）
- 跨平台（虽然目前配置仅打包 Windows portable 版本）
- 窗口大小为 420×560 像素，轻量级 UI

本质上是一个**健康提醒应用**，适合长期工作的用户定时提醒休息
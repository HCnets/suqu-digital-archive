# 广东省苏区镇数字化档案 (Suqu Town Digital Archive)

## 📌 项目概述
本项目旨在打造一个高精度的广东省苏区镇数字化档案库。通过 **地图点击建模 (Map-Clicking 3D Modeling)** 技术，实现宏观地理信息与微观建筑/历史档案的无缝交互。

---

## 🌟 项目纪年表与版本演进 (Time Tree)
*注：以下纪年表严格遵循时间树规范，只增不减，完整体现版本工程推进及成果。*

### [v0.1.1-alpha] - 2026-05-16
- **版本状态**: 前端工程基座搭建与 3D 交互 Demo 落地
- **工程推进**:
  - 基于 React 18 + Vite 初始化客户端工程 `client/`。
  - 集成 TailwindCSS V4，并深度配置 `liquid-glass` 质感底层工具类。
  - 采用 `@react-three/fiber` 和 `@react-three/drei` 搭建基础 3D 渲染画布与事件系统。
  - 采用 Zustand 进行轻量级状态管理（存储 POI 与档案数据流）。
- **阶段成果**:
  - 完成大一统 Header 组件 (`UnifiedHeader.tsx`)，严格落实 Liquid Glass 返回按钮与大字号流式排版。
  - 完成 MockMap 交互地图，实现 3D 建筑（白模占位）悬停高亮与点击碰撞检测。
  - 点击 3D 建筑弹出磨砂玻璃质感的底层档案面板，支持数据动态映射。

### [v0.1.0-alpha] - 2026-05-16
- **版本状态**: 项目初始化与架构确立阶段
- **工程推进**:
  - 初始化 Git 仓库，建立标准目录结构。
  - 确立核心技术栈：基于 Cesium/Three.js 的 3D WebGIS 方案。
  - 制定 UI 准则：全面采用 Liquid Glass 质感，统一 Header 样式。
- **阶段成果**:
  - 生成首版 README 时间树。
  - 建立 `docs/` 规范文档体系。
- **模型护航**: 
  - UI 架构：Gemini 3.1 Pro Max
  - 核心功能/底层架构：GPT-5.4

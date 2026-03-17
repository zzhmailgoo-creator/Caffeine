# Caffeine Tracker Pro

一个基于 `React + TypeScript + Vite` 构建的咖啡因摄入追踪应用，用来帮助用户记录每日饮品摄入，并估算当前残留、今日累计以及预计回落到休息阈值以下的时间。

这个项目的目标不是做医疗诊断，而是提供一个更清晰、更易用的日常追踪工具。

## Features

- 记录常见饮品摄入，支持自定义饮品与咖啡因含量
- 基于吸收期 + 半衰期衰减的简化模型估算咖啡因变化
- 展示当前估算残留、今日累计摄入、预计回落时间
- 提供未来 24 小时趋势图
- 支持年龄范围、代谢速度、休息阈值等轻量设置
- 使用 `localStorage` 持久化本地数据
- 提供适合本地使用的双击启动脚本 `start-dev.cmd`

## Preview

当前界面风格偏向简洁的健康类工具应用，使用路径为：

1. 先添加一条饮品记录
2. 再查看核心指标变化
3. 最后结合趋势图判断后续影响

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts

## Getting Started

### Requirements

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Run In Development

```bash
npm run dev
```

默认开发地址：

```text
http://127.0.0.1:5173/
```

如果你希望直接双击启动，也可以使用项目根目录下的：

```text
start-dev.cmd
```

当前脚本会固定使用：

```text
http://127.0.0.1:4173/
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Project Structure

```text
.
├─ public/
├─ src/
│  ├─ engine/          # 咖啡因估算逻辑
│  ├─ storage/         # 本地存储读写
│  ├─ types/           # 类型定义
│  ├─ App.tsx          # 主页面
│  ├─ index.css        # 全局样式
│  └─ main.tsx         # 应用入口
├─ Caffeine.md         # 项目计划书
├─ start-dev.cmd       # Windows 双击启动脚本
├─ package.json
└─ README.md
```

## Core Logic

项目使用的是面向消费级产品的简化估算模型，而不是医学级药代动力学模型：

- 摄入后有一个短暂吸收阶段
- 达到峰值后按半衰期逐步衰减
- 多次摄入会叠加计算
- 用户可以通过年龄范围和代谢速度做轻量调整

这意味着结果更适合日常参考，不适合医学判断。

## Product Notes

- “预计回落时间”表示估算值回落到阈值以下的时间
- “当前估算残留”是趋势参考，不代表精确体内浓度
- 不同体质、饮食、睡眠、药物和作息都可能影响实际感受

## Roadmap

- [ ] 编辑已有记录
- [ ] 更完整的历史统计
- [ ] 更完善的 PWA 支持
- [ ] 更细致的移动端交互
- [ ] 图表与页面的性能优化

## License

MIT

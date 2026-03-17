这是一份经过收敛和优化的 **V2.1 可落地版计划书**，目标是在保证科学参考价值的同时，避免把产品做成“看起来很精确、实际上边界模糊”的医学工具。

---

## 咖啡因全天候轨迹追踪器 (Caffeine Tracker Pro) V2.1

### 1. 产品定位

本应用是一款面向日常生活场景的 **咖啡因摄入估算与趋势追踪工具**，帮助用户回答三个问题：

* 我今天一共摄入了多少咖啡因？
* 我当前体内大概还剩多少咖啡因？
* 大概什么时候会降到我设定的休息阈值以下？

**定位边界：**
* 本产品提供的是 **趋势估算**，不是医学诊断工具。
* 所有剂量、代谢速度、阈值判断均应以“参考值”呈现，不应对睡眠、健康风险作绝对承诺。
* 对孕期、特殊用药、心血管疾病、焦虑障碍等用户，应显示简短免责声明，提示在必要时咨询医生。

---

### 2. 核心模型 (Bio-Estimate Engine)

#### 2.1 建模原则
与其追求“医学级精确”，第一版更适合采用 **连续、平滑、易解释** 的估算模型，兼顾真实感与实现成本。

模型目标：
* 摄入后不是瞬间达到峰值，而是有吸收过程
* 随时间逐步代谢衰减
* 支持多次摄入叠加
* 用户能够理解参数含义

#### 2.2 单次摄入模型
对于单次摄入量 $C_i$，摄入时间为 $t_i$，在时间 $t$ 的估算残留量记为 $C_{res}(t)$。

推荐实现为两段但保持视觉平滑：

* **吸收阶段：** 摄入后约 0 到 45 分钟内逐步上升，默认在 30 到 45 分钟附近接近峰值
* **消除阶段：** 达峰后按半衰期进行指数衰减

工程上可使用以下简化方案：

* 当 $0 \le \Delta t < t_{peak}$ 时，采用平滑增长函数逼近吸收过程
* 当 $\Delta t \ge t_{peak}$ 时，采用指数衰减

其中 $\Delta t = t - t_i$，默认：
* $t_{peak} = 0.75h$
* 基础半衰期 $T_{1/2} = 5h$

总残留量：

$$
C(t) = \sum_i C_{res,i}(t)
$$

说明：
* 若开发阶段希望降低复杂度，可以先使用“平滑吸收 + 指数衰减”的近似模型
* 不建议在产品文案里直接展示复杂药代公式，而应突出“这是估算曲线”

#### 2.3 个性化参数策略
个性化应采用 **温和调节**，避免给用户造成“精确医学个体化”的误导。

推荐参数设计如下：

| 模块 | 选项 | 作用 |
| :--- | :--- | :--- |
| **年龄段** | <18 / 18-65 / >65 | 影响默认半衰期建议值 |
| **代谢倾向** | 偏快 / 标准 / 偏慢 | 对半衰期做小幅调整 |
| **高级说明** | 吸烟、避孕药、孕期、药物相互作用 | 仅作说明与提示，不建议首版直接做强乘数 |

推荐默认值：
* `<18`: 4h
* `18-65`: 5h
* `>65`: 6h

代谢倾向修正：
* 偏快：`0.85x`
* 标准：`1.0x`
* 偏慢：`1.2x`

说明：
* 不建议首版直接暴露 `CYP1A2` 等专业术语作为主交互
* 若保留专业内容，可放在“高级设置 / 了解更多”中

---

### 3. 功能模块

#### 3.1 智能饮品库
内置常见饮品的 **默认参考值**，所有项目均可编辑：

* 意式浓缩 (Espresso): 63mg
* 美式咖啡 (Americano): 120mg
* 手冲咖啡 (Pour-over): 150mg
* 红茶: 47mg
* 绿茶: 28mg
* 红牛: 80mg
* 魔爪: 160mg
* 自定义输入: 任意 mg 数值

产品要求：
* 所有默认值都应标明“仅为参考”
* 录入时允许用户修改容量、份数或直接改 mg
* 记录项需支持编辑和删除

#### 3.2 关键指标卡片
首页建议固定展示以下三个核心指标：

* **当前估算残留**
* **今日累计摄入**
* **预计低于休息阈值时间**

文案建议：
* 将“预计可入睡时间”改为 **“预计低于休息阈值时间”**
* 阈值默认 20mg，但允许用户自定义
* 附简短说明：低于阈值不代表一定入睡，只表示咖啡因影响可能减弱

#### 3.3 24 小时代谢图谱
使用图表展示未来 24 小时的估算趋势。

建议：
* 图表步长为 10 分钟
* X 轴显示当前时刻起未来 24 小时，或提供“今日视图 / 未来 24h 视图”切换
* 显示休息阈值参考线
* 不仅显示单点数值，更强调趋势变化

#### 3.4 分级预警
需要区分 **累计摄入预警** 与 **当前残留预警**，不能混为一谈。

建议规则：

* **今日累计摄入**
    * `<200mg`：低到中等
    * `200-400mg`：提示关注
    * `>400mg`：高摄入提醒

* **当前估算残留**
    * 采用渐变提示，而不是绝对“安全/危险”判定
    * 颜色变化用于感知反馈，不应表达医学诊断结论

背景反馈建议：
* 低残留：奶油色 `#FFF8E7`
* 中等残留：浅焦糖色
* 高残留：浅暖红色

#### 3.5 历史记录与复盘
除即时追踪外，建议保留近 7 天或 30 天趋势复盘：

* 每日总摄入
* 最晚一次摄入时间
* 连续高摄入天数

这部分可以作为 V2.1 的增强项，如果开发节奏紧张，可放到第二阶段。

---

### 4. 交互与体验原则

#### 4.1 设计方向
主题建议延续“Cafe Minimalism”，但不要只停留在配色层面，应兼顾可读性与状态感知。

基础视觉方向：
* 背景主色：奶油白 `#FFF8E7`
* 主文字：深棕 `#4B3621`
* 强调色：焦糖棕、橄榄绿或铜金色

深色模式：
* 背景：深烘焙咖啡豆色 `#2B1B10`
* 文字：暖白或浅米色

#### 4.2 体验要求
* 快速录入应在 2 步内完成
* 常见饮品支持一键添加
* 图表、指标、历史记录在移动端优先排版
* 重要参数都应有解释文案，避免用户看不懂“半衰期”“阈值”“残留”

---

### 5. 技术栈与实现架构

#### 5.1 技术栈
* **前端：** React 18 + Tailwind CSS
* **图表：** Chart.js 或 Recharts，优先选择开发效率更高的一种
* **持久化：** `localStorage`
* **离线支持：** PWA 基础能力

#### 5.2 状态与代码结构
不建议把逻辑描述成“靠 `useEffect` 监听 records 重绘”，更推荐分层：

* `records`: 原始摄入记录
* `settings`: 用户设置，如阈值、年龄段、代谢倾向、主题
* `engine`: 纯函数计算层，负责残留估算、阈值预测、图表数据生成
* `storage`: 本地持久化读写

这样做的好处：
* 算法更容易测试
* UI 和计算逻辑解耦
* 后续替换图表库或增加统计功能更轻松

#### 5.3 PWA 范围收敛
V2.1 只承诺以下离线能力：

* 可离线打开应用
* 可离线记录摄入事件
* 可离线查看本地历史与图表

暂不承诺：
* 云同步
* 多设备登录
* 后台推送提醒

---

### 6. 首版范围建议 (MVP)

为避免功能堆叠，建议 MVP 只做以下内容：

* 添加、编辑、删除摄入记录
* 饮品快捷录入 + 自定义 mg
* 当前残留估算
* 今日累计摄入统计
* 未来 24 小时趋势图
* 休息阈值时间预测
* 本地存储
* 移动端适配
* 基础 PWA

可以延后的功能：
* 高级生理参数
* 长期统计报表
* 账户系统
* 多设备同步
* 智能提醒

---

### 7. 文案与风险控制

产品中建议统一使用以下措辞：

* “估算残留” 而不是 “体内准确含量”
* “参考阈值” 而不是 “安全线”
* “预计低于阈值时间” 而不是 “保证可入睡时间”

建议加入简短提示文案：

> 本应用提供咖啡因趋势估算，仅供日常参考，不构成医疗建议。不同体质、药物、作息和健康状况都会影响实际感受。

---

### 8. 开发 Prompt（优化版）

你可以将以下 Prompt 直接发送给 AI 开发工具：

> **Role:** Expert React Developer focused on polished consumer health-style tracking apps.
>
> **Task:** Build "Caffeine Tracker Pro V2.1" as a caffeine intake estimation app for daily lifestyle use.
>
> **Product principles:**
> - This is a consumer estimation tool, not a medical app.
> - Use language like "estimated remaining caffeine", "reference threshold", and "estimated time below threshold".
> - Keep the UI warm, elegant, and mobile-friendly.
>
> **Core features:**
> - Let users add, edit, and delete caffeine intake records.
> - Provide quick-add drink presets and allow fully custom mg input.
> - Show:
>   1. estimated current remaining caffeine
>   2. total caffeine consumed today
>   3. estimated time when caffeine drops below a user-defined rest threshold
> - Render a 24-hour trend chart.
> - Persist records and settings in localStorage.
> - Make the app PWA-ready for offline local usage.
>
> **Modeling guidance:**
> - Use a smooth absorption phase followed by exponential elimination.
> - Default peak time: about 45 minutes after intake.
> - Default half-life: 5 hours.
> - Allow light personalization by age range and metabolism tendency (fast / normal / slow).
> - Do not present the model as medically exact.
>
> **Tech guidance:**
> - Use React 18 and Tailwind CSS.
> - Separate calculation logic into pure utility functions.
> - Keep state structure clean: records, settings, derived metrics.
> - Build a responsive UI for both desktop and mobile.
>
> **Visual direction:**
> - Theme: Cafe Minimalism.
> - Light mode: cream background, deep brown typography, caramel accents.
> - Dark mode: roasted coffee bean palette.
> - Use subtle background changes to reflect low / medium / high estimated caffeine levels.

---

### 9. 一句话总结

V2.1 的核心思想是：**把“看起来很专业但容易失真”的方案，收敛成“用户能理解、开发能落地、结果有参考价值”的版本。**

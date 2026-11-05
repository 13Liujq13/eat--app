Eat-N-Split · 聚餐账单分摊助手

> 一个用 React 19 编写的轻量级「AA 制账单分摊」Web 应用 —— 添加好友、录入账单、一键结算，自动算出「谁欠谁多少钱」。

[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Create React App](https://img.shields.io/badge/CRA-5.0.1-09D3AC?logo=create-react-app&logoColor=white)](https://create-react-app.dev/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#license)

---

## 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [快速开始](#快速开始)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [核心实现思路](#核心实现思路)
- [已知限制](#已知限制)
- [后续规划](#后续规划)

---

## 项目简介

和朋友一起吃饭、打车、旅行时，最麻烦的往往不是花钱，而是**事后算账**：这顿饭谁付的、每人该摊多少、上次谁还欠我一笔……靠聊天记录和心算很容易乱，也容易伤感情。

**Eat-N-Split** 把这件事做成一个纯前端的单页应用：左侧维护好友列表并实时显示每个人的应收应付余额，右侧选中好友后即可录入账单并选择「谁付款」，提交后余额自动结算、界面上用红/绿色一眼区分「我欠你」还是「你欠我」。

项目没有后端、没有登录、没有数据库，打开即用，适合作为 React 状态管理与组件通信的练习项目，也可以作为一个真实可用的记账小工具。

## 功能特性


| 功能           | 说明                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| 👥 好友管理    | 通过姓名 + 头像 URL 添加好友，使用`crypto.randomUUID()` 生成全局唯一 `id`                             |
| 💰 余额看板    | 每位好友实时显示净余额：`< 0` 红色「You owe …」，`> 0` 绿色「… owes you」，`= 0` 提示「双方已结清」 |
| 🧾 账单分摊    | 输入账单总额与本人支出，自动计算好友应摊金额（只读派生字段）                                          |
| 🔀 付款人切换  | 通过下拉框选择「我买单」或「好友买单」，决定余额的正负方向                                            |
| ✅ 即时结算    | 提交后原地更新对应好友的`balance`，并自动关闭分摊表单                                                 |
| 🎯 选中态互斥  | 点击已选中的好友会取消选中（`cur?.id === friend.id ? null : friend`），同一时刻只展开一个分摊表单     |
| 🎨 纯 CSS 布局 | 用 CSS Grid 搭建双栏结构，CSS 自定义属性统一管理主题色，`62.5%` 根字号方便 `rem` 换算                 |

## 快速开始

环境要求：**Node.js ≥ 18**（React 19 + CRA 5 需要较新的 Node 版本）。

```bash
# 1. 克隆仓库
git clone https://github.com/13Liujq13/eat--app.git
cd eat--app

# 2. 安装依赖
npm install

# 3. 启动开发服务器（默认 http://localhost:3000）
npm start
```

其他可用脚本：

```bash
npm run build   # 生产构建，产物输出到 build/
npm test        # 以交互模式运行测试（Jest + Testing Library）
npm run eject   # ⚠️ 不可逆，不推荐
```

> 提示：`--host` 模式下端口会被占用时，CRA 会自动询问是否切换到其他端口。

## 技术栈


| 分类       | 选型                                                                     |
| ---------- | ------------------------------------------------------------------------ |
| 框架       | React 19.1（函数组件 + Hooks）                                           |
| 构建工具   | Create React App 5.0.1（`react-scripts`，内置 Webpack / Babel / ESLint） |
| 样式       | 原生 CSS（CSS 变量、Grid、Flexbox），无 UI 组件库                        |
| 测试       | `@testing-library/react` + `jest-dom` + `user-event`                     |
| 运行时 API | `crypto.randomUUID()`、`useState`                                        |

依赖极简：除 React 本体外只有 CRA 工具链与测试库，没有路由、没有状态管理库、没有请求库 —— 所有状态都由 `useState` 在组件树内管理。

## 项目结构

```text
eat--app/
├── public/
│   ├── index.html        # HTML 模板，#root 挂载点
│   ├── manifest.json     # PWA 清单（当前仍为 CRA 默认值）
│   └── favicon.ico / logo192.png / logo512.png
├── src/
│   ├── index.js          # 应用入口，createRoot 渲染 <App />
│   ├── index.css         # 全局样式：CSS 变量、Grid 双栏布局、表单样式
│   ├── App.js            # 根组件：好友列表 + 选中逻辑 + 余额结算
│   └── component/
│       ├── FormAddFriend.js   # 添加好友表单（受控组件）
│       └── FormSplitBill.js   # 账单分摊表单（受控组件 + 派生状态）
├── package.json
└── .gitignore
```

> 说明：组件文件统一放在非标准的 `component/` 目录下（通常约定为 `components/`），如需团队协作可顺手改名。

## 核心实现思路

1. **状态提升（Lifting State Up）**
   好友数组 `addFriend`、当前选中好友 `selectedFriend`、表单显隐 `showAddFriend` 三个状态全部集中在 `App` 中；子组件只负责展示或通过回调向上冒泡事件。
2. **派生状态而非冗余存储**
   好友应摊金额不单独存 `useState`，而是直接由账单总额与本人支出计算：

   ```js
   const payByFriend = bill ? bill - payByUser : "";
   ```
   少一份状态就少一次同步风险。
3. **不可变更新**
   结算时不修改原对象，而是用 `map` 生成新数组，只替换命中的那一项：

   ```js
   setAddFriend(friends =>
     friends.map(f =>
       f.id === selectedFriend.id ? { ...f, balance: f.balance + value } : f
     )
   );
   ```
4. **受控组件**
   两个表单的所有输入都是 `value` + `onChange` 受控，提交前做非空校验，提交后重置为初始值。
5. **余额方向由「谁付款」决定**
   `onSplitBill(whoIsPaying === "user" ? payByFriend : -payByUser)` —— 我付款则好友欠我（余额加上好友摊的那份）；好友付款则我欠好友（余额减去我该摊的那份）。

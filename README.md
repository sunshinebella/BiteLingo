# BiteLingo · 碎片学英语

> Bite by Bite, Speak Fluently. —— 给电商交易 / 中台 QA 的碎片化英语学习工具。

一个**纯前端、零后端、零依赖**的单页应用，面向「每天 15–20 分钟碎片时间学英语」的真实场景：全球客户站会、缺陷复盘、发布 go/no-go、API 契约对齐。内置语料全部取自电商 QA 的真实战场，不是旅游英语。

**在线地址**：https://fragment-english.app.workbuddy.host/?sharecode=L3CGKK3RXJ

---

## 功能

| 模块 | 说明 |
|---|---|
| 词汇卡 | 40 词按「会议沟通 / 电商业务 / 技术 QA / 发布部署」分类；Leitner 间隔重复（记得升盒、不记得重置）；banner 正面显示单词 + 音标 + 中文释义，点分类词可自助查词 |
| 听力跟读 | 20 句高频会议句；美式 / 英式可切、音色可选且按名字稳定回找；连播用 `onend` 事件链逐句播放（不掐句） |
| 口语评测 | 麦克风录音 + 回放；有语音识别环境按词覆盖率打分并标注漏读词，无识别环境降级为「录音回放 + 自评」 |
| 场景对话 | 3 段真实会议对话（站会 / 缺陷复盘 / 发布评审），逐句连播 + 当前句高亮 |
| 阅读 | 场景短文，术语高亮；句中难点词可点查 IPA 音标；全文朗读支持随时停止 |
| 写作 | 每日 prompt 日记，本地留存历史 |
| 打卡 | 逐日日期记录 + 当月日历 + 连续天数 streak |
| 进度 | 掌握度、跟读量、写作篇数、口语评测数统计；数据导出 / 导入 JSON 跨设备合并 |
| 发音 | 按口音优先挑高质量音色（Google / Apple / Microsoft 神经嗓音），选不到逐级降级 |

## 技术栈

- 原生 HTML / CSS / JavaScript（无框架、无构建步骤、无 npm 依赖）
- `localStorage` 持久化（按「源 + 浏览器」隔离）
- Web Speech API（TTS + SpeechRecognition）、MediaRecorder（录音）
- PWA：`manifest.webmanifest` + Service Worker（network-first，可离线打开）

## 本地运行

麦克风与 Service Worker 需要安全上下文，建议起本地服务而不是双击 `file://`：

```bash
cd "/Users/bella/WorkBuddy/碎片学英语"
python3 -m http.server 8000
# 打开 http://localhost:8000
```

## 目录结构

```
index.html                应用壳（8 个视图 + 底部导航）
styles.css                light 主题，移动端优先
data.js                   全部语料：词汇 / 跟读句 / 场景 / 短文 / 写作 prompt / 计划 / 音标词典
app.js                    全部逻辑：存储、语音引擎、录音评测、渲染、日历
manifest.webmanifest      PWA 清单
sw.js                     Service Worker（network-first，离线回退）
CHANGELOG.md              类型化变更记录
```

**加词 / 加场景只改 `data.js`**，不用碰逻辑。

## 数据与备份

数据存在浏览器 `localStorage`，PC 与手机各自独立（不同存储桶）。跨设备用「进度 → 数据备份 → 导出 / 导入 JSON」手动合并，零账号、零后端。

> 注意：WorkBuddy 预览面板是沙箱 iframe，禁用 `localStorage` 与麦克风。请用真实浏览器 / 手机原生浏览器打开线上链接。

## 分支与变更约定

- `main`：可发布的稳定版；`develop`：日常修复与新功能
- 每次改动必须打类型标签并写入 `CHANGELOG.md`：
  `[缺陷修复]` / `[优化增强]` / `[新需求]` / `[文档记录]`，带日期与精确到秒的时间

## 作者

**Bella**（[@sunshinebella](https://github.com/sunshinebella)）—— 电商交易 / 中台 QA，10+ 年测试经验。

- 仓库：https://github.com/sunshinebella/BiteLingo
- 线上：https://sunshinebella.github.io/BiteLingo/
- 本项目为个人学习工具，语料取自真实工作场景（站会、缺陷复盘、发布 go/no-go、API 契约）。

## 许可

个人学习工具，未附开源许可。如需引用语料或代码，请先联系作者。

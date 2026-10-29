/* 碎片学英语 - 种子语料库
 * 内容域：电商交易 / 中台 QAQC / 全球客户开会场景
 * 全部为真实工作语料，可按需增删（改这里即可，无需动逻辑）
 */
const SEED = {
  // ===== 词汇：四类，覆盖会议/业务/技术QA/发布 =====
  vocab: [
    // 会议沟通
    { word: "standup", phonetic: "/ˈstændʌp/", pos: "n.", cat: "会议沟通", meaning: "站会（每日短时同步会）", ex: "We have a daily standup at 9 AM.", zh: "我们每天早上 9 点开站会。" },
    { word: "sync", phonetic: "/sɪŋk/", pos: "n./v.", cat: "会议沟通", meaning: "对齐、同步沟通", ex: "Let's sync on the API contract tomorrow.", zh: "我们明天对齐一下 API 契约。" },
    { word: "blocker", phonetic: "/ˈblɒkər/", pos: "n.", cat: "会议沟通", meaning: "阻碍项、卡点", ex: "Any blockers for today's release?", zh: "今天的发布有什么卡点吗？" },
    { word: "action item", phonetic: "/ˈækʃən ˈaɪtəm/", pos: "n.", cat: "会议沟通", meaning: "行动项、待办", ex: "I'll take this action item and follow up.", zh: "这个行动项我来跟。" },
    { word: "retrospective", phonetic: "/ˌretrəˈspektɪv/", pos: "n.", cat: "会议沟通", meaning: "复盘会（回顾会）", ex: "The sprint retrospective is on Friday.", zh: "冲刺复盘会在周五。" },
    { word: "align", phonetic: "/əˈlaɪn/", pos: "v.", cat: "会议沟通", meaning: "对齐（目标/认知）", ex: "We need to align on priorities.", zh: "我们需要对一下优先级。" },
    { word: "follow-up", phonetic: "/ˈfɒləʊ ʌp/", pos: "n.", cat: "会议沟通", meaning: "跟进", ex: "I'll send a follow-up after the call.", zh: "会后我会发跟进。" },
    { word: "bandwidth", phonetic: "/ˈbændwɪdθ/", pos: "n.", cat: "会议沟通", meaning: "（时间/精力）余量", ex: "Do you have bandwidth for this task?", zh: "你这边有精力做这个吗？" },
    { word: "circle back", phonetic: "/ˈsɜːkl bæk/", pos: "phr.", cat: "会议沟通", meaning: "回头再谈、稍后跟进", ex: "Let's circle back to this offline.", zh: "这个我们线下再回头聊。" },
    { word: "deep dive", phonetic: "/diːp daɪv/", pos: "n.", cat: "会议沟通", meaning: "深入剖析", ex: "We need a deep dive into the flaky tests.", zh: "我们需要深挖一下不稳定测试。" },

    // 电商业务
    { word: "onboarding", phonetic: "/ˈɒnbɔːdɪŋ/", pos: "n.", cat: "电商业务", meaning: "用户/商家入驻引导", ex: "The onboarding flow has a drop-off.", zh: "入驻流程有流失。" },
    { word: "checkout", phonetic: "/ˈtʃekaʊt/", pos: "n.", cat: "电商业务", meaning: "结算（下单支付环节）", ex: "Checkout latency spiked during flash sale.", zh: "大促时结算延迟飙升。" },
    { word: "cart", phonetic: "/kɑːt/", pos: "n.", cat: "电商业务", meaning: "购物车", ex: "Cart abandonment rate is too high.", zh: "购物车放弃率太高了。" },
    { word: "conversion", phonetic: "/kənˈvɜːʃn/", pos: "n.", cat: "电商业务", meaning: "转化（率）", ex: "We improved conversion by 8%.", zh: "我们把转化率提升了 8%。" },
    { word: "SKU", phonetic: "/ˈskjuː/", pos: "n.", cat: "电商业务", meaning: "库存量单位（商品编码）", ex: "How many SKUs are affected?", zh: "影响多少个 SKU？" },
    { word: "inventory", phonetic: "/ˈɪnvəntri/", pos: "n.", cat: "电商业务", meaning: "库存", ex: "Inventory sync is delayed by 5 minutes.", zh: "库存同步延迟了 5 分钟。" },
    { word: "fulfillment", phonetic: "/fʊlˈfɪlmənt/", pos: "n.", cat: "电商业务", meaning: "履约（发货配送）", ex: "Fulfillment SLA was breached.", zh: "履约 SLA 被突破了。" },
    { word: "refund", phonetic: "/ˈriːfʌnd/", pos: "n./v.", cat: "电商业务", meaning: "退款", ex: "The refund pipeline failed silently.", zh: "退款链路静默失败了。" },
    { word: "coupon", phonetic: "/ˈkuːpɒn/", cat: "电商业务", pos: "n.", meaning: "优惠券", ex: "Coupon discount wasn't applied at checkout.", zh: "结算时优惠券没生效。" },
    { word: "lead time", phonetic: "/liːd taɪm/", pos: "n.", cat: "电商业务", meaning: "前置时长、交付周期", ex: "Lead time for this report is 2 days.", zh: "这份报告的交付周期是 2 天。" },

    // 技术QA
    { word: "flaky test", phonetic: "/ˈfleɪki test/", pos: "n.", cat: "技术QA", meaning: "不稳定/偶发失败测试", ex: "Flaky tests hurt CI trust.", zh: "不稳定测试损害 CI 可信度。" },
    { word: "regression", phonetic: "/rɪˈɡreʃn/", pos: "n.", cat: "技术QA", meaning: "回归（缺陷复现/功能退化）", ex: "This is a checkout regression.", zh: "这是结算的回归缺陷。" },
    { word: "edge case", phonetic: "/edʒ keɪs/", pos: "n.", cat: "技术QA", meaning: "边界/极端场景", ex: "We missed an edge case in pagination.", zh: "我们漏了分页的一个边界场景。" },
    { word: "reproduce", phonetic: "/ˌriːprəˈdjuːs/", pos: "v.", cat: "技术QA", meaning: "复现（缺陷）", ex: "Can you reproduce it on staging?", zh: "你能在预发环境复现吗？" },
    { word: "severity", phonetic: "/sɪˈverəti/", pos: "n.", cat: "技术QA", meaning: "严重级别", ex: "We flagged it as Sev-1.", zh: "我们把它标为一级故障。" },
    { word: "test coverage", phonetic: "/test ˈkʌvərɪdʒ/", pos: "n.", cat: "技术QA", meaning: "测试覆盖率", ex: "Coverage on the order API is 82%.", zh: "订单接口覆盖率 82%。" },
    { word: "API contract", phonetic: "/ˈeɪpiːaɪ ˈkɒntrækt/", pos: "n.", cat: "技术QA", meaning: "接口契约", ex: "The API contract changed without notice.", zh: "接口契约悄悄改了。" },
    { word: "stub", phonetic: "/stʌb/", pos: "n.", cat: "技术QA", meaning: "打桩（替身响应）", ex: "We stub the payment gateway in CI.", zh: "CI 里我们对支付网关打桩。" },
    { word: "mock", phonetic: "/mɒk/", pos: "n./v.", cat: "技术QA", meaning: "Mock（模拟依赖）", ex: "Mock the inventory service.", zh: "把库存服务 mock 掉。" },
    { word: "pipeline", phonetic: "/ˈpaɪplaɪn/", pos: "n.", cat: "技术QA", meaning: "流水线（CI/CD）", ex: "The pipeline is red again.", zh: "流水线又红了。" },

    // 发布部署
    { word: "rollout", phonetic: "/ˈrəʊlaʊt/", pos: "n.", cat: "发布部署", meaning: "灰度/逐步发布", ex: "We're doing a 5% rollout first.", zh: "我们先做 5% 灰度。" },
    { word: "rollback", phonetic: "/ˈrəʊlbæk/", pos: "n.", cat: "发布部署", meaning: "回滚", ex: "We triggered an immediate rollback.", zh: "我们立即触发了回滚。" },
    { word: "go-live", phonetic: "/ɡəʊ laɪv/", pos: "n.", cat: "发布部署", meaning: "上线、正式生效", ex: "Go-live is scheduled for Thursday.", zh: "上线定在周四。" },
    { word: "staging", phonetic: "/ˈsteɪdʒɪŋ/", pos: "n.", cat: "发布部署", meaning: "预发/准生产环境", ex: "Verified on staging, not prod.", zh: "在预发验证过，不是生产。" },
    { word: "canary", phonetic: "/kəˈneəri/", pos: "n.", cat: "发布部署", meaning: "金丝雀发布", ex: "Canary looks healthy so far.", zh: "金丝雀目前看着健康。" },
    { word: "hotfix", phonetic: "/ˈhɒtfɪks/", pos: "n.", cat: "发布部署", meaning: "热修复", ex: "We shipped a hotfix for the coupon bug.", zh: "我们发了个热修修优惠券 bug。" },
    { word: "deploy", phonetic: "/dɪˈplɔɪ/", pos: "v.", cat: "发布部署", meaning: "部署", ex: "Don't deploy on Friday.", zh: "周五别部署。" },
    { word: "incident", phonetic: "/ˈɪnsɪdənt/", pos: "n.", cat: "发布部署", meaning: "线上故障/事件", ex: "We declared a Sev-2 incident.", zh: "我们定级为二级故障。" },
    { word: "postmortem", phonetic: "/ˌpəʊstˈmɔːtəm/", pos: "n.", cat: "发布部署", meaning: "事故复盘（尸检）", ex: "The postmortem is due tomorrow.", zh: "事故复盘明天要出。" },
    { word: "sign-off", phonetic: "/ˈsaɪn ɒf/", pos: "n.", cat: "发布部署", meaning: "签字放行、批准", ex: "We need QA sign-off before go-live.", zh: "上线前需要 QA 放行。" }
  ],

  // ===== 听力跟读句（TTS 朗读 + 影子跟读）=====
  shadow: [
    { cat: "会议沟通", en: "Could you walk me through the test results?", zh: "你能带我过一遍测试结果吗？" },
    { cat: "会议沟通", en: "Let's align on the release plan before the call.", zh: "开会前我们先对齐一下发布计划。" },
    { cat: "会议沟通", en: "I'll take this action item and follow up by EOD.", zh: "这个行动项我来跟，今天下班前回复。" },
    { cat: "会议沟通", en: "Can we circle back to this offline?", zh: "这个我们线下再回头聊可以吗？" },
    { cat: "会议沟通", en: "Do you have bandwidth to pick this up this week?", zh: "你这周有精力接这个吗？" },
    { cat: "技术QA", en: "We found a regression in the checkout flow.", zh: "我们在结算流程发现一个回归缺陷。" },
    { cat: "技术QA", en: "This is a flaky test, not a real failure.", zh: "这是不稳定的测试，不是真失败。" },
    { cat: "技术QA", en: "Can you reproduce it on staging?", zh: "你能在预发环境复现吗？" },
    { cat: "技术QA", en: "The API contract changed without notice.", zh: "接口契约悄悄改了。" },
    { cat: "技术QA", en: "Test coverage on the order API is eighty-two percent.", zh: "订单接口覆盖率是 82%。" },
    { cat: "发布部署", en: "We're doing a five percent rollout first.", zh: "我们先做 5% 灰度。" },
    { cat: "发布部署", en: "We triggered an immediate rollback.", zh: "我们立即触发了回滚。" },
    { cat: "发布部署", en: "We need QA sign-off before go-live.", zh: "上线前需要 QA 放行。" },
    { cat: "发布部署", en: "The canary looks healthy so far.", zh: "金丝雀目前看着健康。" },
    { cat: "电商业务", en: "Checkout latency spiked during the flash sale.", zh: "大促时结算延迟飙升了。" },
    { cat: "电商业务", en: "The coupon discount wasn't applied at checkout.", zh: "结算时优惠券没生效。" },
    { cat: "电商业务", en: "How many SKUs are affected by this bug?", zh: "这个 bug 影响多少个 SKU？" },
    { cat: "电商业务", en: "Inventory sync was delayed by five minutes.", zh: "库存同步延迟了 5 分钟。" },
    { cat: "电商业务", en: "Cart abandonment rate is higher than last month.", zh: "购物车放弃率比上个月高了。" },
    { cat: "电商业务", en: "Fulfillment SLA was breached this morning.", zh: "今天早上履约 SLA 被突破了。" }
  ],

  // ===== 场景对话（可逐句听 + 看中文）=====
  scenarios: [
    {
      title: "Daily Standup 每日站会",
      lines: [
        { who: "You", en: "Yesterday I finished the checkout API automation.", zh: "昨天我完成了结算接口自动化。" },
        { who: "Peer", en: "Nice. Any blockers for today?", zh: "漂亮。今天有卡点吗？" },
        { who: "You", en: "The coupon stub is flaky in CI, still investigating.", zh: "优惠券打桩在 CI 里不稳定，还在查。" },
        { who: "Lead", en: "Got it. Let's sync after standup on that.", zh: "了解。站会后我们对一下这个。" }
      ]
    },
    {
      title: "Bug Triage 缺陷复盘会",
      lines: [
        { who: "You", en: "We found a Sev-2 regression in the order flow.", zh: "我们在订单流程发现一个二级回归缺陷。" },
        { who: "Dev", en: "Can you reproduce it on staging?", zh: "你能在预发复现吗？" },
        { who: "You", en: "Yes, it happens on the empty-cart edge case.", zh: "能，空购物车这个边界场景会触发。" },
        { who: "Lead", en: "Let's hotfix and add a regression test.", zh: "我们热修一下，并补一个回归测试。" }
      ]
    },
    {
      title: "Release Go / No-Go 上线评审",
      lines: [
        { who: "PM", en: "Are we good to go-live on Thursday?", zh: "周四上线没问题吧？" },
        { who: "You", en: "Test coverage is eighty-two percent, no open Sev-1s.", zh: "覆盖率 82%，没有未关闭的一级问题。" },
        { who: "You", en: "But we still need QA sign-off on the rollout plan.", zh: "但灰度方案还需要 QA 放行。" },
        { who: "PM", en: "Approved. Start with a five percent canary.", zh: "批准。先 5% 金丝雀。" }
      ]
    }
  ],

  // ===== 阅读短文（术语高亮）=====
  readings: [
    {
      title: "Sprint Retrospective 冲刺复盘",
      level: "B1",
      terms: ["retrospective", "action item", "flaky test", "regression"],
      text: "In our last sprint retrospective, the team agreed on three action items. First, we must reduce flaky tests in the checkout pipeline because they break trust in CI. Second, every regression found in production needs a dedicated test so it never returns. Third, we will sync daily on release risks. The goal is simple: ship faster with fewer surprises."
    },
    {
      title: "Incident Postmortem 故障复盘",
      level: "B2",
      terms: ["incident", "rollback", "canary", "postmortem", "sign-off"],
      text: "A Sev-2 incident hit the order API after a Thursday deploy. The canary looked healthy, but a hidden edge case surfaced under real traffic. We triggered an immediate rollback and restored service in twelve minutes. The postmortem showed we skipped QA sign-off on the coupon change. Next time, no deploy without sign-off."
    }
  ],

  // ===== 写作 Prompt（每日一题）=====
  prompts: [
    "用 3 句话介绍你本周测过的一个功能。",
    "写 3 个你下次全球同步会想问的问题（英文）。",
    "Describe a bug you found this week in English.",
    "写一封简短邮件，向全球客户同步一个发布延期。",
    "用英语列出今天站会你要说的 3 件事。",
    "Explain what 'rollback' means to a non-technical stakeholder.",
    "写一段你负责的测试模块的英文简介。",
    "Draft a Slack message reporting a Sev-1 incident.",
    "用英语描述你如何复现一个偶发失败（flaky test）。",
    "写 2 条你给团队的‘上线前检查清单’英文版。",
    "Summarize this week's QA progress in 5 bullet points (English).",
    "写一封请全球同事 review 你测试报告的英文邮件。",
    "用英语解释为什么‘周五不部署’是个好规则。",
    "Describe your ideal definition of 'done' for a test task."
  ],

  // ===== 4 周碎片化学习计划 =====
  plan: {
    weekly: [
      {
        week: "第 1 周 · 建习惯 + 会议地基",
        goal: "把‘每天打开 App 打卡’变成肌肉记忆；掌握 10 个最高频会议词。",
        daily: "打卡 1 分钟 + 词汇 5 分钟（10 个新词）+ 跟读 3 句 5 分钟",
        focus: ["词汇：会议沟通 10 词", "跟读：会议沟通句式", "习惯：连续 7 天打卡"]
      },
      {
        week: "第 2 周 · 场景开口 + 技术词汇",
        goal: "能跟读并复述会议场景；补齐技术 QA / 发布部署词汇。",
        daily: "打卡 1 分钟 + 场景对话 1 段 7 分钟 + 词汇/跟读 7 分钟",
        focus: ["场景：站会 / 缺陷复盘", "词汇：技术QA + 发布部署", "跟读：技术句式"]
      },
      {
        week: "第 3 周 · 阅读输入 + 写作起步",
        goal: "能读懂短文并划出术语；开始每天写 1 段英文。",
        daily: "打卡 1 分钟 + 阅读 1 篇 7 分钟 + 写作 1 题 7 分钟",
        focus: ["阅读：复盘 / 故障短文", "写作：每日 prompt 日记", "词汇复习（间隔重复）"]
      },
      {
        week: "第 4 周 · 综合输出 + 模拟会议",
        goal: "能就一个测试话题做 1 分钟英文口头陈述；写作成习惯。",
        daily: "打卡 1 分钟 + 模拟陈述 5 分钟 + 写作/阅读 9 分钟",
        focus: ["说：1 分钟 mock standup", "写：邮件 / 报告片段", "全量词汇轮一轮"]
      }
    ],
    rhythm: [
      "通勤 5 分钟：跟读 3 句，影子练习（听→默→说）。",
      "午休 5 分钟：刷 10 个词汇卡，会的过、不会的标。",
      "睡前 5 分钟：写 1 题 / 读 1 段，打卡收尾。",
      "周末 15 分钟：回看本周写作 + 模拟一次 1 分钟会议发言。"
    ],
    rules: [
      "每天 ≤20 分钟，碎片化就行，别攒到周末补。",
      "打卡连续天数比单次时长重要——断了就从 1 重新来，不焦虑。",
      "说不出整句就先跟读；输入够了，输出自然来。",
      "真实会议前，用‘场景’模块预热对应话术。"
    ]
  },
  // 重点 / 难点词音标（词汇卡音标会自动并入；此处补跟读/场景/阅读里的高频专业词）
  phonetics: {
    "walk": "/wɔːk/", "through": "/θruː/", "results": "/rɪˈzʌlts/", "agreed": "/əˈɡriːd/",
    "investigating": "/ɪnˈvestɪɡeɪtɪŋ/", "surface": "/ˈsɜːrfɪs/", "restore": "/rɪˈstɔːr/", "service": "/ˈsɜːrvɪs/",
    "hidden": "/ˈhɪdn/", "traffic": "/ˈtræfɪk/", "skipped": "/skɪpt/", "review": "/rɪˈvjuː/",
    "risk": "/rɪsk/", "ship": "/ʃɪp/", "surprises": "/sərˈpraɪzɪz/", "healthy": "/ˈhelθi/",
    "approved": "/əˈpruːvd/", "discuss": "/dɪˈskʌs/", "found": "/faʊnd/", "morning": "/ˈmɔːrnɪŋ/",
    "higher": "/ˈhaɪər/", "delayed": "/dɪˈleɪd/", "minutes": "/ˈmɪnɪts/", "twelve": "/twelv/",
    "fewer": "/ˈfjuːər/", "faster": "/ˈfæstər/", "triage": "/ˈtriːɑːʒ/",
    "flaky": "/ˈfleɪki/", "edge": "/edʒ/", "action": "/ˈækʃən/", "circle": "/ˈsɜːrkl/", "dive": "/daɪv/", "contract": "/ˈkɑːntrækt/"
  }
};

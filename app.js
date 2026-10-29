/* 碎片学英语 - 应用逻辑（纯前端 / localStorage）
 * 习惯锚 + 四技能：听/说/读/写 + 词汇间隔重复
 */
(function () {
  "use strict";

  // ---------- 基础工具 ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  // 版本号唯一来源：发版只改这一处（标签名与 CHANGELOG 对齐）
  const APP_VERSION = "1.0.6";
  const REPO_URL = "https://github.com/sunshinebella/BiteLingo";
  const KEY = {
    streak: "eng_streak_v1",
    vocab: "eng_vocab_v1",
    writing: "eng_writing_v1",
    daily: "eng_daily_v1",
    listened: "eng_listened_v1",
    progress: "eng_progress_v1",
    speak: "eng_speak_v1",
    checkinLog: "eng_checkin_log_v1"
  };
  const load = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 沙箱/隐私模式禁止存储时静默失败，不阻断按钮交互 */ } };
  // 探测本地存储是否可用（沙箱 iframe / 隐私模式会禁用）
  let STORAGE_OK = true;
  try { localStorage.setItem("__eng_probe", "1"); localStorage.removeItem("__eng_probe"); } catch (e) { STORAGE_OK = false; }
  // 日期一律用本地时区（toISOString 是 UTC，北京时间 0:00-8:00 会把"今天"算成昨天）
  const fmtDate = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  const todayStr = () => fmtDate(new Date());
  const dateAdd = (str, days) => { const d = new Date(str + "T00:00:00"); d.setDate(d.getDate() + days); return fmtDate(d); };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("show"), 1800);
  }

  // ---------- 语音朗读：标准美式/英式 + 可选音色（稳定）----------
  const HAS_TTS = "speechSynthesis" in window;
  KEY.voice = "eng_voice_v1";
  let playChain = null; // 连播控制器：调用即停止当前连播链
  // 各口音优先选用的高质量音色（按浏览器/系统实际命名匹配）
  const VOICE_PREF = {
    "en-US": ["Google US English", "Samantha", "Microsoft Aria Online (Natural) - English (United States)", "Microsoft David - English (United States)", "Alex", "Victoria", "Karen"],
    "en-GB": ["Google UK English", "Daniel", "Microsoft Libby Online (Natural) - English (United Kingdom)", "Microsoft George - English (United Kingdom)", "Arthur", "Victoria"]
  };
  let currentVoice = null;     // 已解析的 SpeechSynthesisVoice 对象（缓存）
  function getVoiceState() { return load(KEY.voice, { accent: "en-US", name: null }); }
  function allVoices() { return HAS_TTS ? speechSynthesis.getVoices() : []; }
  const normLang = (l) => (l || "").replace(/[_]/g, "-").toLowerCase();
  function bestVoice(accent) {
    const vs = allVoices();
    if (!vs.length) return null;
    const acc = (accent || "en-US").toLowerCase();
    const pref = VOICE_PREF[accent] || VOICE_PREF["en-US"];
    for (const n of pref) {
      const f = vs.find(v => v.name === n && normLang(v.lang) === acc);
      if (f) return f;
    }
    // 退而求其次：同口音任意音色
    const same = vs.find(v => normLang(v.lang) === acc);
    if (same) return same;
    // 再退：任意英文音色
    return vs.find(v => /^en/i.test(v.lang)) || vs[0];
  }
  function resolveVoice() {
    const st = getVoiceState();
    const vs = allVoices();
    // 1) 用已保存的名字精确匹配（保证跨会话稳定）
    if (st.name) {
      const byName = vs.find(v => v.name === st.name);
      if (byName) { currentVoice = byName; return byName; }
    }
    // 2) 按口音挑最佳
    const v = bestVoice(st.accent);
    currentVoice = v;
    // 同步保存，避免下次再猜
    if (v) save(KEY.voice, { accent: st.accent, name: v.name });
    return v;
  }
  if (HAS_TTS) {
    resolveVoice();
    speechSynthesis.onvoiceschanged = () => { resolveVoice(); if (typeof renderVoiceCard === "function") renderVoiceCard(); };
  }
  // 构造一条朗读（不取消其他语音，供连播链复用）
  function speakRaw(text) {
    const st = getVoiceState();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = st.accent || "en-US";
    u.rate = 0.9; u.pitch = 1; u.volume = 1;
    const v = resolveVoice();
    if (v) u.voice = v;
    return u;
  }
  // 单击朗读：打断连播并取消当前播放，再读这一句
  function speak(text) {
    if (!HAS_TTS) { toast("当前浏览器不支持朗读"); return; }
    if (playChain) playChain();
    speechSynthesis.cancel();
    speechSynthesis.speak(speakRaw(text));
  }
  // 逐句连播：上一句 onend 后才读下一句 + 句间停顿，保证不读断、可随时停止
  function sequentialSpeak(items, pauseMs, onEach, onDone) {
    if (!HAS_TTS) { toast("当前浏览器不支持朗读"); return; }
    if (playChain) playChain();
    let idx = 0, cancelled = false;
    const finish = () => { playChain = null; if (onDone) onDone(); };
    const step = () => {
      if (cancelled) return;
      if (idx >= items.length) { finish(); return; }
      if (onEach) onEach(idx);
      const u = speakRaw(items[idx]);
      u.onend = () => { if (cancelled) return; idx++; if (idx < items.length) setTimeout(step, pauseMs); else finish(); };
      u.onerror = () => { if (cancelled) return; idx++; if (idx < items.length) setTimeout(step, pauseMs); else finish(); };
      speechSynthesis.speak(u);
    };
    playChain = () => { cancelled = true; speechSynthesis.cancel(); finish(); };
    step();
  }
  // 列出某口音下的可选音色（供下拉框）
  function voicesForAccent(accent) {
    const acc = (accent || "en-US").toLowerCase();
    return allVoices().filter(v => normLang(v.lang) === acc).sort((a, b) => a.name.localeCompare(b.name));
  }

  // ---------- 音标点词查阅 ----------
  const PHON = Object.assign(
    {},
    ...SEED.vocab.map(v => ({ [v.word.toLowerCase()]: v.phonetic })),
    SEED.phonetics || {}
  );
  function renderWithIPA(text) {
    return esc(text).replace(/[A-Za-z][A-Za-z'’-]*/g, (m) => {
      const ipa = PHON[m.toLowerCase()];
      if (ipa) return `<span class="word-tap" data-ipa="${esc(ipa)}">${m}</span>`;
      return m;
    });
  }

  // ---------- 每日状态（跨天重置）----------
  function getDaily() {
    const t = todayStr();
    let d = load(KEY.daily, null);
    if (!d || d.date !== t) { d = { date: t, checkin: false, vocab: false, listen: false, write: false }; save(KEY.daily, d); }
    return d;
  }
  function setDaily(flag, val) { const d = getDaily(); d[flag] = val; save(KEY.daily, d); refreshHome(); }

  // ---------- 打卡 / streak ----------
  function getStreak() { return load(KEY.streak, { count: 0, last: null }); }
  function getCheckinLog() {
    let log = load(KEY.checkinLog, []);
    if (!log.length) { const s = getStreak(); if (s.last) { log = [s.last]; save(KEY.checkinLog, log); } }
    return log;
  }
  function addCheckinLog(t) {
    const log = getCheckinLog();
    if (!log.includes(t)) { log.push(t); log.sort(); save(KEY.checkinLog, log); }
  }
  function doCheckin() {
    const s = getStreak(), t = todayStr();
    if (s.last === t) { toast("今天已经打卡过啦"); return; }
    if (s.last && s.last === dateAdd(t, -1)) s.count += 1; else s.count = 1;
    s.last = t; save(KEY.streak, s);
    setDaily("checkin", true);
    addCheckinLog(t);
    toast("打卡成功，连续 " + s.count + " 天");
    refreshHome();
  }

  // ---------- 词汇：Leitner 间隔重复 ----------
  const BOX_INTERVAL = [1, 2, 4, 8, 16]; // 天
  function getVocabState() {
    let st = load(KEY.vocab, null);
    if (!st) { st = {}; SEED.vocab.forEach(v => st[v.word] = { box: 1, due: todayStr() }); save(KEY.vocab, st); }
    return st;
  }
  function dueVocab() {
    const st = getVocabState(); const t = todayStr();
    return SEED.vocab.filter(v => st[v.word] && st[v.word].due <= t);
  }
  function updateVocab(word, correct) {
    const st = getVocabState(); const cur = st[word] || { box: 1, due: todayStr() };
    let box = correct ? Math.min(5, cur.box + 1) : 1;
    st[word] = { box, due: dateAdd(todayStr(), BOX_INTERVAL[box - 1]) };
    save(KEY.vocab, st);
  }
  function learnedCount() { const st = getVocabState(); return SEED.vocab.filter(v => st[v.word] && st[v.word].box >= 2).length; }

  // ---------- 写作 ----------
  function getWriting() { return load(KEY.writing, []); }
  function dailyPrompt() {
    const day = Math.floor((Date.now() / 86400000)) % SEED.prompts.length;
    return { idx: day, text: SEED.prompts[day] };
  }

  // ---------- 渲染：首页 ----------
  function refreshHome() {
    const s = getStreak();
    $("#streak-num").textContent = s.count;
    const d = getDaily();
    $("#streak-tip").textContent = d.checkin ? "今天已打卡，继续保持" : "今天还没打卡，点下面按钮开始";
    $("#btn-checkin").textContent = d.checkin ? "今日已打卡 ✓" : "今日打卡";
    $("#btn-checkin").disabled = d.checkin;

    const items = [
      { key: "checkin", label: "今日打卡", done: d.checkin },
      { key: "vocab", label: "刷 10 个词汇卡", done: d.vocab, go: "vocab" },
      { key: "listen", label: "跟读 3 句", done: d.listen, go: "listen" },
      { key: "write", label: "写 1 段（或读 1 篇）", done: d.write, go: "writing" }
    ];
    $("#home-checklist").innerHTML = items.map(it => `
      <div class="check-item" ${it.go ? `data-go="${it.go}" style="cursor:pointer"` : ""}>
        <div class="dot ${it.done ? "done" : ""}"></div>
        <div style="flex:1">${it.label}</div>
        ${it.done ? '<span class="tag green">完成</span>' : ""}
      </div>`).join("");
  }

  // ---------- 渲染：词汇 ----------
  let flipState = false;
  let pinnedVocab = null; // 分类区点词后钉在 banner 上的单词；评分后回到复习队列
  function renderVocab() {
    const due = dueVocab();
    const total = SEED.vocab.length;
    $("#vocab-progress").textContent = `待复习 ${due.length} / 总 ${total} · 已掌握 ${learnedCount()}`;
    const box = $("#vocab-box"), done = $("#vocab-done");
    const v = (pinnedVocab && SEED.vocab.find(x => x.word === pinnedVocab)) || due[0];
    if (!v) { box.innerHTML = ""; done.style.display = "block"; return; }
    done.style.display = "none";
    flipState = false;
    box.innerHTML = renderFlashcard(v);
    const flash = $("#flash");
    const toggle = () => { flipState = !flipState; $("#flash-back").style.display = flipState ? "block" : "none"; };
    flash.onclick = toggle;
    $("#v-flip").onclick = toggle;
    $("#v-no").onclick = () => { updateVocab(v.word, false); setDailyIfEnough("vocab", false); afterVocab(v.word, false); };
    $("#v-yes").onclick = () => { updateVocab(v.word, true); afterVocab(v.word, true); };
  }
  // 渲染单张词汇卡 banner：单词 + 音标 + 中文释义（正面），翻面后显示释义/例句
  function renderFlashcard(v) {
    return `
      <div class="flashcard" id="flash">
        <div class="word">${esc(v.word)}</div>
        <div class="ph">${esc(v.phonetic || "")} <span style="opacity:.7">${esc(v.pos || "")}</span></div>
        <div class="zh-banner">${esc(v.meaning || "")}</div>
        <div class="back" id="flash-back" style="display:none;">
          <div>${esc(v.meaning)}</div>
          <div style="margin-top:8px;opacity:.92;">${esc(v.ex)}</div>
          <div style="margin-top:4px;opacity:.85;font-size:13.5px;">${esc(v.zh)}</div>
          <span class="cat">${esc(v.cat)}</span>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn ghost" id="v-flip">翻面</button>
        <button class="btn" id="v-no" style="flex:1.4;color:var(--red);border-color:#f3c9ca;">不记得</button>
        <button class="btn green" id="v-yes" style="flex:1.4;">记得</button>
      </div>`;
  }
  function afterVocab(word, correct) {
    toast(correct ? "记得：" + word + " ✓" : "已重置：" + word + "，明天再来");
    pinnedVocab = null; // 评分后解除钉住，回到复习队列
    const due = dueVocab();
    if (due.length === 0) setDaily("vocab", true);
    renderVocab();
  }
  function setDailyIfEnough() { /* 占位，词汇完成在 renderVocab 中判定 */ }

  function renderVocabCats() {
    const cats = [...new Set(SEED.vocab.map(v => v.cat))];
    $("#vocab-cats").innerHTML = cats.map(c => {
      const list = SEED.vocab.filter(v => v.cat === c);
      return `<div class="item"><div class="t">${esc(c)} <span class="muted">· ${list.length} 词</span></div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">
        ${list.map(v => `<span class="tag gray" style="cursor:pointer" data-word="${esc(v.word)}">${esc(v.word)}</span>`).join("")}
        </div></div>`;
    }).join("");
    $$("#vocab-cats [data-word]").forEach(el => el.onclick = () => {
      const v = SEED.vocab.find(x => x.word === el.dataset.word);
      if (!v) return;
      pinnedVocab = v.word;   // 点词即切换 banner：单词 + 音标 + 中文释义一并更新
      renderVocab();
      speak(v.word); toast("已切换：" + v.word);
    });
  }

  // ---------- 渲染：听力跟读 ----------
  let listenCat = "全部";
  function renderVoiceCard() {
    const card = $("#voice-card");
    if (!card) return;
    const st = getVoiceState();
    const accents = [["en-US", "美式"], ["en-GB", "英式"]];
    const vs = voicesForAccent(st.accent);
    const opts = vs.length
      ? vs.map(v => `<option value="${esc(v.name)}" ${v.name === st.name ? "selected" : ""}>${esc(v.name)}</option>`).join("")
      : `<option value="">（该口音暂无可选用音色，已用默认）</option>`;
    card.className = "card";
    card.innerHTML = `
      <div class="row between"><h2 style="margin:0;">发音设置</h2><button class="btn soft" id="voice-try">试听</button></div>
      <div class="muted" style="margin:6px 0 8px;">选口音 + 音色，发音稳定保存到本地；点句中带下划线的词可查音标。</div>
      <div class="voice-row">
        ${accents.map(a => `<button class="tag ${st.accent === a[0] ? "amber" : "gray"}" data-acc="${a[0]}" style="cursor:pointer;border:none;">${a[1]}</button>`).join("")}
      </div>
      <select class="voice-sel" id="voice-sel">
        <option value="" ${st.name ? "" : "selected"}>默认（系统最佳 ${st.accent === "en-GB" ? "英式" : "美式"}）</option>
        ${opts}
      </select>`;
    $$("#voice-card [data-acc]").forEach(b => b.onclick = () => {
      const acc = b.dataset.acc;
      const cur = getVoiceState();
      const keepName = cur.name && voicesForAccent(acc).some(v => v.name === cur.name) ? cur.name : null;
      save(KEY.voice, { accent: acc, name: keepName });
      resolveVoice();
      renderVoiceCard();
      toast(acc === "en-GB" ? "已切英式发音" : "已切美式发音");
    });
    const sel = $("#voice-sel");
    if (sel) sel.onchange = () => {
      const name = sel.value || null;
      const st2 = getVoiceState();
      save(KEY.voice, { accent: st2.accent, name });
      resolveVoice();
      toast(name ? ("已选音色：" + name) : "已恢复默认音色");
    };
    const tryBtn = $("#voice-try");
    if (tryBtn) tryBtn.onclick = () => speak("Could you walk me through the test results?");
  }

  function renderListen() {
    renderVoiceCard();
    const cats = ["全部", ...new Set(SEED.shadow.map(s => s.cat))];
    $("#listen-cats").innerHTML = cats.map(c =>
      `<button class="tag ${c === listenCat ? "amber" : "gray"}" data-cat="${esc(c)}" style="cursor:pointer;border:none;">${esc(c)}</button>`).join("");
    $$("#listen-cats [data-cat]").forEach(b => b.onclick = () => { listenCat = b.dataset.cat; renderListen(); });
    const list = listenCat === "全部" ? SEED.shadow : SEED.shadow.filter(s => s.cat === listenCat);
    $("#listen-box").innerHTML = list.map((s, i) => `
      <div class="sentence">
        <div class="en">${renderWithIPA(s.en)}</div>
        <div class="zh">${esc(s.zh)}</div>
        <div class="ctr">
          <button class="icon-btn" data-spk="${i}">▶</button>
          <button class="btn soft" data-spk="${i}" style="padding:6px 14px;">再听一次</button>
          <button class="btn soft rec-btn" data-rec="${i}" data-en="${esc(s.en)}" style="padding:6px 14px;margin-left:auto;">录音评测</button>
        </div>
        <div id="rec-result-${i}"></div>
      </div>`).join("");
    $$("#listen-box [data-spk]").forEach(b => b.onclick = () => {
      speak(list[+b.dataset.spk].en);
      markListened();
    });
    $$("#listen-box [data-rec]").forEach(b => b.onclick = () => {
      const i = +b.dataset.rec;
      if (rec.active && rec.i === i) stopRec(b);
      else if (!rec.active) startRec(i, b.dataset.en, b);
      else toast("请先结束当前正在录的句");
    });
    $("#listen-play-all").onclick = () => {
      if (playChain) { playChain(); return; }
      const btn = $("#listen-play-all");
      btn.textContent = "停止连播"; btn.classList.add("green");
      sequentialSpeak(list.map(s => s.en), 600, null, () => { btn.textContent = "连播本组"; btn.classList.remove("green"); });
      markListened();
    };
    renderMicStatus();
    const stat = $("#listen-speak-stat");
    if (stat) stat.textContent = `口语评测进度：${speakCount()} / ${SEED.shadow.length} 句已打分`;
  }
  function markListened() {
    const d = getDaily(); if (!d.listen) setDaily("listen", true);
    const prog = load(KEY.listened, {}); prog[todayStr()] = (prog[todayStr()] || 0) + 1; save(KEY.listened, prog);
  }

  // ---------- 渲染：场景对话 ----------
  function renderScenarios() {
    const list = $("#scenario-list"), detail = $("#scenario-detail");
    detail.style.display = "none"; list.style.display = "block";
    list.innerHTML = SEED.scenarios.map((sc, i) => `
      <div class="item click" data-i="${i}">
        <div class="t">${esc(sc.title)}</div>
        <div class="d">${sc.lines.length} 句 · 点开逐句听 + 看中文</div>
      </div>`).join("");
    $$("#scenario-list [data-i]").forEach(el => el.onclick = () => openScenario(+el.dataset.i));
  }
  function openScenario(i) {
    const sc = SEED.scenarios[i];
    $("#scenario-list").style.display = "none";
    const detail = $("#scenario-detail"); detail.style.display = "block";
    detail.innerHTML = `
      <div class="topbar"><button class="btn ghost" id="sc-back">← 返回</button></div>
      <h2 style="margin:0 0 12px;">${esc(sc.title)}</h2>
      <button class="btn soft block" id="sc-all" style="margin-bottom:14px;">逐句连播</button>
      <div id="sc-lines"></div>`;
    $("#sc-back").onclick = renderScenarios;
    $("#sc-lines").innerHTML = sc.lines.map((l, j) =>
      `<div class="line ${l.who === "You" ? "me" : ""}">
        <div class="who">${esc(l.who)}</div>
        <div class="bubble">
          <div class="en">${renderWithIPA(l.en)} <button class="icon-btn" data-j="${j}" style="width:30px;height:30px;font-size:13px;">▶</button></div>
          <div class="zh">${esc(l.zh)}</div>
        </div>
      </div>`).join("");
    $$("#sc-lines [data-j]").forEach(b => b.onclick = () => speak(sc.lines[+b.dataset.j].en));
    const markSpeaking = (j) => $$("#sc-lines .line").forEach((el, idx) => el.classList.toggle("speaking", idx === j));
    $("#sc-all").onclick = () => {
      if (playChain) { playChain(); return; }
      const btn = $("#sc-all");
      btn.textContent = "停止连播"; btn.classList.add("green");
      sequentialSpeak(
        sc.lines.map(l => l.en),
        650,
        j => markSpeaking(j),
        () => { btn.textContent = "逐句连播"; btn.classList.remove("green"); markSpeaking(-1); }
      );
    };
  }

  // ---------- 渲染：阅读 ----------
  // 在“纯文本”上先做术语高亮，再做音标包裹；用标签/文本分段避免把已生成的标签再转义或误匹配
  function richText(text, terms) {
    const escaped = esc(text);
    const re = /(<[^>]+>)|([^<]+)/g;
    let out = "", m;
    while ((m = re.exec(escaped)) !== null) {
      if (m[1]) { out += m[1]; continue; }
      out += decorateSeg(m[2], terms);
    }
    return out;
  }
  function decorateSeg(seg, terms) {
    let s = seg;
    (terms || []).forEach(t => {
      if (!t) return;
      const re = new RegExp("\\b(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")\\b", "gi");
      s = s.replace(re, "<mark>$1</mark>");
    });
    const re2 = /(<[^>]+>)|([^<]+)/g; let out = "", m;
    while ((m = re2.exec(s)) !== null) {
      if (m[1]) { out += m[1]; continue; }
      out += m[2].replace(/[A-Za-z][A-Za-z'’-]*/g, (w) => {
        const ipa = PHON[w.toLowerCase()];
        return ipa ? `<span class="word-tap" data-ipa="${esc(ipa)}">${w}</span>` : w;
      });
    }
    return out;
  }
  function highlight(text, terms) {
    let html = esc(text);
    terms.forEach(t => { html = html.replace(new RegExp("\\b(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")\\b", "gi"), "<mark>$1</mark>"); });
    return html;
  }
  function renderReadings() {
    const list = $("#reading-list"), detail = $("#reading-detail");
    detail.style.display = "none"; list.style.display = "block";
    list.innerHTML = SEED.readings.map((r, i) => `
      <div class="item click" data-i="${i}">
        <div class="t">${esc(r.title)} <span class="tag gray">${esc(r.level)}</span></div>
        <div class="d">术语 ${r.terms.length} 个 · 点开阅读（高亮 + 朗读）</div>
      </div>`).join("");
    $$("#reading-list [data-i]").forEach(el => el.onclick = () => openReading(+el.dataset.i));
  }
  function openReading(i) {
    const r = SEED.readings[i];
    $("#reading-list").style.display = "none";
    const detail = $("#reading-detail"); detail.style.display = "block";
    detail.innerHTML = `
      <div class="topbar"><button class="btn ghost" id="rd-back">← 返回</button></div>
      <h2 style="margin:0 0 4px;">${esc(r.title)} <span class="tag gray">${esc(r.level)}</span></h2>
      <div class="muted" style="margin-bottom:10px;">高亮词：${r.terms.map(t => esc(t)).join("、")}</div>
      <div class="btn-row" style="margin-bottom:12px;">
        <button class="btn soft" id="rd-play" style="flex:1;">朗读全文</button>
        <button class="btn soft" id="rd-stop" style="flex:1;">停止朗读</button>
      </div>
      <div class="reading-text">${richText(r.text, r.terms)}</div>`;
    $("#rd-back").onclick = renderReadings;
    $("#rd-play").onclick = () => speak(r.text);
    $("#rd-stop").onclick = () => { if (playChain) playChain(); else if (HAS_TTS) speechSynthesis.cancel(); };
  }

  // ---------- 渲染：写作 ----------
  function renderWriting() {
    const p = dailyPrompt();
    $("#write-prompt-title").textContent = "今日写作题";
    $("#write-prompt-day").textContent = "Day " + (p.idx + 1);
    $("#write-prompt-text").textContent = p.text;
    const input = $("#write-input");
    input.oninput = () => {
      const w = input.value.trim() ? input.value.trim().split(/\s+/).length : 0;
      $("#write-count").textContent = w + " 词";
    };
    $("#write-save").onclick = () => {
      const txt = input.value.trim();
      if (txt.length < 3) { toast("写点什么再保存吧"); return; }
      const arr = getWriting();
      const today = todayStr();
      const existing = arr.find(e => e.date === today);
      if (existing) { existing.text = txt; existing.words = txt.split(/\s+/).length; }
      else arr.unshift({ date: today, text: txt, words: txt.split(/\s+/).length, prompt: p.text });
      save(KEY.writing, arr);
      input.value = ""; $("#write-count").textContent = "0 词";
      setDaily("write", true);
      toast("已保存今日写作 ✓");
      renderWritingHistory();
    };
    renderWritingHistory();
  }
  function renderWritingHistory() {
    const arr = getWriting();
    const box = $("#write-history");
    if (!arr.length) { box.innerHTML = '<div class="empty">还没有写作记录，今天写第一篇吧</div>'; return; }
    box.innerHTML = arr.map(e => `
      <div class="entry">
        <div class="meta"><span>${esc(e.date)}</span><span>${e.words} 词</span></div>
        <div class="body">${esc(e.text)}</div>
      </div>`).join("");
  }

  // ---------- 渲染：计划 ----------
  function renderPlan() {
    $("#plan-weekly").innerHTML = SEED.plan.weekly.map(w => `
      <div class="week">
        <div class="h">${esc(w.week)}</div>
        <div class="g">目标：${esc(w.goal)}</div>
        <div class="g">每天：${esc(w.daily)}</div>
        <ul>${w.focus.map(f => `<li>${esc(f)}</li>`).join("")}</ul>
      </div>`).join("");
    $("#plan-rhythm").innerHTML = SEED.plan.rhythm.map(r => `<li>${esc(r)}</li>`).join("");
    $("#plan-rules").innerHTML = SEED.plan.rules.map(r => `<li>${esc(r)}</li>`).join("");
  }

  // ---------- 打卡日历 ----------
  let calView = null; // 当前查看的月份 {y, m}；null = 本月
  function renderCheckinCalendar() {
    const log = getCheckinLog(), set = new Set(log), today = todayStr();
    const now = new Date(today + "T00:00:00");
    const ty = now.getFullYear(), tm = now.getMonth();
    if (!calView) calView = { y: ty, m: tm };
    const y = calView.y, m = calView.m;
    const pad = n => String(n).padStart(2, "0");
    const prefix = y + "-" + pad(m + 1);
    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // 周一为每周起点
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7) cells.push(null);
    const heads = ["一", "二", "三", "四", "五", "六", "日"];
    const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    const grid = cells.map(d => {
      if (d === null) return '<div class="cal-cell empty"></div>';
      const ds = prefix + "-" + pad(d);
      const hit = set.has(ds), isToday = ds === today;
      return '<div class="cal-cell' + (hit ? " hit" : "") + (isToday ? " today" : "") + '">' + d + "</div>";
    }).join("");
    const monthCount = log.filter(x => x.indexOf(prefix) === 0).length;
    const isCur = y === ty && m === tm;
    const recent = log.slice(-6).reverse().map(x => x.slice(5)).join("、");
    $("#checkin-summary").innerHTML = "累计打卡 <b>" + log.length + "</b> 天 · " + (isCur ? "本月" : esc(y + "年" + (m + 1) + "月")) + " <b>" + monthCount + "</b> 天 · 当前连续 <b>" + getStreak().count + "</b> 天";
    $("#checkin-calendar").innerHTML =
      '<div class="cal-nav">' +
        '<button id="cal-prev" class="cal-nav-btn" aria-label="上一月">‹</button>' +
        '<span class="cal-title">' + y + " 年 " + monthNames[m] + "</span>" +
        '<button id="cal-next" class="cal-nav-btn" aria-label="下一月"' + (isCur ? " disabled" : "") + ">›</button>" +
      "</div>" +
      '<div class="cal-grid cal-head-row">' + heads.map(h => "<div>" + h + "</div>").join("") + "</div>" +
      '<div class="cal-grid">' + grid + "</div>";
    $("#cal-prev").onclick = () => {
      let ny = calView.y, nm = calView.m - 1;
      if (nm < 0) { nm = 11; ny--; }
      calView = { y: ny, m: nm };
      renderCheckinCalendar();
    };
    $("#cal-next").onclick = () => {
      if (isCur) return;
      let ny = calView.y, nm = calView.m + 1;
      if (nm > 11) { nm = 0; ny++; }
      calView = { y: ny, m: nm };
      renderCheckinCalendar();
    };
    renderCheckinCurve(set, today);
    $("#checkin-recent").innerHTML = log.length
      ? '<div class="muted" style="font-size:12.5px;">最近打卡：' + esc(recent) + "</div>"
      : '<div class="muted" style="font-size:12.5px;">还没有打卡记录，从今天开始吧</div>';
  }

  // 近 30 天打卡曲线：累计打卡次数的折线，绿色圆点=当天有打卡
  function renderCheckinCurve(set, today) {
    const box = $("#checkin-curve");
    if (!box) return;
    const N = 30;
    const base = new Date(today + "T00:00:00");
    const pts = [];
    let cum = 0;
    for (let i = N - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i);
      const ds = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      const hit = set.has(ds);
      if (hit) cum++;
      pts.push({ i: N - 1 - i, ds, hit, cum });
    }
    const W = 320, H = 72, padL = 6, padR = 6, padT = 8, padB = 14;
    const max = Math.max(1, cum);
    const x = i => padL + (i * (W - padL - padR)) / (N - 1);
    const yv = v => padT + (1 - v / max) * (H - padT - padB);
    const line = pts.map((p, k) => (k ? "L" : "M") + x(p.i).toFixed(1) + "," + yv(p.cum).toFixed(1)).join(" ");
    const dots = pts.filter(p => p.hit)
      .map(p => '<circle cx="' + x(p.i).toFixed(1) + '" cy="' + yv(p.cum).toFixed(1) + '" r="2.6" fill="#22a55b"/>')
      .join("");
    const labels =
      '<text x="' + padL + '" y="' + (H - 2) + '" class="curve-lb">' + esc(pts[0].ds.slice(5)) + "</text>" +
      '<text x="' + (W - padR) + '" y="' + (H - 2) + '" class="curve-lb" text-anchor="end">' + esc(pts[N - 1].ds.slice(5)) + "</text>";
    box.innerHTML =
      '<svg viewBox="0 0 ' + W + " " + H + '" class="curve-svg" preserveAspectRatio="none">' +
        '<line x1="' + padL + '" y1="' + yv(max).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + yv(max).toFixed(1) + '" class="curve-base"/>' +
        '<path d="' + line + '" fill="none" stroke="#2f6df6" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
        dots + labels +
      "</svg>" +
      '<div class="muted" style="font-size:12px;text-align:center;margin-top:2px;">近 30 天打卡曲线（窗口内累计 ' + cum + " 次）</div>";
  }

  // ---------- 渲染：进度 ----------
  function renderProgress() {
    const st = getStreak();
    const listened = load(KEY.listened, {});
    const listenedTotal = Object.values(listened).reduce((a, b) => a + b, 0);
    const writing = getWriting();
    const stats = [
      { n: st.count, l: "连续打卡(天)" },
      { n: learnedCount(), l: "已掌握词汇" },
      { n: listenedTotal, l: "累计跟读(句)" },
      { n: writing.length, l: "写作篇数" },
      { n: speakCount(), l: "口语评测(句)" }
    ];
    $("#progress-stats").innerHTML = stats.map(s => `<div class="stat"><div class="n">${s.n}</div><div class="l">${esc(s.l)}</div></div>`).join("");
    renderCheckinCalendar();
    const cats = [...new Set(SEED.vocab.map(v => v.cat))];
    const stt = getVocabState();
    $("#progress-cats").innerHTML = cats.map(c => {
      const list = SEED.vocab.filter(v => v.cat === c);
      const done = list.filter(v => stt[v.word] && stt[v.word].box >= 2).length;
      const pct = Math.round(done / list.length * 100);
      return `<div style="margin-bottom:12px;">
        <div class="row between" style="font-size:13.5px;"><span>${esc(c)}</span><span class="muted">${done}/${list.length}</span></div>
        <div style="height:8px;background:#eef1f5;border-radius:999px;overflow:hidden;margin-top:5px;">
          <div style="height:100%;width:${pct}%;background:var(--brand);border-radius:999px;"></div>
        </div></div>`;
    }).join("");
  }

  // ---------- 数据备份：导出 / 导入 JSON（跨设备同步）----------
  function exportData() {
    const data = {};
    Object.keys(KEY).forEach(k => { const v = load(KEY[k], null); if (v !== null) data[k] = v; });
    const payload = { app: "frag-eng", version: 1, exportedAt: new Date().toISOString(), data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const d = new Date();
    a.href = url;
    a.download = `碎片学英语-备份-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("已导出备份文件");
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(reader.result);
        if (!p || p.app !== "frag-eng" || !p.data) throw new Error("格式不符");
        Object.keys(p.data).forEach(k => { if (Object.values(KEY).includes(k)) save(k, p.data[k]); });
        toast("导入成功，数据已恢复");
        refreshHome(); renderVocab(); renderVocabCats(); renderProgress();
      } catch (e) { toast("导入失败：文件格式不正确"); }
    };
    reader.readAsText(file);
  }

  // ---------- 口语评测：麦克风录音 + 简单打分 ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  let rec = { active: false, mr: null, sr: null, chunks: [], stream: null, i: null, en: "", btn: null, mime: "", finalGot: false, stopping: false };
  // 安全上下文判定：https 或 localhost/127.0.0.1 均可使用麦克风
  function secureCtx() {
    try {
      if (window.isSecureContext) return true;
      const h = location.hostname;
      return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
    } catch (e) { return false; }
  }
  // 麦克风可用性自检（在跟读页显示，提示当前环境能否授权麦克风）
  function renderMicStatus() {
    const box = $("#mic-status");
    if (!box) return;
    const hasMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const ok = secureCtx() && hasMedia;
    const srOk = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    let tip;
    if (ok) {
      tip = "麦克风可用：点「录音评测」会弹出授权，允许即可。";
      if (!srOk) tip += " 注意：该浏览器不支持发音内容识别（录音评测将使用「回放+自评」）；建议用 Safari / Chrome 打开，可获得匹配度自动评分。";
      box.className = "mic-status ok";
    } else if (!secureCtx()) {
      tip = "当前环境非安全上下文，麦克风会被浏览器禁用。请用手机/电脑的「原生浏览器」打开分享链接（https），不要在 WorkBuddy 预览面板内使用。";
      box.className = "mic-status warn";
    } else {
      tip = "当前浏览器不支持麦克风采集（getUserMedia 不可用），录音评测将降级为「录音回放 + 自评」。";
      box.className = "mic-status warn";
    }
    box.textContent = (ok ? "✓ " : "⚠ ") + tip;
  }
  // 统一取麦克风流：优先标准 API，回退旧版 navigator.getUserMedia
  function getMicStream() {
    const mds = navigator.mediaDevices;
    if (mds && mds.getUserMedia) return mds.getUserMedia({ audio: true });
    if (navigator.getUserMedia) return new Promise((res, rej) => navigator.getUserMedia({ audio: true }, res, rej));
    return Promise.reject(new Error("no-getUserMedia"));
  }
  function scoreSpeech(target, got) {
    const norm = s => s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").split(/\s+/).filter(Boolean);
    const t = norm(target), g = norm(got);
    const gset = new Set(g);
    const matched = t.filter(w => gset.has(w));
    const missed = t.filter(w => !gset.has(w));
    const score = t.length ? Math.round(matched.length / t.length * 100) : 0;
    return { score, missed };
  }
  function getSpeak() { return load(KEY.speak, {}); }
  function speakCount() { const s = getSpeak(); return Object.values(s).filter(v => v && v.score != null).length; }
  function showScore(i, en, transcript) {
    const box = $("#rec-result-" + i); if (!box) return;
    const { score, missed } = scoreSpeech(en, transcript);
    const st = getSpeak();
    const prev = st[en];
    const best = prev && prev.score != null ? Math.max(prev.score, score) : score;
    st[en] = { score: best, transcript, missed, at: new Date().toISOString() };
    save(KEY.speak, st);
    box.dataset.scored = "1";
    const au = box.querySelector("audio"); // 保留录音回放，别被 innerHTML 覆盖掉
    box.innerHTML = `<div class="row between" style="margin-top:8px;">
        <span class="tag ${score >= 80 ? "green" : score >= 50 ? "amber" : "gray"}">匹配度 ${score}%</span>
        <span class="muted">最佳 ${best}%</span>
      </div>
      <div class="muted" style="margin-top:6px;">你读的：${esc(transcript)}</div>
      ${missed.length ? `<div class="muted" style="margin-top:4px;">漏读 / 偏差：${esc(missed.join(", "))}</div>` : `<div class="muted" style="margin-top:4px;color:var(--green);">基本读全了，漂亮</div>`}`;
    if (au) box.appendChild(au);
  }
  function showSelfRate(i, en) {
    const box = $("#rec-result-" + i); if (!box || box.dataset.scored || box.dataset.valid === "0") return;
    const au = box.querySelector("audio"); // 保留录音回放，别被 innerHTML 覆盖掉
    // 诚实区分「AI 识别评分」和「自评」：无识别环境明确告知，避免自评被误当发音评分
    const tip = SR
      ? "未识别到清晰语音，请听回放后自评（自评结果与识别评分分开记录）："
      : "当前浏览器不支持发音内容识别（微信内置浏览器不支持），用 Safari / Chrome 打开本页可获得匹配度自动评分；本条请听回放后自评：";
    box.innerHTML = `<div class="muted" style="margin-top:8px;">${tip}</div>
      <div class="btn-row" style="margin-top:8px;">
        <button class="btn" data-rate="60">还行</button>
        <button class="btn" data-rate="80">不错</button>
        <button class="btn green" data-rate="100">很棒</button>
      </div>`;
    if (au) box.appendChild(au);
    $$("#rec-result-" + i + " [data-rate]").forEach(b => b.onclick = () => {
      const v = +b.dataset.rate; const st = getSpeak();
      const prev = st[en]; const best = prev && prev.score != null ? Math.max(prev.score, v) : v;
      st[en] = { score: best, self: true, at: new Date().toISOString() };
      save(KEY.speak, st); box.dataset.scored = "1";
      // 自评只允许一次：按钮置灰，防重复刷分
      $$("#rec-result-" + i + " [data-rate]").forEach(x => { x.disabled = true; x.style.opacity = ".5"; x.style.cursor = "default"; });
      toast("已记录自评：" + v + "%");
    });
  }
  // 按浏览器能力挑选录音容器格式：Chrome/Firefox 用 webm/opus，iOS Safari 只支持 mp4/aac
  function pickRecMime() {
    try {
      const list = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", "audio/ogg;codecs=opus"];
      for (const m of list) {
        if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m;
      }
    } catch (e) {}
    return "";
  }
  // 录音有效性检测：解码音频取真实时长 + 人声能量（RMS），拒绝空录音/过短/无声录音
  function analyzeRecording(blob) {
    return new Promise(res => {
      const invalid = () => res({ ok: false, duration: 0, speechSec: 0 });
      try {
        if (!blob || blob.size < 2048) { invalid(); return; } // 几乎无数据
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { res({ ok: true, duration: 0, speechSec: 0 }); return; } // 无法分析时不误杀
        const ac = new AC();
        const bail = ok => { try { ac.close(); } catch (e) {} res({ ok, duration: 0, speechSec: 0 }); };
        blob.arrayBuffer().then(buf => {
          // webkit 前缀回调式与 Promise 式都兼容
          let p;
          try { p = ac.decodeAudioData(buf); } catch (e) { p = new Promise((rs, rj) => ac.decodeAudioData(buf, rs, rj)); }
          Promise.resolve(p).then(a => {
            const ch = a.getChannelData(0), sr = a.sampleRate, hop = 1024;
            let frames = 0, speechFrames = 0, peak = 0;
            for (let i = 0; i + hop <= ch.length; i += hop) {
              let sum = 0;
              for (let j = 0; j < hop; j++) { const v = ch[i + j], av = v < 0 ? -v : v; sum += v * v; if (av > peak) peak = av; }
              if (Math.sqrt(sum / hop) > 0.015) speechFrames++; // 高于人声底噪判定为说话帧
              frames++;
            }
            const speechSec = frames ? speechFrames * hop / sr : 0;
            try { ac.close(); } catch (e) {}
            // 有效判定：总时长 ≥0.8s，且有效人声 ≥0.4s；低增益麦克风用峰值兜底（peak>0.1 时放宽到 ≥0.2s）
            const ok = a.duration >= 0.8 && (speechSec >= 0.4 || (peak > 0.1 && speechSec >= 0.2));
            res({ ok, duration: a.duration, speechSec, peak });
          }).catch(() => bail(blob.size >= 2048)); // 解码失败不误杀，靠体积兜底
        }).catch(() => bail(blob.size >= 2048));
      } catch (e) { invalid(); }
    });
  }
  function startRec(i, en, btn) {
    if (rec.active) return;
    if (rec.stopping) { toast("上一条录音处理中，请稍候 1 秒再录"); return; } // onstop 异步收尾未完成，防竞态
    if (!secureCtx()) {
      toast("麦克风需 https 或 localhost 环境；本预览/非安全页不支持，请用浏览器直接打开分享链接");
      return;
    }
    rec.active = true; rec.i = i; rec.en = en; rec.btn = btn; rec.finalGot = false;
    const prevBox = $("#rec-result-" + i);
    if (prevBox) { delete prevBox.dataset.scored; delete prevBox.dataset.valid; prevBox.innerHTML = ""; }
    btn.textContent = "停止录音"; btn.classList.add("green");
    getMicStream().then(stream => {
      rec.stream = stream;
      try {
        const mime = pickRecMime();
        rec.mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        rec.mime = rec.mr.mimeType || mime || "";
        rec.chunks = [];
        rec.mr.ondataavailable = e => { if (e.data && e.data.size) rec.chunks.push(e.data); };
        rec.mr.onstop = () => {
          const blob = new Blob(rec.chunks, rec.mime ? { type: rec.mime } : undefined);
          const box = $("#rec-result-" + i);
          const finish = ok => {
            if (box) {
              box.querySelectorAll("audio").forEach(a => a.remove());
              if (!ok) {
                // 空录音/太短/无人声：不生成播放器、不允许评分，直接提示重录
                box.dataset.valid = "0";
                box.innerHTML = `<div class="muted" style="margin-top:8px;color:var(--amber);">⚠ 无效录音（空录音 / 太短 / 未检测到人声），本次不计入评测，请点「录音评测」重录。</div>`;
                toast("录音无效：未检测到有效语音，请靠近麦克风重录");
              } else {
                box.dataset.valid = "1";
                // 用实际录制格式的 MIME 打标，否则 iOS(mp4) 上标成 webm 会播放报错
                const au = document.createElement("audio");
                au.controls = true; au.src = URL.createObjectURL(blob); au.style.marginTop = "8px"; au.style.width = "100%";
                au.onerror = () => {
                  toast("回放失败：当前浏览器不支持该录音格式，请听原声自评");
                  if (!box.dataset.scored) showSelfRate(rec.i, rec.en);
                };
                box.appendChild(au);
              }
            }
            stream.getTracks().forEach(t => t.stop());
            rec.stopping = false;
          };
          analyzeRecording(blob).then(r => finish(r.ok)).catch(() => finish(blob.size >= 2048));
        };
        rec.mr.start();
      } catch (e) {
        stream.getTracks().forEach(t => t.stop());
        rec.active = false; btn.textContent = "录音评测"; btn.classList.remove("green"); rec.btn = null;
        toast("录音初始化失败：" + (e && e.message ? e.message : e));
      }
    }).catch(err => {
      rec.active = false; btn.textContent = "录音评测"; btn.classList.remove("green"); rec.btn = null;
      const name = err && err.name;
      const msg = (name === "NotAllowedError" || name === "SecurityError")
        ? "麦克风权限被拒绝，请在地址栏允许麦克风后重试"
        : "无法访问麦克风：" + (err && err.message ? err.message : err);
      toast(msg);
    });
    if (SR) {
      try {
        const r = new SR();
        r.lang = "en-US"; r.interimResults = true; r.continuous = false;
        let final = "";
        r.onresult = e => {
          for (let k = e.resultIndex; k < e.results.length; k++) if (e.results[k].isFinal) final += e.results[k][0].transcript;
          if (final) { rec.finalGot = true; showScore(i, en, final); }
        };
        // 识别失败/无结果时兜底走自评，不再静默吞掉（无效录音除外）
        r.onerror = () => {};
        r.onend = () => {
          rec.sr = null;
          setTimeout(() => {
            const box = $("#rec-result-" + i);
            if (!rec.finalGot && box && !box.dataset.scored && box.dataset.valid !== "0") showSelfRate(i, en);
          }, 800);
        };
        rec.sr = r; r.start();
      } catch (e) { /* 识别不可用则降级为纯录音 */ }
    }
  }
  function stopRec(btn) {
    const wasRecording = rec.mr && rec.mr.state === "recording";
    rec.stopping = !!wasRecording; // onstop 异步收尾期间禁止立即重录
    if (wasRecording) rec.mr.stop(); // onstop 里统一停音轨，提前 stop 会丢最后一帧
    if (rec.sr) { try { rec.sr.stop(); } catch (e) {} rec.sr = null; }
    if (!wasRecording && rec.stream) rec.stream.getTracks().forEach(t => t.stop());
    rec.active = false;
    if (btn) { btn.textContent = "录音评测"; btn.classList.remove("green"); }
    rec.btn = null;
    // 无识别环境（或识别未产出结果）兜底自评：轮询等有效性分析先出结论，无效录音不给评分入口
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const box = $("#rec-result-" + rec.i);
      if (!box || box.dataset.valid === "0" || box.dataset.scored || rec.finalGot) { clearInterval(t); return; }
      if (box.dataset.valid === "1") { clearInterval(t); showSelfRate(rec.i, rec.en); }
      if (tries > 10) clearInterval(t); // 最多等 3s，超时放弃（正常不会走到）
    }, 300);
  }

  // ---------- 导航 ----------
  const views = ["home", "vocab", "listen", "scenario", "reading", "writing", "plan", "progress"];
  function go(view) {
    // 切走页面时停止所有语音/连播/录音，避免后台继续播放
    if (playChain) playChain(); else if (HAS_TTS) speechSynthesis.cancel();
    if (rec.active && rec.btn) stopRec(rec.btn);
    views.forEach(v => $("#view-" + v).classList.toggle("active", v === view));
    $$("#nav button").forEach(b => b.classList.toggle("active", b.dataset.view === view));
    ({ home: refreshHome, vocab: () => { renderVocab(); renderVocabCats(); }, listen: renderListen,
       scenario: renderScenarios, reading: renderReadings, writing: renderWriting,
       plan: renderPlan, progress: renderProgress }[view] || (() => {}))();
  }

  // ---------- 事件绑定 ----------
  function bind() {
    $("#btn-checkin").onclick = doCheckin;
    $("#btn-export").onclick = exportData;
    $("#btn-import").onclick = () => $("#import-file").click();
    $("#import-file").onchange = (e) => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ""; };
    $$("#nav button").forEach(b => b.onclick = () => go(b.dataset.view));
    document.addEventListener("click", (e) => {
      const w = e.target.closest(".word-tap");
      if (w) { w.classList.toggle("show"); return; }
      const el = e.target.closest("[data-go]");
      if (el && el.id !== "btn-checkin") go(el.dataset.go);
    });
  }

  // ---------- 启动 ----------
  // 关于区块：版本号与仓库链接统一由常量渲染，避免发版时多处手改漏改
  function renderAbout() {
    const el = $("#app-about");
    if (!el) return;
    el.innerHTML =
      `<div>BiteLingo · 碎片学英语　v${esc(APP_VERSION)}</div>` +
      `<div>作者：Bella　<a href="${esc(REPO_URL)}" target="_blank" rel="noopener">github.com/sunshinebella/BiteLingo</a></div>`;
  }
  function init() {
    const d = new Date();
    $("#home-date").textContent = `${d.getMonth() + 1}月${d.getDate()}日 · ${["周日","周一","周二","周三","周四","周五","周六"][d.getDay()]}`;
    bind();
    renderAbout();
    // 切到后台标签页时自动暂停语音，回到前台不会自动续播（避免突兀出声）
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { if (playChain) playChain(); else if (HAS_TTS) speechSynthesis.cancel(); }
      if (!document.hidden) renderMicStatus();
    });
    renderMicStatus();
    refreshHome();
    if (!STORAGE_OK) toast("当前环境禁止本地存储，学习记录不会被保存；请在普通浏览器中打开以保存进度");
  }
  document.addEventListener("DOMContentLoaded", init);
})();

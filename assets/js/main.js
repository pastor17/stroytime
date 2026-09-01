(function () {
  "use strict";

  /* 移动端导航开关 */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });
  }

  /* 阅读进度条（仅在故事正文页启用） */
  var storyBody = document.getElementById("storyBody");
  var progressBar = document.getElementById("progressBar");
  if (storyBody && progressBar) {
    var onScroll = function () {
      var rect = storyBody.getBoundingClientRect();
      var total = storyBody.offsetHeight - window.innerHeight;
      var scrolled = -rect.top;
      if (total > 0) {
        var pct = Math.min(100, Math.max(0, (scrolled / total) * 100));
        progressBar.style.width = pct + "%";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();
  }

  /* 字号调节（记住用户偏好） */
  var fontDown = document.getElementById("fontDown");
  var fontUp = document.getElementById("fontUp");
  var fontReset = document.getElementById("fontReset");
  if (storyBody && (fontDown || fontUp || fontReset)) {
    var STORAGE_KEY = "storyFontSize";
    var MIN = 0.9, MAX = 1.5, DEFAULT = 1.08, STEP = 0.06;

    var current = parseFloat(localStorage.getItem(STORAGE_KEY)) || DEFAULT;
    var apply = function () {
      storyBody.style.setProperty("--reader-size", current.toFixed(2) + "rem");
      localStorage.setItem(STORAGE_KEY, String(current));
    };
    if (fontDown) fontDown.addEventListener("click", function () { current = Math.max(MIN, current - STEP); apply(); });
    if (fontUp) fontUp.addEventListener("click", function () { current = Math.min(MAX, current + STEP); apply(); });
    if (fontReset) fontReset.addEventListener("click", function () { current = DEFAULT; apply(); });
    apply();
  }

  /* 回到顶部 */
  var backToTop = document.getElementById("backToTop");
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* 朗读功能（Web Speech API：固定悬浮播放器 + 章节起点 + 高亮当前段落） */
  var audioBar = document.getElementById("storyAudio");
  var audioToggle = document.getElementById("audioToggle");
  var audioStop = document.getElementById("audioStop");
  var audioVoice = document.getElementById("audioVoice");
  var audioRate = document.getElementById("audioRate");
  var audioPitch = document.getElementById("audioPitch");

  if (storyBody && audioBar && audioToggle && audioStop && "speechSynthesis" in window) {
    var synth = window.speechSynthesis;
    var voices = [];
    var blocks = [];
    var currentBlock = -1;
    var speaking = false;
    var paused = false;

    audioBar.hidden = false;

    /* 高音质音源（可选）：若存在预生成的 MP3，主播放优先走音频文件，系统语音作兜底 */
    var mp3Url = audioBar.getAttribute("data-audio") || "";
    var mp3 = null;
    var mp3Ready = false;

    var setHint = function (text) {
      var hint = audioBar.querySelector(".story-audio__hint");
      if (hint) hint.textContent = text;
    };

    if (mp3Url && "fetch" in window) {
      mp3 = new Audio();
      mp3.preload = "none";
      mp3.src = mp3Url;
      fetch(mp3Url, { method: "HEAD" })
        .then(function (res) {
          mp3Ready = res.ok;
          if (mp3Ready) setHint("已启用高音质朗读 · 系统语音兜底");
        })
        .catch(function () { mp3Ready = false; });
    }

    /* 柔美女声打分：按“音色柔和/自然”的常见中文神经语音优先排序 */
    var voiceScore = function (v) {
      var n = v.name || "";
      var s = 0;
      if (/xiaoxiao|晓晓|xiaoyi|晓伊|yunxi|云希|yunjian|云健|xiaobei|晓北/i.test(n)) s += 100;
      if (/ting-?ting|婷婷|mei-?jia|美佳|xin-?yue|欣悦|sinji|诗诗|shanshan|珊珊|姗姗|siri/i.test(n)) s += 90;
      if (/huihui|慧慧|yaoyao|瑶瑶|wanwan|湾湾|xiaoqiao|晓乔|xiaoxuan|晓萱/i.test(n)) s += 80;
      if (/female|女|woman/i.test(n)) s += 40;
      if (/natural|online|enhanced|neural|premium/i.test(n)) s += 20;
      if (/microsoft|edge/i.test(n)) s += 10;
      if (/apple/i.test(n)) s += 8;
      return s;
    };

    var buildVoiceList = function () {
      voices = (synth.getVoices() || []).filter(function (v) {
        return /^zh/i.test(v.lang);
      });
      voices.sort(function (a, b) { return voiceScore(b) - voiceScore(a); });
      audioVoice.innerHTML = "";
      var def = document.createElement("option");
      def.value = "";
      def.textContent = "系统默认（兜底）";
      audioVoice.appendChild(def);
      voices.forEach(function (v, i) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.textContent = v.name + " · " + v.lang;
        audioVoice.appendChild(opt);
      });
      // 自动选中当前设备上最柔美的中文女声
      if (voices.length && voiceScore(voices[0]) >= 40) {
        audioVoice.value = "0";
      }
    };

    buildVoiceList();
    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", buildVoiceList);
    }

    var currentVoice = function () {
      var idx = audioVoice.value;
      return (idx !== "" && voices[idx]) ? voices[idx] : null;
    };
    var currentRate = function () {
      return audioRate ? parseFloat(audioRate.value) : 1;
    };
    var currentPitch = function () {
      return audioPitch ? parseFloat(audioPitch.value) : 1;
    };

    // 收集正文块（章节标题、段落、列表项、引用）
    var collectBlocks = function () {
      blocks = [];
      storyBody.querySelectorAll("h2, h3, p, li, blockquote").forEach(function (el) {
        var t = el.innerText.replace(/\s+/g, " ").trim();
        if (t) blocks.push({ el: el, text: t });
      });
    };
    collectBlocks();

    // 给每个章节标题加「朗读本章」按钮
    storyBody.querySelectorAll("h2").forEach(function (h2) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chapter-read";
      btn.textContent = "🔊 朗读本章";
      btn.title = "从这一章开始朗读";
      h2.appendChild(btn);
    });

    var clearHighlight = function () {
      blocks.forEach(function (b) { b.el.classList.remove("is-reading"); });
    };

    var resetUI = function () {
      speaking = false;
      paused = false;
      currentBlock = -1;
      clearHighlight();
      audioToggle.textContent = "▶ 朗读";
      audioStop.disabled = true;
    };

    var stopSpeaking = function () {
      synth.cancel();
      if (mp3 && !mp3.paused) { try { mp3.pause(); } catch (e) {} }
      resetUI();
    };

    /* 高音质 MP3 播放（整篇），结束后复位 */
    var playMp3 = function () {
      if (!mp3) return;
      if (!mp3.paused) {
        mp3.pause();
        audioToggle.textContent = "▶ 继续";
        return;
      }
      mp3.play().then(function () {
        audioToggle.textContent = "⏸ 暂停";
        audioStop.disabled = false;
      }).catch(function () {
        mp3Ready = false;
        setHint("系统语音朗读 · 默认女声");
        startFrom(0);
      });
    };

    if (mp3) {
      mp3.addEventListener("ended", function () { resetUI(); });
      mp3.addEventListener("error", function () {
        mp3Ready = false;
        setHint("系统语音朗读 · 默认女声");
      });
    }

    var splitSentences = function (text) {
      return (text.match(/[^。！？!?；;]+[。！？!?；;]?/g) || [text])
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
    };

    var scrollIntoViewIfNeeded = function (el) {
      var rect = el.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < 0 || rect.bottom > vh) {
        try { el.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
      }
    };

    var speakBlock = function (index) {
      if (!speaking || index >= blocks.length) {
        resetUI();
        return;
      }
      currentBlock = index;
      var block = blocks[index];
      clearHighlight();
      block.el.classList.add("is-reading");
      scrollIntoViewIfNeeded(block.el);

      var sentences = splitSentences(block.text);
      var si = 0;
      var nextSentence = function () {
        if (!speaking) return;
        if (si >= sentences.length) {
          speakBlock(index + 1);
          return;
        }
        var u = new SpeechSynthesisUtterance(sentences[si]);
        var voice = currentVoice();
        u.lang = voice ? voice.lang : "zh-CN";
        if (voice) u.voice = voice;
        u.rate = currentRate();
        u.pitch = currentPitch();
        u.onend = function () { si++; nextSentence(); };
        synth.speak(u);
      };
      nextSentence();
    };

    var startFrom = function (index) {
      stopSpeaking();
      speaking = true;
      paused = false;
      audioToggle.textContent = "⏸ 暂停";
      audioStop.disabled = false;
      speakBlock(index);
    };

    var toggleSpeak = function () {
      // 有高音质音源时，主按钮优先播放 MP3
      if (mp3Ready && mp3) {
        playMp3();
        return;
      }
      if (speaking) {
        if (paused) {
          synth.resume();
          paused = false;
          audioToggle.textContent = "⏸ 暂停";
        } else {
          synth.pause();
          paused = true;
          audioToggle.textContent = "▶ 继续";
        }
        return;
      }
      startFrom(0);
    };

    // 「朗读本章」按钮：从对应章节开始
    storyBody.querySelectorAll(".chapter-read").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var h2 = btn.closest("h2");
        var idx = -1;
        for (var i = 0; i < blocks.length; i++) {
          if (blocks[i].el === h2) { idx = i; break; }
        }
        if (idx >= 0) startFrom(idx);
      });
    });

    // 部分 Chrome 长时间朗读会中断，定时 resume 保持活跃
    setInterval(function () {
      if (speaking && !paused) {
        try { synth.resume(); } catch (e) {}
      }
    }, 15000);

    audioToggle.addEventListener("click", toggleSpeak);
    audioStop.addEventListener("click", stopSpeaking);
    if (audioVoice) {
      audioVoice.addEventListener("change", function () {
        if (speaking) startFrom(currentBlock >= 0 ? currentBlock : 0);
      });
    }
    if (audioRate) {
      audioRate.addEventListener("change", function () {
        if (speaking) startFrom(currentBlock >= 0 ? currentBlock : 0);
      });
    }
  }
})();

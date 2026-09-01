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

  /* 朗读功能（Web Speech API：浏览器内置语音合成，免费、无需外部库） */
  var audioToggle = document.getElementById("audioToggle");
  var audioStop = document.getElementById("audioStop");
  var audioVoice = document.getElementById("audioVoice");
  var audioRate = document.getElementById("audioRate");

  if (storyBody && audioToggle && audioStop && "speechSynthesis" in window) {
    var synth = window.speechSynthesis;
    var voices = [];
    var speaking = false;
    var paused = false;

    var buildVoiceList = function () {
      voices = (synth.getVoices() || []).filter(function (v) {
        return /^zh/i.test(v.lang);
      });
      // 女声优先：常见女声名字排前，男声排后
      voices.sort(function (a, b) {
        var fa = /female|女|huihui|yaoyao|xiaoxiao|ting-ting|mei-jia|shanshan|xiaoyi/i.test(a.name) ? 0 : 1;
        var fb = /female|女|huihui|yaoyao|xiaoxiao|ting-ting|mei-jia|shanshan|xiaoyi/i.test(b.name) ? 0 : 1;
        return fa - fb;
      });
      audioVoice.innerHTML = "";
      var def = document.createElement("option");
      def.value = "";
      def.textContent = "系统默认（女声）";
      audioVoice.appendChild(def);
      voices.forEach(function (v, i) {
        var opt = document.createElement("option");
        opt.value = i;
        opt.textContent = v.name + " · " + v.lang;
        audioVoice.appendChild(opt);
      });
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
    var resetUI = function () {
      speaking = false;
      paused = false;
      audioToggle.textContent = "▶ 朗读";
      audioStop.disabled = true;
    };
    var stopSpeaking = function () {
      synth.cancel();
      resetUI();
    };

    var toggleSpeak = function () {
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

      var text = storyBody.innerText.replace(/\s+/g, " ").trim();
      if (!text) return;

      // 按句子切分，避免单次朗读过长
      var sentences = (text.match(/[^。！？!?；;，,：:\n]+[。！？!?；;]?/g) || [text])
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
      if (sentences.length === 0) return;

      var voice = currentVoice();
      sentences.forEach(function (sentence, idx) {
        var u = new SpeechSynthesisUtterance(sentence);
        u.lang = voice ? voice.lang : "zh-CN";
        if (voice) u.voice = voice;
        u.rate = currentRate();
        if (idx === sentences.length - 1) {
          u.onend = function () { resetUI(); };
        }
        synth.speak(u);
      });

      speaking = true;
      paused = false;
      audioToggle.textContent = "⏸ 暂停";
      audioStop.disabled = false;
    };

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
        if (speaking) { stopSpeaking(); toggleSpeak(); }
      });
    }
    if (audioRate) {
      audioRate.addEventListener("change", function () {
        if (speaking) { stopSpeaking(); toggleSpeak(); }
      });
    }
  } else if (storyBody && audioToggle) {
    audioToggle.disabled = true;
    audioToggle.textContent = "当前浏览器不支持朗读";
  }
})();

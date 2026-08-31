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
})();

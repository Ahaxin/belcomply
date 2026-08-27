/* BelComply — shared interactions */
(function () {
  "use strict";

  /* Language switch: /zh/xxx.html  <->  /en/xxx.html */
  var langLink = document.querySelector("[data-lang-switch]");
  if (langLink) {
    var parts = window.location.pathname.split("/").filter(function (p) {
      return p && p !== ".";
    });
    var file = "index.html";
    var lang = "en";
    if (parts.length >= 1) {
      var last = parts[parts.length - 1];
      if (/\.html$/.test(last)) {
        file = last;
        lang = parts[parts.length - 2] === "zh" ? "zh" : "en";
      } else {
        lang = last === "zh" ? "zh" : "en";
      }
    }
    var target = lang === "zh" ? "en" : "zh";
    langLink.href = "../" + target + "/" + file;
    langLink.textContent = lang === "zh" ? "EN" : "中文";
    langLink.setAttribute("aria-label", lang === "zh" ? "Switch to English" : "切换至中文");
  }

  /* Mobile nav toggle */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", nav.classList.contains("open"));
    });
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var expanded = q.getAttribute("aria-expanded") === "true";
      var a = q.nextElementSibling;
      // close siblings
      var wrap = q.closest(".faq-list");
      if (wrap) {
        wrap.querySelectorAll(".faq-q[aria-expanded='true']").forEach(function (other) {
          if (other !== q) {
            other.setAttribute("aria-expanded", "false");
            other.nextElementSibling.style.maxHeight = "0";
          }
        });
      }
      q.setAttribute("aria-expanded", String(!expanded));
      if (a) a.style.maxHeight = expanded ? "0" : a.scrollHeight + "px";
    });
  });

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();

/* ==========================================================================
   Mifas Corner - script.js
   Mobile nav, header search, product search + category filter,
   WhatsApp enquiries, smooth scrolling, contact form validation.
   ========================================================================== */
(function () {
  "use strict";

  var WHATSAPP_NUMBER = "94757070217";
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function whatsappLink(text) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  }

  /* ---------- Footer year ---------- */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  var nav = $("#site-nav");
  var menuBtn = $("#menu-toggle");

  function setMenu(open) {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () {
    setMenu(menuBtn.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    setMenu(false);
    setSearchPanel(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 960) setMenu(false);
  });

  /* ---------- Header search panel ---------- */
  var searchToggle = $("#search-toggle");
  var searchPanel = $("#header-search");
  var headerForm = $("#header-search-form");
  var headerInput = $("#header-search-input");

  function setSearchPanel(open) {
    searchPanel.hidden = !open;
    searchToggle.setAttribute("aria-expanded", String(open));
    if (open) headerInput.focus();
  }
  searchToggle.addEventListener("click", function () {
    setSearchPanel(searchPanel.hidden);
  });

  /* ---------- Product search and filtering ---------- */
  var products = $$(".product");
  var chips = $$(".chip");
  var searchInput = $("#product-search");
  var countEl = $("#results-count");
  var grid = $("#product-grid");
  var emptyState = $("#empty-state");
  var state = { category: "all", query: "" };

  function applyFilters() {
    var q = state.query.trim().toLowerCase();
    var visible = 0;

    products.forEach(function (item) {
      var haystack = (
        item.dataset.name + " " +
        (item.dataset.keywords || "") + " " +
        item.querySelector(".product-cat").textContent
      ).toLowerCase();
      var matchesCategory = state.category === "all" || item.dataset.category === state.category;
      var matchesQuery = !q || q.split(/\s+/).every(function (word) { return haystack.indexOf(word) !== -1; });
      var show = matchesCategory && matchesQuery;
      item.hidden = !show;
      if (show) visible++;
    });

    chips.forEach(function (chip) {
      var active = chip.dataset.filter === state.category;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });

    grid.hidden = visible === 0;
    emptyState.hidden = visible !== 0;
    countEl.textContent = visible === 0
      ? "No products found"
      : "Showing " + visible + " sample product" + (visible === 1 ? "" : "s");
  }

  function setFilter(category, query) {
    state.category = category;
    state.query = query || "";
    searchInput.value = state.query;
    applyFilters();
  }

  searchInput.addEventListener("input", function () {
    state.query = searchInput.value;
    applyFilters();
  });

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      state.category = chip.dataset.filter;
      applyFilters();
    });
  });

  $("#reset-filters").addEventListener("click", function () {
    setFilter("all", "");
    searchInput.focus();
  });

  // Category cards and footer category links apply a filter, then scroll to the grid.
  $$("a[data-filter]").forEach(function (link) {
    link.addEventListener("click", function () {
      setFilter(link.dataset.filter, "");
    });
  });

  // Header search submits to the featured section.
  headerForm.addEventListener("submit", function (e) {
    e.preventDefault();
    setFilter("all", headerInput.value);
    setSearchPanel(false);
    scrollToTarget($("#featured"));
  });

  /* ---------- WhatsApp enquiry buttons ---------- */
  $$(".enquire").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var name = btn.closest(".product").dataset.name;
      var message = "Hello Mifas Corner, I'd like to enquire about: " + name +
        ". Could you share details and availability?";
      window.open(whatsappLink(message), "_blank", "noopener,noreferrer");
    });
  });

  /* ---------- Smooth scrolling for in-page links ---------- */
  function scrollToTarget(target) {
    if (!target) return;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }

  $$('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = $(id);
      if (!target) return;
      e.preventDefault();
      setMenu(false);
      scrollToTarget(target);
      if (history.pushState) history.pushState(null, "", id);
    });
  });

  /* ---------- Contact form validation ---------- */
  var form = $("#contact-form");
  var result = $("#form-result");
  var waLink = $("#form-wa-link");

  var rules = {
    name: function (v) {
      return v.length < 2 ? "Enter your name (at least 2 characters)." : "";
    },
    email: function (v) {
      if (!v) return "Enter your email address.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Enter a valid email address, like name@example.com.";
    },
    phone: function (v) {
      if (!v) return ""; // optional
      var digits = v.replace(/\D/g, "");
      var okChars = /^\+?[0-9\s\-()]+$/.test(v);
      return okChars && digits.length >= 7 && digits.length <= 15
        ? "" : "Enter a valid phone number with 7 to 15 digits.";
    },
    message: function (v) {
      return v.length < 10 ? "Write a message of at least 10 characters." : "";
    }
  };

  function validateField(input) {
    var message = rules[input.name](input.value.trim());
    var field = input.closest(".field");
    var error = $("#cf-" + input.name + "-err");
    error.textContent = message;
    field.classList.toggle("has-error", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  var fields = $$("input, textarea", form);

  fields.forEach(function (input) {
    input.addEventListener("blur", function () { validateField(input); });
    input.addEventListener("input", function () {
      result.hidden = true;
      if (input.closest(".field").classList.contains("has-error")) validateField(input);
    });
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var firstInvalid = null;

    fields.forEach(function (input) {
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      result.hidden = true;
      firstInvalid.focus();
      return;
    }

    // No backend is connected, so we never claim the message was sent.
    // Instead, hand the validated message to WhatsApp for the visitor to send.
    var data = {};
    fields.forEach(function (input) { data[input.name] = input.value.trim(); });
    var text = "Hello Mifas Corner, my name is " + data.name + "." +
      "\nEmail: " + data.email +
      (data.phone ? "\nPhone: " + data.phone : "") +
      "\n\n" + data.message;
    waLink.href = whatsappLink(text);
    result.hidden = false;
    result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
  });
})();

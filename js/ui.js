/* PanelCraft — shared UI primitives */
(function () {
  "use strict";

  const esc = Utils.escapeHtml;

  function icon(name, cls) {
    return `<svg class="icon${cls ? ` ${cls}` : ""}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  function toast(message, type) {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;
    const el = document.createElement("div");
    el.className = `toast toast-${type || "success"}`;
    const iconName = type === "error" ? "warning" : "check";
    el.innerHTML = `${icon(iconName)}<span>${esc(message)}</span>`;
    stack.appendChild(el);
    setTimeout(() => {
      el.classList.add("toast-leaving");
      setTimeout(() => el.remove(), 300);
    }, type === "error" ? 5000 : 3000);
  }

  function openModal(options) {
    const opts = options || {};
    const root = document.getElementById("modal-root");
    if (!root) return { close() {}, el: null };
    const previouslyFocused = document.activeElement;
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal${opts.wide ? " modal-wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(opts.title || "")}">
          <div class="modal-head">
            <div>
              <h2>${opts.title || ""}</h2>
              ${opts.subtitle ? `<p>${opts.subtitle}</p>` : ""}
            </div>
            <button class="icon-btn modal-close" type="button" data-modal-close aria-label="${I18n.t("common.close")}">${icon("x")}</button>
          </div>
          <div class="modal-body">${opts.body || ""}</div>
          ${opts.footer ? `<div class="modal-foot">${opts.footer}</div>` : ""}
        </div>
      </div>`;
    const backdrop = root.querySelector("[data-modal-backdrop]");
    const modal = root.querySelector(".modal");
    let closed = false;

    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKey);
      root.innerHTML = "";
      if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
      if (opts.onClose) opts.onClose();
    }

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    }

    backdrop.addEventListener("mousedown", (event) => {
      if (event.target === backdrop) close();
    });
    root.querySelectorAll("[data-modal-close]").forEach((btn) => btn.addEventListener("click", close));
    document.addEventListener("keydown", onKey);
    if (opts.onMount) opts.onMount(modal, close);
    const first = modal.querySelector("input:not([type=hidden]), select, textarea");
    if (first) setTimeout(() => first.focus(), 40);
    return { el: modal, close };
  }

  function confirmAction(options) {
    const opts = options || {};
    return new Promise((resolve) => {
      let resolved = false;
      const finish = (value) => {
        if (resolved) return;
        resolved = true;
        resolve(value);
        modal.close();
      };
      const modal = openModal({
        title: opts.title || I18n.t("common.confirmTitle"),
        body: `<p class="confirm-copy">${opts.message || ""}</p>`,
        footer: `
          <button type="button" class="btn" data-modal-close>${esc(opts.cancelLabel || I18n.t("common.cancel"))}</button>
          <button type="button" class="btn ${opts.danger ? "btn-danger" : "btn-primary"}" data-confirm>${esc(opts.confirmLabel || I18n.t("common.delete"))}</button>
        `,
        onMount(el, close) {
          el.querySelector("[data-confirm]").addEventListener("click", () => finish(true));
          el.querySelector("[data-modal-close]").addEventListener("click", () => finish(false));
          el.querySelectorAll(".modal-head [data-modal-close]").forEach((btn) => btn.addEventListener("click", () => finish(false)));
          el.closest(".modal-backdrop").addEventListener("mousedown", (event) => {
            if (event.target === event.currentTarget) finish(false);
          });
          el.closest(".modal-backdrop").addEventListener("keydown", (event) => {
            if (event.key === "Escape") finish(false);
          });
        },
        onClose() { if (!resolved) { resolved = true; resolve(false); } },
      });
      void modal;
    });
  }

  function templateThumb(template) {
    if (template === "chest") {
      return `<svg viewBox="0 0 40 52" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5" y="5" width="30" height="42" rx="2"/>
        <path d="M5 19h30M5 33h30M17 12h6M17 26h6M17 40h6"/>
      </svg>`;
    }
    if (template === "rack") {
      return `<svg viewBox="0 0 40 52" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 5h28v42H6zM6 18h28M6 31h28M6 44h28"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 40 52" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="5" y="5" width="30" height="42" rx="2"/>
      <path d="M20 5v42M5 22h30M17 15h-2M23 15h2"/>
    </svg>`;
  }

  function edgeDots(part) {
    const parts = [["t", "edgeTop"], ["b", "edgeBottom"], ["l", "edgeLeft"], ["r", "edgeRight"]];
    return `<span class="edge-dots">${parts.map(([key, label]) =>
      `<span class="edge-dot ${part.edges && part.edges[key] ? "on" : ""}" title="${esc(I18n.t(`parts.${label}`))}"></span>`
    ).join("")}</span>`;
  }

  function badge(text, variant) {
    return `<span class="badge ${variant ? `badge-${variant}` : ""}">${esc(text)}</span>`;
  }

  function emptyState(iconName, title, text, actions) {
    return `<div class="empty">
      <div class="empty-icon">${icon(iconName)}</div>
      <h3>${esc(title)}</h3>
      <p>${esc(text)}</p>
      ${actions || ""}
    </div>`;
  }

  function pageHead(title, subtitle, actions) {
    return `<div class="page-head">
      <div class="page-head-copy">
        <h2>${esc(title)}</h2>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ""}
    </div>`;
  }

  function metric(label, value, sub, iconName) {
    return `<div class="metric">
      ${iconName ? `<span class="metric-icon">${icon(iconName)}</span>` : ""}
      <span class="metric-label">${esc(label)}</span>
      <span class="metric-value">${value}</span>
      ${sub ? `<span class="metric-sub">${sub}</span>` : ""}
    </div>`;
  }

  function switchRow(options) {
    const o = options || {};
    return `<label class="switch-row">
      <span class="switch-copy">
        <span class="switch-title">${esc(o.title || "")}</span>
        ${o.sub ? `<span class="switch-sub">${esc(o.sub)}</span>` : ""}
      </span>
      <span class="switch">
        <input type="checkbox" ${o.checked ? "checked" : ""} ${o.data || ""}>
        <span class="switch-track"></span>
      </span>
    </label>`;
  }

  function money(project, value) {
    return I18n.money(value, project ? project.currency : "RUB");
  }

  function parseNumber(value, fallback) {
    const normalized = String(value == null ? "" : value).replace(",", ".").replace(/[^\d.-]/g, "");
    const n = Number(normalized);
    return Number.isFinite(n) ? n : fallback;
  }

  window.UI = {
    esc, icon, toast, openModal, confirm: confirmAction, templateThumb, edgeDots,
    badge, emptyState, pageHead, metric, switchRow, money, parseNumber,
  };
})();

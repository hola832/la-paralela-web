(() => {
  "use strict";

  const measurementId = "G-E89SL8D5CH";
  const preferenceKey = "la-paralela.analytics-consent";
  const lifetimeSeconds = 365 * 24 * 60 * 60;
  const disableKey = "ga-disable-" + measurementId;
  let choice = null;
  let analyticsStarted = false;
  let returnFocus = false;

  const notice = document.createElement("aside");
  notice.id = "cookie-notice";
  notice.className = "cookie-notice";
  notice.setAttribute("aria-labelledby", "cookie-notice-title");
  notice.hidden = true;
  notice.innerHTML = `
    <h2 id="cookie-notice-title" tabindex="-1" aria-label="Cookies de analítica">Cookies de anal<span class="ofelia-char ofelia-weight-800 ofelia-acute ofelia-dotless" style="--ofelia-width-adjust:0.067000em;--ofelia-center:0.148438em;--ofelia-advance:0.303000em;--ofelia-half-box:0.660000em;"><span class="ofelia-source">í</span><span class="ofelia-paint" aria-hidden="true" data-base="i"></span></span>tica</h2>
    <p>Utilizamos Google Analytics para conocer de forma general cómo se utiliza la web y mejorarla. Puede aceptar o rechazar estas cookies.</p>
    <div class="cookie-notice-actions">
      <button class="button cookie-choice" type="button" data-cookie-choice="accepted">Aceptar</button>
      <button class="button cookie-choice" type="button" data-cookie-choice="rejected">Rechazar</button>
      <a class="cookie-more" href="cookies.html">Más información</a>
    </div>`;

  document.querySelector("main").before(notice);

  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "cookie-settings";
  settings.textContent = "Configurar cookies";
  settings.setAttribute("aria-controls", notice.id);
  const footer = document.querySelector(".footer-bottom");
  footer.insertBefore(settings, footer.lastElementChild);

  function readPreference() {
    try {
      const saved = JSON.parse(localStorage.getItem(preferenceKey));
      if (saved && Number.isFinite(saved.expires) && saved.expires > Date.now()) {
        if (saved.choice === "accepted" || saved.choice === "rejected") return saved.choice;
      }
    } catch {
      // Una preferencia ilegible requiere una nueva decisión.
    }
    return null;
  }

  function rememberPreference(value) {
    try {
      localStorage.setItem(preferenceKey, JSON.stringify({
        choice: value,
        expires: Date.now() + lifetimeSeconds * 1000,
      }));
      return true;
    } catch {
      try {
        localStorage.removeItem(preferenceKey);
      } catch {
        // La decisión actual se aplica aunque el navegador bloquee el almacenamiento.
      }
      return false;
    }
  }

  function startAnalytics() {
    if (analyticsStarted) return;
    analyticsStarted = true;

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;

    gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    gtag("consent", "update", { analytics_storage: "granted" });
    gtag("set", {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: lifetimeSeconds,
      cookie_update: false,
      cookie_path: "/",
      cookie_flags: "SameSite=Lax;Secure",
    });
    gtag("js", new Date());
    gtag("config", measurementId);

    const tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    document.head.append(tag);
  }

  function removeAnalyticsCookies() {
    const domains = new Set([location.hostname, location.hostname.replace(/^www\./, "")]);
    for (const entry of document.cookie.split(";")) {
      const name = entry.split("=", 1)[0].trim();
      if (!/^_ga(?:_[a-z0-9]+)?$/i.test(name)) continue;
      const expired = name + "=; Max-Age=0; Path=/";
      document.cookie = expired;
      for (const domain of domains) {
        document.cookie = expired + "; Domain=" + domain;
      }
    }
  }

  function showNotice(open) {
    notice.hidden = !open;
    settings.setAttribute("aria-expanded", String(open));
  }

  function applyPreference(value, canReload = false) {
    const reload = canReload && analyticsStarted && choice === "accepted" && value !== "accepted";
    choice = value;
    window[disableKey] = choice !== "accepted";

    if (choice === "accepted") {
      startAnalytics();
    } else {
      removeAnalyticsCookies();
    }

    showNotice(choice === null);
    if (reload) location.reload();
  }

  settings.addEventListener("click", () => {
    returnFocus = true;
    showNotice(true);
    notice.querySelector("h2").focus({ preventScroll: true });
  });

  for (const button of notice.querySelectorAll("[data-cookie-choice]")) {
    button.addEventListener("click", () => {
      const value = button.dataset.cookieChoice;
      const saved = rememberPreference(value);
      applyPreference(value, saved);
      if (returnFocus) settings.focus({ preventScroll: true });
      returnFocus = false;
    });
  }

  function syncPreference() {
    const saved = readPreference();
    if (saved !== choice) applyPreference(saved, true);
  }

  window.addEventListener("storage", (event) => {
    if (event.key === preferenceKey || event.key === null) syncPreference();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) syncPreference();
  });

  applyPreference(readPreference());
})();

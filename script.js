(() => {
  "use strict";

  const root = document.documentElement;
  const sitePages = JSON.parse(document.querySelector("#site-pages").textContent);
  const siteOrigin = "https://guilhermebugliani-dev.vercel.app";
  const isLocalFile = location.protocol === "file:";
  const pages = [...document.querySelectorAll(".page")];
  const navLinks = [...document.querySelectorAll(".navigation a")];
  const projectsList = document.querySelector(".projects-copy");
  const scrollHint = document.querySelector(".projects-scroll-hint");
  const siteLoader = document.querySelector(".site-loader");
  const loaderStartedAt = performance.now();
  let currentSection = sectionFromLocation();
  let transitionId = 0;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function sectionFromLocation() {
    const legacySection = location.hash.slice(1);
    if (Object.hasOwn(sitePages, legacySection)) return legacySection;
    const path = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "").replace(/\/$/, "") || "/";
    return Object.keys(sitePages).find((id) => sitePages[id].path === path) || "home";
  }

  function updateBrowserHistory(sectionId, replace = false) {
    const url = isLocalFile ? `#${sectionId}` : sitePages[sectionId].path + location.search;
    try {
      history[replace ? "replaceState" : "pushState"]({ section: sectionId }, "", url);
    } catch {
      // Restricted previews may forbid the History API; keep navigation usable.
      location.hash = sectionId;
    }
  }

  function updatePageMetadata(sectionId) {
    const page = sitePages[sectionId];
    const url = `${siteOrigin}${page.path}`;
    document.title = page.title;
    document.querySelector('link[rel="canonical"]').href = url;
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]']) {
      document.querySelector(selector).content = page.description;
    }
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      document.querySelector(selector).content = page.title;
    }
    document.querySelector('meta[property="og:url"]').content = url;
    const element = document.querySelector("#structured-data");
    const data = JSON.parse(element.textContent);
    const webpage = data["@graph"].find((item) => item["@id"].endsWith("#webpage"));
    Object.assign(webpage, { "@type": page.type, "@id": `${url}#webpage`, url, name: page.title, description: page.description });
    element.textContent = JSON.stringify(data);
    for (const id of Object.keys(sitePages)) {
      const heading = document.getElementById(`${id}-title`);
      const tag = id === sectionId ? "h1" : "h2";
      if (!heading || heading.localName === tag) continue;
      const replacement = document.createElement(tag);
      for (const attribute of heading.attributes) replacement.setAttribute(attribute.name, attribute.value);
      replacement.append(...heading.childNodes);
      heading.replaceWith(replacement);
    }
  }

  function dismissLoader() {
    if (!siteLoader || siteLoader.classList.contains("is-leaving")) return;
    const minimumDisplayTime = reducedMotion ? 0 : 2400;
    const waitForMinimum = Math.max(0, minimumDisplayTime - (performance.now() - loaderStartedAt));
    window.setTimeout(() => {
      if (!siteLoader.isConnected || siteLoader.classList.contains("is-leaving")) return;
      siteLoader.classList.add("is-leaving");
      window.setTimeout(() => {
        siteLoader.remove();
        root.classList.remove("has-loader");
      }, reducedMotion ? 0 : 950);
    }, waitForMinimum);
  }

  if (siteLoader) {
    if (document.readyState === "complete") dismissLoader();
    else window.addEventListener("load", dismissLoader, { once: true });
  }

  function updateProjectsScrollHint() {
    if (!projectsList) return;
    const canScroll = projectsList.scrollHeight > projectsList.clientHeight + 2;
    const hasItemsAbove = projectsList.scrollTop > 2;
    const hasItemsBelow = projectsList.scrollTop + projectsList.clientHeight < projectsList.scrollHeight - 2;
    projectsList.classList.toggle("has-items-above", canScroll && hasItemsAbove);
    projectsList.classList.toggle("has-items-below", canScroll && hasItemsBelow);
    if (scrollHint) scrollHint.hidden = !canScroll || hasItemsAbove;
  }

  projectsList?.addEventListener("scroll", updateProjectsScrollHint, { passive: true });
  window.addEventListener("resize", updateProjectsScrollHint, { passive: true });

  document.querySelectorAll(".code-backdrop__text code").forEach((element) => {
    const fullText = element.textContent.trim();
    if (reducedMotion) {
      element.textContent = fullText;
      return;
    }

    element.textContent = "";
    const typeCode = async () => {
      while (true) {
        for (let index = 1; index <= fullText.length; index += 1) {
          element.textContent = fullText.slice(0, index);
          await new Promise((resolve) => setTimeout(resolve, 22));
        }
        await new Promise((resolve) => setTimeout(resolve, 900));
        for (let index = fullText.length - 1; index >= 0; index -= 1) {
          element.textContent = fullText.slice(0, index);
          await new Promise((resolve) => setTimeout(resolve, 7));
        }
      }
    };
    typeCode();
  });

  if (!reducedMotion) {
    let pointerFrame = 0;
    window.addEventListener("pointermove", (event) => {
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth - 0.5) * 42;
        const y = (event.clientY / window.innerHeight - 0.5) * 30;
        root.style.setProperty("--field-x", `${x.toFixed(1)}px`);
        root.style.setProperty("--field-y", `${y.toFixed(1)}px`);
        pointerFrame = 0;
      });
    }, { passive: true });
  }

  function setTheme(theme, persist = true) {
    root.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const label = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
      button.setAttribute("aria-label", label);
      button.title = label;
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#e5e5e5" : "#000000");
    if (persist) localStorage.setItem("portfolio-theme", theme);
  }

  async function showSection(sectionId, updateHistory = true) {
    const nextPage = pages.find((page) => page.id === sectionId);
    if (!nextPage || sectionId === currentSection) return;

    const previousPage = pages.find((page) => page.id === currentSection);
    const token = ++transitionId;
    if (sectionId === "projects") nextPage.querySelector(".projects-copy")?.scrollTo({ top: 0 });
    currentSection = sectionId;
    navLinks.forEach((link) => {
      const active = link.dataset.section === sectionId;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (updateHistory) updateBrowserHistory(sectionId);
    updatePageMetadata(sectionId);

    const outgoing = previousPage?.querySelector(".page-copy");
    if (outgoing && !reducedMotion) {
      await outgoing.animate(
        [{ opacity: 1, transform: "translateY(0)" }, { opacity: 0, transform: "translateY(-6px)" }],
        { duration: 150, easing: "ease-in", fill: "forwards" }
      ).finished.catch(() => {});
    }
    if (token !== transitionId) return;

    pages.forEach((page) => {
      const active = page === nextPage;
      page.hidden = !active;
      page.classList.toggle("active", active);
    });
    if (sectionId === "projects") updateProjectsScrollHint();
    nextPage.focus({ preventScroll: true });
    const incoming = nextPage.querySelector(".page-copy");
    if (incoming && !reducedMotion) {
      await incoming.animate(
        [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 340, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" }
      ).finished.catch(() => {});
    }
  }

  document.querySelectorAll("a[data-section]").forEach((link) => {
    if (isLocalFile) link.href = `#${link.dataset.section}`;
    link.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showSection(link.dataset.section);
    });
  });
  window.addEventListener("popstate", () => showSection(sectionFromLocation(), false));
  window.addEventListener("hashchange", () => showSection(sectionFromLocation(), false));

  const savedTheme = localStorage.getItem("portfolio-theme");
  setTheme(savedTheme === "light" ? "light" : "dark", false);
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
  });

  const initialPage = pages.find((page) => page.id === currentSection) || pages.find((page) => page.id === "home");
  if (initialPage) {
    currentSection = initialPage.id;
    updatePageMetadata(currentSection);
    if (!isLocalFile && Object.hasOwn(sitePages, location.hash.slice(1))) {
      updateBrowserHistory(currentSection, true);
    }
    pages.forEach((page) => {
      const active = page === initialPage;
      page.hidden = !active;
      page.classList.toggle("active", active);
    });
    navLinks.forEach((link) => {
      const active = link.dataset.section === currentSection;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    if (initialPage.id === "projects") updateProjectsScrollHint();
  }
})();

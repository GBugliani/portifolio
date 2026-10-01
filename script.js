(() => {
  "use strict";

  const root = document.documentElement;
  const pages = [...document.querySelectorAll(".page")];
  const navLinks = [...document.querySelectorAll(".navigation a")];
  let currentSection = location.hash.slice(1) || "home";
  let transitionId = 0;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    document.querySelectorAll("[data-theme-choice]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.themeChoice === theme));
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "light" ? "#e5e5e5" : "#080808");
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
    if (updateHistory) history.pushState({ section: sectionId }, "", `#${sectionId}`);

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
    const incoming = nextPage.querySelector(".page-copy");
    if (incoming && !reducedMotion) {
      await incoming.animate(
        [{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 340, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" }
      ).finished.catch(() => {});
    }
  }

  navLinks.forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    showSection(link.dataset.section);
  }));
  document.querySelector(".name")?.addEventListener("click", (event) => {
    event.preventDefault();
    showSection("home");
  });
  document.querySelectorAll('[href="#projects"]').forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    showSection("projects");
  }));
  window.addEventListener("popstate", () => showSection(location.hash.slice(1) || "home", false));

  const savedTheme = localStorage.getItem("portfolio-theme");
  setTheme(savedTheme === "light" ? "light" : "dark", false);
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
  });

  const initialPage = pages.find((page) => page.id === currentSection) || pages.find((page) => page.id === "home");
  if (initialPage) {
    currentSection = initialPage.id;
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
  }
})();

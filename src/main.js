import { gsap } from "gsap";

import "./styles.css";
import { createHeroScene } from "./scene/heroScene.js";
import {
  curatedHeroAssetKeys,
  resolveHeroAssetKey,
} from "./scene/heroAssetRegistry.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const heroCanvas = document.querySelector("[data-hero-canvas]");
const heroStage = document.querySelector("[data-hero-stage]");
const selectedHeroAssetKey = resolveHeroAssetKey(window.location.search);

const heroScene = heroCanvas
  ? createHeroScene({
      container: heroCanvas,
      interactionTarget: heroStage ?? window,
      reducedMotion: prefersReducedMotion,
      assetKey: selectedHeroAssetKey,
    })
  : null;

const disposeContact = initializeContactShell();

runIntroSequence();
registerHeroControls();
schedulePostReadyAssetPreload();

window.addEventListener("pagehide", destroyApp, { once: true });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    destroyApp();
  });
}

let hasDestroyed = false;
let assetPreloadHandle = 0;
let assetPreloadMode = "";

function destroyApp() {
  if (hasDestroyed) {
    return;
  }

  hasDestroyed = true;

  if (window.realRustHero?.setAsset === heroScene?.setAsset) {
    delete window.realRustHero;
  }

  if (assetPreloadHandle) {
    if (assetPreloadMode === "idle" && "cancelIdleCallback" in window) {
      window.cancelIdleCallback(assetPreloadHandle);
    }

    if (assetPreloadMode === "timeout") {
      window.clearTimeout(assetPreloadHandle);
    }

    assetPreloadHandle = 0;
    assetPreloadMode = "";
  }

  disposeContact?.();
  heroScene?.destroy?.();
}

function registerHeroControls() {
  if (!heroScene) {
    return;
  }

  window.realRustHero = {
    assets: curatedHeroAssetKeys,
    setAsset: (key) => heroScene.setAsset(key),
    getCurrentAsset: () => heroScene.getAssetKey(),
  };
}

function schedulePostReadyAssetPreload() {
  if (!heroScene) {
    return;
  }

  heroScene.whenReady().then((readyKey) => {
    if (!readyKey || hasDestroyed) {
      return;
    }

    scheduleAssetPreload();
  });
}

function scheduleAssetPreload() {
  if (!heroScene) {
    return;
  }

  const activeAssetKey = heroScene.getAssetKey();
  const remainingAssetKeys = curatedHeroAssetKeys.filter((key) => key !== activeAssetKey);

  if (!remainingAssetKeys.length) {
    return;
  }

  const preload = () => {
    assetPreloadHandle = 0;
    assetPreloadMode = "";
    heroScene.preloadAssets(remainingAssetKeys);
  };

  if ("requestIdleCallback" in window) {
    assetPreloadMode = "idle";
    assetPreloadHandle = window.requestIdleCallback(preload, { timeout: 1800 });
    return;
  }

  assetPreloadMode = "timeout";
  assetPreloadHandle = window.setTimeout(preload, 1200);
}

function runIntroSequence() {
  if (prefersReducedMotion) {
    return;
  }

  const headlineLines = gsap.utils.toArray("[data-intro='headline']");
  const wordmark = document.querySelector("[data-intro='wordmark']");
  const utility = document.querySelector("[data-intro='utility']");
  const rail = document.querySelector("[data-intro='rail']");
  const support = document.querySelector("[data-intro='support']");
  const action = document.querySelector("[data-intro='action']");

  gsap
    .timeline({
      defaults: {
        duration: 1,
        ease: "power3.out",
      },
    })
    .from(wordmark, {
      autoAlpha: 0,
      y: -20,
    })
    .from(
      utility,
      {
        autoAlpha: 0,
        y: -12,
      },
      0.08,
    )
    .from(
      headlineLines,
      {
        autoAlpha: 0,
        y: 68,
        stagger: 0.12,
        duration: 1.2,
      },
      0.18,
    )
    .from(
      rail,
      {
        autoAlpha: 0,
        y: 28,
        scale: 0.985,
        duration: 1.05,
      },
      0.46,
    )
    .from(
      [support, action],
      {
        autoAlpha: 0,
        y: 18,
        stagger: 0.08,
        duration: 0.8,
      },
      0.62,
    );
}

function initializeContactShell() {
  const contactShell = document.querySelector("[data-contact-shell]");
  const contactPanel = document.querySelector("[data-contact-panel]");
  const contactToggle = document.querySelector("[data-contact-toggle]");
  const copyEmailButton = document.querySelector("[data-copy-email]");
  const contactFeedback = document.querySelector("[data-contact-feedback]");

  if (!contactShell || !contactPanel || !contactToggle || !copyEmailButton || !contactFeedback) {
    return () => {};
  }

  const emailAddress = "hello@realrust.studio";
  const defaultCopyLabel = copyEmailButton.textContent.trim() || "Copy email";
  let feedbackTimeout = 0;

  const clearFeedbackTimeout = () => {
    if (!feedbackTimeout) {
      return;
    }

    window.clearTimeout(feedbackTimeout);
    feedbackTimeout = 0;
  };

  const setContactStatus = (status, message = "") => {
    contactShell.dataset.status = status;
    contactFeedback.textContent = message;

    if (status === "copied") {
      copyEmailButton.textContent = "Copied";
      return;
    }

    if (status === "error") {
      copyEmailButton.textContent = "Copy unavailable";
      return;
    }

    copyEmailButton.textContent = defaultCopyLabel;
  };

  const setContactOpen = (isOpen) => {
    contactShell.dataset.open = isOpen ? "true" : "false";
    contactToggle.setAttribute("aria-expanded", String(isOpen));
    contactPanel.setAttribute("aria-hidden", String(!isOpen));

    if (!isOpen) {
      clearFeedbackTimeout();
      setContactStatus("idle");
    }
  };

  const scheduleFeedbackReset = (delay) => {
    clearFeedbackTimeout();
    feedbackTimeout = window.setTimeout(() => {
      setContactStatus("idle");
      feedbackTimeout = 0;
    }, delay);
  };

  const copyEmailToClipboard = async () => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(emailAddress);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = emailAddress;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.append(textarea);
    textarea.select();

    const copied = document.execCommand("copy");
    textarea.remove();

    if (!copied) {
      throw new Error("copy-failed");
    }
  };

  const handleToggleClick = () => {
    const isOpen = contactShell.dataset.open === "true";

    if (isOpen) {
      setContactOpen(false);
      return;
    }

    setContactStatus("idle");
    setContactOpen(true);
  };

  const handleCopyClick = async () => {
    setContactOpen(true);

    try {
      await copyEmailToClipboard();
      setContactStatus("copied", "Email copied to clipboard.");
      scheduleFeedbackReset(1800);
    } catch {
      setContactStatus("error", "Copy unavailable. Use the address shown.");
      scheduleFeedbackReset(2200);
    }
  };

  const handleDocumentPointerDown = (event) => {
    if (contactShell.dataset.open !== "true") {
      return;
    }

    if (event.target instanceof Node && !contactShell.contains(event.target)) {
      setContactOpen(false);
    }
  };

  const handleDocumentKeydown = (event) => {
    if (event.key === "Escape" && contactShell.dataset.open === "true") {
      setContactOpen(false);
      contactToggle.focus();
    }
  };

  contactToggle.addEventListener("click", handleToggleClick);
  copyEmailButton.addEventListener("click", handleCopyClick);
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  document.addEventListener("keydown", handleDocumentKeydown);

  const contactMode = new URL(window.location.href).searchParams.get("contact");

  if (contactMode === "open") {
    setContactOpen(true);
  }

  return () => {
    clearFeedbackTimeout();
    contactToggle.removeEventListener("click", handleToggleClick);
    copyEmailButton.removeEventListener("click", handleCopyClick);
    document.removeEventListener("pointerdown", handleDocumentPointerDown);
    document.removeEventListener("keydown", handleDocumentKeydown);
  };
}

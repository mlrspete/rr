import { gsap } from "gsap";

import "./styles.css";
import { getHeroViewportKey, resolveHeroAssetPreloadConfig } from "./scene/config.js";
import { createHeroScene } from "./scene/heroScene.js";
import { curatedHeroAssetKeys, resolveHeroAssetKey } from "./scene/heroAssetRegistry.js";
import {
  defaultHeroRendererMode,
  experimentalHeroRendererMode,
  resolveHeroRendererMode,
} from "./scene/heroRendererMode.js";
import {
  hasExplicitHeroEnvironmentSelection,
  resolveHeroEnvironmentKey,
} from "./scene/heroEnvironmentRegistry.js";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const heroCanvas = document.querySelector("[data-hero-canvas]");
const heroStage = document.querySelector("[data-hero-stage]");
const selectedHeroAssetKey = resolveHeroAssetKey(window.location.search);
const selectedHeroEnvironmentKey = resolveHeroEnvironmentKey(window.location.search);
const hasExplicitHeroEnvironment = hasExplicitHeroEnvironmentSelection(window.location.search);
const selectedHeroRendererMode = resolveHeroRendererMode(window.location.search);
const heroRuntimeHints = getHeroRuntimeHints();
const heroViewportKey = getHeroViewportKey(
  heroCanvas?.clientWidth ?? heroStage?.clientWidth ?? window.innerWidth,
);
const heroAssetPreloadConfig = resolveHeroAssetPreloadConfig(
  heroViewportKey,
  prefersReducedMotion,
  heroRuntimeHints,
);
const heroSceneOptions = {
  container: heroCanvas,
  interactionTarget: heroStage ?? window,
  reducedMotion: prefersReducedMotion,
  assetKey: selectedHeroAssetKey,
  environmentKey: selectedHeroEnvironmentKey,
  forceEnvironment: hasExplicitHeroEnvironment,
  runtimeHints: heroRuntimeHints,
};
let heroRendererBootState = {
  requested: selectedHeroRendererMode,
  active: defaultHeroRendererMode,
  fallbackReason: "",
};

applyHeroRendererBootState();

const disposeContact = initializeContactShell();

runIntroSequence();
void initializeHero();

window.addEventListener("pagehide", destroyApp, { once: true });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    destroyApp();
  });
}

let hasDestroyed = false;
let assetPreloadHandle = 0;
let assetPreloadMode = "";
let heroScene = null;

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

async function initializeHero() {
  if (!heroCanvas) {
    return;
  }

  const nextHeroScene = await createConfiguredHeroScene();

  if (!nextHeroScene || hasDestroyed) {
    nextHeroScene?.destroy?.();
    return;
  }

  heroScene = nextHeroScene;
  updateHeroRendererBootState({
    active: heroScene.getRendererMode?.() ?? defaultHeroRendererMode,
    fallbackReason:
      selectedHeroRendererMode === experimentalHeroRendererMode &&
      (heroScene.getRendererMode?.() ?? defaultHeroRendererMode) !== experimentalHeroRendererMode
        ? heroRendererBootState.fallbackReason || "fallback"
        : "",
  });
  registerHeroControls();
  schedulePostReadyAssetPreload();
}

async function createConfiguredHeroScene() {
  if (selectedHeroRendererMode === experimentalHeroRendererMode) {
    const { scene, fallbackReason } = await tryCreateWebGPUHeroScene();

    if (scene) {
      updateHeroRendererBootState({
        requested: experimentalHeroRendererMode,
        active: experimentalHeroRendererMode,
        fallbackReason: "",
      });
      return scene;
    }

    updateHeroRendererBootState({
      requested: experimentalHeroRendererMode,
      active: defaultHeroRendererMode,
      fallbackReason,
    });
  }

  updateHeroRendererBootState({
    requested: selectedHeroRendererMode,
    active: defaultHeroRendererMode,
    fallbackReason: "",
  });
  return createHeroScene(heroSceneOptions);
}

async function tryCreateWebGPUHeroScene() {
  if (!(await supportsWebGPU())) {
    return {
      scene: null,
      fallbackReason: "unsupported",
    };
  }

  try {
    const module = await import("./scene/webgpu/createHeroSceneWebGPU.js");
    const scene = await module.createHeroSceneWebGPU(heroSceneOptions);
    return {
      scene,
      fallbackReason: scene ? "" : "init-failed",
    };
  } catch {
    return {
      scene: null,
      fallbackReason: "init-failed",
    };
  }
}

function registerHeroControls() {
  if (!heroScene) {
    return;
  }

  window.realRustHero = {
    requestedRenderer: selectedHeroRendererMode,
    assets: curatedHeroAssetKeys,
    setAsset: (key) => heroScene.setAsset(key),
    getCurrentAsset: () => heroScene.getAssetKey(),
    getRequestedRenderer: () => heroRendererBootState.requested,
    getFallbackReason: () => heroRendererBootState.fallbackReason,
    getBootState: () => ({ ...heroRendererBootState }),
    getRendererMode: () => heroScene.getRendererMode?.() ?? defaultHeroRendererMode,
  };
}

function updateHeroRendererBootState(nextState = {}) {
  heroRendererBootState = {
    ...heroRendererBootState,
    ...nextState,
  };
  applyHeroRendererBootState();
}

function applyHeroRendererBootState() {
  if (!heroCanvas) {
    return;
  }

  heroCanvas.dataset.requestedRenderer = heroRendererBootState.requested;
  heroCanvas.dataset.activeRenderer = heroRendererBootState.active;

  if (heroRendererBootState.fallbackReason) {
    heroCanvas.dataset.fallbackReason = heroRendererBootState.fallbackReason;
    return;
  }

  delete heroCanvas.dataset.fallbackReason;
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
  if (!heroScene || !heroAssetPreloadConfig.enabled) {
    return;
  }

  const activeAssetKey = heroScene.getAssetKey();
  const remainingAssetKeys = curatedHeroAssetKeys
    .filter((key) => key !== activeAssetKey)
    .slice(0, heroAssetPreloadConfig.maxCount);

  if (!remainingAssetKeys.length) {
    return;
  }

  const preload = () => {
    assetPreloadHandle = 0;
    assetPreloadMode = "";
    heroScene.preloadAssets(remainingAssetKeys);
  };

  const queueIdlePreload = () => {
    if ("requestIdleCallback" in window) {
      assetPreloadMode = "idle";
      assetPreloadHandle = window.requestIdleCallback(preload, {
        timeout: heroAssetPreloadConfig.idleTimeout,
      });
      return;
    }

    assetPreloadMode = "timeout";
    assetPreloadHandle = window.setTimeout(preload, 0);
  };

  if ((heroAssetPreloadConfig.delayMs ?? 0) > 0) {
    assetPreloadMode = "timeout";
    assetPreloadHandle = window.setTimeout(() => {
      assetPreloadHandle = 0;
      assetPreloadMode = "";
      queueIdlePreload();
    }, heroAssetPreloadConfig.delayMs);
    return;
  }

  queueIdlePreload();
}

function getHeroRuntimeHints() {
  const connection =
    navigator.connection ?? navigator.mozConnection ?? navigator.webkitConnection ?? null;

  return {
    deviceMemory: navigator.deviceMemory ?? 0,
    saveData: Boolean(connection?.saveData),
  };
}

async function supportsWebGPU() {
  if (!navigator.gpu) {
    return false;
  }

  try {
    return Boolean(await navigator.gpu.requestAdapter());
  } catch {
    return false;
  }
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

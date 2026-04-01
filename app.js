const heroStage = document.querySelector("[data-hero-stage]");
const sceneComposition = document.querySelector(".scene-composition");
const membraneElement = document.querySelector(".scene-optic--membrane");

const castElements = new Map(
  [...document.querySelectorAll("[data-cast]")].map((element) => [element.dataset.cast, element]),
);
const eventElements = new Map(
  [...document.querySelectorAll("[data-event]")].map((element) => [element.dataset.event, element]),
);
const ghostElements = new Map(
  [...document.querySelectorAll("[data-ghost]")].map((element) => [element.dataset.ghost, element]),
);
const rustElements = new Map(
  [...document.querySelectorAll("[data-rust]")].map((element) => [element.dataset.rust, element]),
);
const contactShell = document.querySelector("[data-contact-shell]");
const contactPanel = document.querySelector("[data-contact-panel]");
const contactToggle = document.querySelector("[data-contact-toggle]");
const copyEmailButton = document.querySelector("[data-copy-email]");
const contactFeedback = document.querySelector("[data-contact-feedback]");
const contactMailLinks = [...document.querySelectorAll("[data-contact-panel] a[href^='mailto:']")];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const emailAddress = "hello@realrust.studio";

if (document.body) {
  if (reduceMotion) {
    document.body.classList.add("is-ready");
  } else {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        document.body.classList.add("is-ready");
      });
    });
  }
}

if (contactShell && contactPanel && contactToggle && copyEmailButton && contactFeedback) {
  let feedbackTimeout = 0;
  let closeTimeout = 0;

  const clearFeedbackTimeout = () => {
    if (!feedbackTimeout) {
      return;
    }

    window.clearTimeout(feedbackTimeout);
    feedbackTimeout = 0;
  };

  const clearCloseTimeout = () => {
    if (!closeTimeout) {
      return;
    }

    window.clearTimeout(closeTimeout);
    closeTimeout = 0;
  };

  const setContactStatus = (status, message = "") => {
    contactShell.dataset.status = status;
    contactFeedback.textContent = message;
  };

  const setContactOpen = (isOpen) => {
    contactShell.dataset.open = isOpen ? "true" : "false";
    contactToggle.setAttribute("aria-expanded", String(isOpen));
    contactPanel.setAttribute("aria-hidden", String(!isOpen));

    if (!isOpen) {
      clearCloseTimeout();
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

  contactToggle.addEventListener("click", () => {
    const isOpen = contactShell.dataset.open === "true";

    if (isOpen) {
      setContactOpen(false);
      return;
    }

    clearCloseTimeout();
    setContactStatus("idle");
    setContactOpen(true);
  });

  copyEmailButton.addEventListener("click", async () => {
    setContactOpen(true);
    clearCloseTimeout();

    try {
      await copyEmailToClipboard();
      setContactStatus("copied", "Email copied to clipboard.");
      scheduleFeedbackReset(1800);
      closeTimeout = window.setTimeout(() => {
        setContactOpen(false);
      }, 1650);
    } catch {
      setContactStatus("error", "Copy unavailable. Open mail instead.");
      scheduleFeedbackReset(2200);
    }
  });

  for (const link of contactMailLinks) {
    link.addEventListener("click", () => {
      setContactStatus("idle");
      setContactOpen(false);
    });
  }

  document.addEventListener("pointerdown", (event) => {
    if (contactShell.dataset.open !== "true") {
      return;
    }

    if (event.target instanceof Node && !contactShell.contains(event.target)) {
      setContactOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && contactShell.dataset.open === "true") {
      setContactOpen(false);
      contactToggle.focus();
    }
  });

  const contactMode = new URL(window.location.href).searchParams.get("contact");

  if (contactMode === "open") {
    setContactOpen(true);
  }
}

if (heroStage && sceneComposition && membraneElement) {
  const root = document.documentElement;
  const state = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    layout: "",
    activeCast: [],
  };

  const castLayouts = {
    desktop: [
      {
        id: "sphere",
        rustId: "furnace",
        duration: 17.8,
        offset: 0.1,
        start: { x: -0.08, y: 0.24 },
        control: { x: 0.16, y: 0.15 },
        end: { x: 0.42, y: 0.29 },
        contact: { x: 0.545, y: 0.318 },
        release: { x: 0.606, y: 0.454 },
        lead: { x: 0.646, y: 0.446 },
        branchControl: { x: 0.718, y: 0.372 },
        branch: { x: 0.826, y: 0.312 },
        outputLayer: 6,
        drift: { x: 0.018, y: 0.024, speed: 0.82 },
        rotation: { base: -18, delta: 34, wobble: 5.5, contact: 18 },
        scale: { from: 1.04, to: 0.9 },
        compress: { x: 0.42, y: 0.14 },
        rustScale: { from: 0.74, to: 1.08 },
        rustRotation: { from: 10, to: -6 },
        staticPhase: 0.56,
      },
      {
        id: "capsule",
        rustId: "purifier",
        duration: 20.4,
        offset: 0.28,
        start: { x: -0.16, y: 0.6 },
        control: { x: 0.1, y: 0.52 },
        end: { x: 0.44, y: 0.49 },
        contact: { x: 0.548, y: 0.45 },
        release: { x: 0.606, y: 0.454 },
        lead: { x: 0.646, y: 0.446 },
        branchControl: { x: 0.704, y: 0.492 },
        branch: { x: 0.79, y: 0.56 },
        outputLayer: 5,
        drift: { x: 0.014, y: 0.018, speed: 0.66 },
        rotation: { base: -8, delta: 18, wobble: 3.8, contact: 10 },
        scale: { from: 1, to: 0.92 },
        compress: { x: 0.5, y: 0.08 },
        rustScale: { from: 0.8, to: 1.04 },
        rustRotation: { from: -4, to: 8 },
        staticPhase: 0.79,
      },
      {
        id: "cuboid",
        rustId: "box",
        duration: 21.8,
        offset: 0.46,
        start: { x: 0.06, y: 0.78 },
        control: { x: 0.22, y: 0.68 },
        end: { x: 0.5, y: 0.6 },
        contact: { x: 0.57, y: 0.54 },
        release: { x: 0.606, y: 0.454 },
        lead: { x: 0.646, y: 0.446 },
        branchControl: { x: 0.698, y: 0.61 },
        branch: { x: 0.894, y: 0.756 },
        outputLayer: 4,
        drift: { x: 0.012, y: 0.016, speed: 0.56 },
        rotation: { base: 14, delta: -9, wobble: 3.1, contact: 2 },
        scale: { from: 0.98, to: 0.9 },
        compress: { x: 0.28, y: 0.18 },
        rustScale: { from: 0.82, to: 1.04 },
        rustRotation: { from: 14, to: -6 },
        staticPhase: 0.9,
      },
    ],
    tablet: [
      {
        id: "sphere",
        rustId: "furnace",
        duration: 17.2,
        offset: 0.16,
        start: { x: 0.04, y: 0.38 },
        control: { x: 0.18, y: 0.31 },
        end: { x: 0.42, y: 0.34 },
        contact: { x: 0.548, y: 0.365 },
        release: { x: 0.612, y: 0.496 },
        lead: { x: 0.652, y: 0.488 },
        branchControl: { x: 0.722, y: 0.438 },
        branch: { x: 0.812, y: 0.374 },
        outputLayer: 6,
        drift: { x: 0.018, y: 0.022, speed: 0.82 },
        rotation: { base: -16, delta: 30, wobble: 5, contact: 16 },
        scale: { from: 1.02, to: 0.88 },
        compress: { x: 0.42, y: 0.14 },
        rustScale: { from: 0.74, to: 1 },
        rustRotation: { from: 10, to: -2 },
        staticPhase: 0.62,
      },
      {
        id: "monolith",
        rustId: "vending",
        duration: 19.4,
        offset: 0.36,
        start: { x: 0.14, y: 0.68 },
        control: { x: 0.26, y: 0.57 },
        end: { x: 0.44, y: 0.49 },
        contact: { x: 0.556, y: 0.44 },
        release: { x: 0.612, y: 0.496 },
        lead: { x: 0.652, y: 0.488 },
        branchControl: { x: 0.714, y: 0.57 },
        branch: { x: 0.85, y: 0.654 },
        outputLayer: 4,
        drift: { x: 0.01, y: 0.016, speed: 0.54 },
        rotation: { base: 12, delta: -10, wobble: 2.6, contact: 3 },
        scale: { from: 0.98, to: 0.86 },
        compress: { x: 0.22, y: 0.2 },
        rustScale: { from: 0.78, to: 1.02 },
        rustRotation: { from: 10, to: 0 },
        staticPhase: 0.86,
      },
    ],
    mobile: [
      {
        id: "sphere",
        rustId: "furnace",
        duration: 16.8,
        offset: 0.18,
        start: { x: 0.08, y: 0.46 },
        control: { x: 0.18, y: 0.39 },
        end: { x: 0.38, y: 0.34 },
        contact: { x: 0.558, y: 0.43 },
        release: { x: 0.614, y: 0.584 },
        lead: { x: 0.65, y: 0.574 },
        branchControl: { x: 0.724, y: 0.53 },
        branch: { x: 0.816, y: 0.478 },
        outputLayer: 6,
        drift: { x: 0.012, y: 0.016, speed: 0.72 },
        rotation: { base: -10, delta: 22, wobble: 3.2, contact: 10 },
        scale: { from: 0.98, to: 0.88 },
        compress: { x: 0.4, y: 0.14 },
        rustScale: { from: 0.72, to: 0.94 },
        rustRotation: { from: 8, to: -2 },
        staticPhase: 0.78,
      },
      {
        id: "capsule",
        rustId: "purifier",
        duration: 19.2,
        offset: 0.44,
        start: { x: 0.02, y: 0.64 },
        control: { x: 0.18, y: 0.57 },
        end: { x: 0.4, y: 0.5 },
        contact: { x: 0.566, y: 0.52 },
        release: { x: 0.614, y: 0.584 },
        lead: { x: 0.65, y: 0.574 },
        branchControl: { x: 0.706, y: 0.664 },
        branch: { x: 0.85, y: 0.784 },
        outputLayer: 4,
        drift: { x: 0.01, y: 0.012, speed: 0.54 },
        rotation: { base: -6, delta: 14, wobble: 2.8, contact: 12 },
        scale: { from: 0.96, to: 0.9 },
        compress: { x: 0.48, y: 0.08 },
        rustScale: { from: 0.82, to: 0.96 },
        rustRotation: { from: -4, to: 10 },
        staticPhase: 0.92,
      },
    ],
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const mix = (start, end, amount) => start + (end - start) * amount;

  const mixPoint = (start, end, amount) => ({
    x: mix(start.x, end.x, amount),
    y: mix(start.y, end.y, amount),
  });

  const smoothStep = (start, end, value) => {
    const t = clamp((value - start) / (end - start), 0, 1);
    return t * t * (3 - 2 * t);
  };

  const quadraticPoint = (start, control, end, t) => {
    const inverse = 1 - t;

    return {
      x: inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
      y: inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y,
    };
  };

  const cubicPoint = (start, controlA, controlB, end, t) => {
    const inverse = 1 - t;

    return {
      x:
        inverse * inverse * inverse * start.x +
        3 * inverse * inverse * t * controlA.x +
        3 * inverse * t * t * controlB.x +
        t * t * t * end.x,
      y:
        inverse * inverse * inverse * start.y +
        3 * inverse * inverse * t * controlA.y +
        3 * inverse * t * t * controlB.y +
        t * t * t * end.y,
    };
  };

  const resetElement = (element, hidden = false) => {
    element.hidden = hidden;
    element.style.opacity = "0";
    element.style.transform = "translate3d(-999px, -999px, 0)";
  };

  const syncActiveElements = () => {
    const activeCastIds = new Set(state.activeCast.map((config) => config.id));
    const activeRustIds = new Set(state.activeCast.map((config) => config.rustId));

    for (const [id, element] of castElements) {
      resetElement(element, !activeCastIds.has(id));
      if (!element.hidden) {
        element.style.setProperty("--cast-blur", "0px");
      }
    }

    for (const [id, element] of eventElements) {
      resetElement(element, !activeCastIds.has(id));
      if (!element.hidden) {
        element.style.setProperty("--react", "0");
      }
    }

    for (const [id, element] of ghostElements) {
      resetElement(element, !activeCastIds.has(id));
      if (!element.hidden) {
        element.style.setProperty("--ghost-blur", "16px");
        element.style.setProperty("--ghost-clarity", "0");
      }
    }

    for (const [id, element] of rustElements) {
      resetElement(element, !activeRustIds.has(id));
      if (!element.hidden) {
        element.style.setProperty("--rust-energy", "0");
      }
    }
  };

  const updateLayout = () => {
    const width = window.innerWidth;
    const nextLayout = width <= 680 ? "mobile" : width <= 900 ? "tablet" : "desktop";

    if (state.layout === nextLayout) {
      return;
    }

    state.layout = nextLayout;
    state.activeCast = castLayouts[nextLayout];
    syncActiveElements();
  };

  const applyCastFrame = (timeSeconds, staticMode = false) => {
    updateLayout();

    const compositionWidth = sceneComposition.clientWidth;
    const compositionHeight = sceneComposition.clientHeight;

    if (!compositionWidth || !compositionHeight) {
      return;
    }

    let membraneReaction = 0;

    for (const config of state.activeCast) {
      const castElement = castElements.get(config.id);
      const eventElement = eventElements.get(config.id);
      const ghostElement = ghostElements.get(config.id);
      const rustElement = rustElements.get(config.rustId);

      if (!castElement || !eventElement || !ghostElement || !rustElement) {
        continue;
      }

      const cycle = staticMode
        ? config.staticPhase
        : ((timeSeconds / config.duration) + config.offset) % 1;

      const fadeIn = smoothStep(0.02, 0.12, cycle);
      const approach = smoothStep(0.04, 0.62, cycle);
      const contactTravel = smoothStep(0.52, 0.72, cycle);
      const compression = smoothStep(0.58, 0.76, cycle);
      const ambiguity = smoothStep(0.64, 0.76, cycle) * (1 - smoothStep(0.82, 0.94, cycle));
      const emergence = smoothStep(0.66, 0.94, cycle);
      const fadeOut = 1 - smoothStep(0.985, 1, cycle);
      const reaction = smoothStep(0.54, 0.72, cycle) * (1 - smoothStep(0.9, 1, cycle));
      const flare = smoothStep(0.64, 0.74, cycle) * (1 - smoothStep(0.8, 0.9, cycle));
      const force = smoothStep(0.4, 0.72, approach);

      const driftX = staticMode
        ? 0
        : Math.sin(timeSeconds * config.drift.speed + config.offset * Math.PI * 2) *
          config.drift.x *
          (1 - compression * 0.75);
      const driftY = staticMode
        ? 0
        : Math.cos(timeSeconds * (config.drift.speed * 1.17) + config.offset * Math.PI * 1.7) *
          config.drift.y *
          (1 - compression * 0.75);

      const incomingPoint = quadraticPoint(config.start, config.control, config.end, approach);
      const castPoint = mixPoint(incomingPoint, config.contact, contactTravel);
      const castCenterX = (castPoint.x + driftX) * compositionWidth;
      const castCenterY = (castPoint.y + driftY) * compositionHeight;
      const castWidth = castElement.offsetWidth;
      const castHeight = castElement.offsetHeight;

      const castScalePulse = staticMode
        ? 1
        : 1 + Math.sin(timeSeconds * (config.drift.speed * 1.4) + config.offset * 6) * 0.018;
      const castScale = mix(config.scale.from, config.scale.to, force) * castScalePulse;
      const castRotationBase =
        config.rotation.base +
        config.rotation.delta * approach +
        Math.sin(timeSeconds * config.drift.speed + config.offset * 10) * config.rotation.wobble;
      const castRotation = mix(castRotationBase, config.rotation.contact, compression);
      const castScaleX = 1 - compression * config.compress.x;
      const castScaleY = 1 + compression * config.compress.y;
      const castVisibility =
        fadeIn * (1 - smoothStep(0.72, 0.82, cycle)) * fadeOut * (1 - ambiguity * 0.26);

      castElement.style.opacity = castVisibility.toFixed(3);
      castElement.style.setProperty("--influence", clamp(force + reaction * 0.42, 0, 1).toFixed(3));
      castElement.style.setProperty(
        "--cast-blur",
        `${(compression * 4.8 + ambiguity * 10).toFixed(2)}px`,
      );
      castElement.style.transform = `translate3d(${(castCenterX - castWidth / 2).toFixed(2)}px, ${(castCenterY - castHeight / 2).toFixed(2)}px, 0) rotate(${castRotation.toFixed(2)}deg) scale(${castScale.toFixed(3)}) scaleX(${castScaleX.toFixed(3)}) scaleY(${castScaleY.toFixed(3)})`;

      const eventCenterX = config.contact.x * compositionWidth;
      const eventCenterY = config.contact.y * compositionHeight;
      const eventWidth = eventElement.offsetWidth;
      const eventHeight = eventElement.offsetHeight;
      const eventStrength = clamp(reaction + flare * 0.45, 0, 1);
      const eventRotation = mix(config.rotation.contact * 0.22, 0, emergence * 0.65);

      eventElement.style.opacity = (eventStrength * 0.96).toFixed(3);
      eventElement.style.setProperty("--react", eventStrength.toFixed(3));
      eventElement.style.transform = `translate3d(${(eventCenterX - eventWidth / 2).toFixed(2)}px, ${(eventCenterY - eventHeight / 2).toFixed(2)}px, 0) rotate(${eventRotation.toFixed(2)}deg) scale(${(0.72 + eventStrength * 0.48).toFixed(3)})`;

      const ghostTravel = smoothStep(0.62, 0.8, cycle);
      const rustPathProgress = smoothStep(0.68, 0.985, cycle);
      const rustDissolve = smoothStep(0.72, 1, rustPathProgress);
      const ghostPoint = quadraticPoint(
        config.contact,
        mixPoint(config.contact, config.release, 0.54),
        config.release,
        ghostTravel,
      );
      const ghostCenterX = ghostPoint.x * compositionWidth;
      const ghostCenterY = ghostPoint.y * compositionHeight;
      const ghostWidth = ghostElement.offsetWidth;
      const ghostHeight = ghostElement.offsetHeight;

      ghostElement.style.opacity = (ambiguity * 0.86).toFixed(3);
      ghostElement.style.zIndex = String(Math.max((config.outputLayer ?? 6) - 1, 4));
      ghostElement.style.setProperty("--ghost-blur", `${(22 - ambiguity * 9).toFixed(2)}px`);
      ghostElement.style.setProperty("--ghost-clarity", ambiguity.toFixed(3));
      ghostElement.style.transform = `translate3d(${(ghostCenterX - ghostWidth / 2).toFixed(2)}px, ${(ghostCenterY - ghostHeight / 2).toFixed(2)}px, 0) rotate(${mix(castRotation, config.rustRotation.from, ambiguity).toFixed(2)}deg) scale(${(0.74 + ambiguity * 0.4).toFixed(3)})`;

      const rustPoint = cubicPoint(
        config.release,
        config.lead,
        config.branchControl,
        config.branch,
        rustPathProgress,
      );
      const rustCenterX = rustPoint.x * compositionWidth;
      const rustCenterY = rustPoint.y * compositionHeight;
      const rustWidth = rustElement.offsetWidth;
      const rustHeight = rustElement.offsetHeight;
      const rustVisibility =
        smoothStep(0.64, 0.76, cycle) *
        (1 - rustDissolve * 0.22) *
        fadeOut;
      const rustScalePulse = staticMode
        ? 1
        : 1 + Math.sin(timeSeconds * (config.drift.speed * 0.92) + config.offset * 7) * 0.012;
      const rustScale = mix(config.rustScale.from, config.rustScale.to, emergence) * rustScalePulse;
      const rustRotation = mix(config.rustRotation.from, config.rustRotation.to, emergence);

      rustElement.style.opacity = (rustVisibility * (0.9 + flare * 0.08)).toFixed(3);
      rustElement.style.zIndex = String(config.outputLayer ?? 6);
      rustElement.style.setProperty("--rust-haze", `${(rustDissolve * 4.2).toFixed(2)}px`);
      rustElement.style.setProperty(
        "--rust-energy",
        clamp(reaction * 0.42 + emergence * 0.64, 0, 1).toFixed(3),
      );
      rustElement.style.transform = `translate3d(${(rustCenterX - rustWidth / 2).toFixed(2)}px, ${(rustCenterY - rustHeight / 2).toFixed(2)}px, 0) rotate(${rustRotation.toFixed(2)}deg) scale(${rustScale.toFixed(3)})`;

      membraneReaction = Math.max(membraneReaction, eventStrength);
    }

    sceneComposition.style.setProperty("--membrane-react", membraneReaction.toFixed(3));
  };

  const render = (timestamp) => {
    const timeSeconds = timestamp * 0.001;

    state.x += (state.targetX - state.x) * 0.08;
    state.y += (state.targetY - state.y) * 0.08;

    root.style.setProperty("--pointer-x", state.x.toFixed(4));
    root.style.setProperty("--pointer-y", state.y.toFixed(4));

    applyCastFrame(timeSeconds);
    window.requestAnimationFrame(render);
  };

  heroStage.addEventListener("pointermove", (event) => {
    const bounds = heroStage.getBoundingClientRect();
    state.targetX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    state.targetY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
  });

  heroStage.addEventListener("pointerleave", () => {
    state.targetX = 0;
    state.targetY = 0;
  });

  const refreshStaticFrame = () => {
    root.style.setProperty("--pointer-x", "0");
    root.style.setProperty("--pointer-y", "0");
    applyCastFrame(0, true);
  };

  window.addEventListener("resize", () => {
    if (reduceMotion) {
      refreshStaticFrame();
      return;
    }

    updateLayout();
  });

  updateLayout();

  if (reduceMotion) {
    refreshStaticFrame();
  } else {
    window.requestAnimationFrame(render);
  }
}

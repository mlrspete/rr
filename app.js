const heroStage = document.querySelector("[data-hero-stage]");
const sceneComposition = document.querySelector(".scene-composition");
const castElements = new Map(
  [...document.querySelectorAll("[data-cast]")].map((element) => [element.dataset.cast, element]),
);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (heroStage && sceneComposition) {
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
        duration: 17.8,
        offset: 0.04,
        start: { x: -0.08, y: 0.24 },
        control: { x: 0.16, y: 0.15 },
        end: { x: 0.44, y: 0.29 },
        attract: { x: 0.53, y: 0.34 },
        drift: { x: 0.018, y: 0.024, speed: 0.82 },
        rotation: { base: -18, delta: 34, wobble: 5.5 },
        scale: { from: 1.04, to: 0.86 },
        staticPhase: 0.34,
      },
      {
        id: "capsule",
        duration: 20.4,
        offset: 0.36,
        start: { x: -0.16, y: 0.6 },
        control: { x: 0.1, y: 0.52 },
        end: { x: 0.44, y: 0.49 },
        attract: { x: 0.54, y: 0.45 },
        drift: { x: 0.014, y: 0.018, speed: 0.66 },
        rotation: { base: -8, delta: 18, wobble: 3.8 },
        scale: { from: 1, to: 0.9 },
        staticPhase: 0.5,
      },
      {
        id: "cuboid",
        duration: 21.8,
        offset: 0.64,
        start: { x: 0.06, y: 0.78 },
        control: { x: 0.22, y: 0.68 },
        end: { x: 0.5, y: 0.6 },
        attract: { x: 0.58, y: 0.54 },
        drift: { x: 0.012, y: 0.016, speed: 0.56 },
        rotation: { base: 14, delta: -9, wobble: 3.1 },
        scale: { from: 0.98, to: 0.88 },
        staticPhase: 0.72,
      },
    ],
    tablet: [
      {
        id: "sphere",
        duration: 17.2,
        offset: 0.08,
        start: { x: 0.04, y: 0.38 },
        control: { x: 0.18, y: 0.31 },
        end: { x: 0.42, y: 0.34 },
        attract: { x: 0.53, y: 0.37 },
        drift: { x: 0.018, y: 0.022, speed: 0.82 },
        rotation: { base: -16, delta: 30, wobble: 5 },
        scale: { from: 1.02, to: 0.86 },
        staticPhase: 0.46,
      },
      {
        id: "monolith",
        duration: 19.4,
        offset: 0.48,
        start: { x: 0.14, y: 0.68 },
        control: { x: 0.26, y: 0.57 },
        end: { x: 0.44, y: 0.49 },
        attract: { x: 0.55, y: 0.44 },
        drift: { x: 0.01, y: 0.016, speed: 0.54 },
        rotation: { base: 12, delta: -10, wobble: 2.6 },
        scale: { from: 0.98, to: 0.86 },
        staticPhase: 0.58,
      },
    ],
    mobile: [
      {
        id: "sphere",
        duration: 16.8,
        offset: 0.14,
        start: { x: 0.12, y: 0.34 },
        control: { x: 0.22, y: 0.28 },
        end: { x: 0.4, y: 0.24 },
        attract: { x: 0.5, y: 0.28 },
        drift: { x: 0.012, y: 0.016, speed: 0.72 },
        rotation: { base: -10, delta: 22, wobble: 3.2 },
        scale: { from: 0.98, to: 0.86 },
        staticPhase: 0.42,
      },
      {
        id: "capsule",
        duration: 19.2,
        offset: 0.56,
        start: { x: 0.08, y: 0.5 },
        control: { x: 0.22, y: 0.44 },
        end: { x: 0.42, y: 0.38 },
        attract: { x: 0.52, y: 0.36 },
        drift: { x: 0.01, y: 0.012, speed: 0.54 },
        rotation: { base: -6, delta: 14, wobble: 2.8 },
        scale: { from: 0.96, to: 0.9 },
        staticPhase: 0.64,
      },
    ],
  };

  const updateLayout = () => {
    const width = window.innerWidth;
    const nextLayout = width <= 680 ? "mobile" : width <= 900 ? "tablet" : "desktop";

    if (state.layout === nextLayout) {
      return;
    }

    state.layout = nextLayout;
    state.activeCast = castLayouts[nextLayout];

    for (const [id, element] of castElements) {
      element.hidden = !state.activeCast.some((config) => config.id === id);
    }
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const mix = (start, end, amount) => start + (end - start) * amount;

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

  const applyCastFrame = (timeSeconds, staticMode = false) => {
    updateLayout();

    const compositionWidth = sceneComposition.clientWidth;
    const compositionHeight = sceneComposition.clientHeight;

    if (!compositionWidth || !compositionHeight) {
      return;
    }

    for (const config of state.activeCast) {
      const element = castElements.get(config.id);

      if (!element) {
        continue;
      }

      const cycle = staticMode
        ? config.staticPhase
        : ((timeSeconds / config.duration) + config.offset) % 1;

      const motion = smoothStep(0.04, 0.88, cycle);
      const fadeIn = smoothStep(0.02, 0.14, cycle);
      const fadeOut = 1 - smoothStep(0.84, 0.98, cycle);
      const visibility = Math.min(fadeIn, fadeOut);
      const influence = smoothStep(0.54, 0.9, motion);

      const pathPoint = quadraticPoint(config.start, config.control, config.end, motion);
      const attractX = mix(pathPoint.x, config.attract.x, influence * 0.36);
      const attractY = mix(pathPoint.y, config.attract.y, influence * 0.28);
      const driftX = Math.sin(timeSeconds * config.drift.speed + config.offset * Math.PI * 2) * config.drift.x;
      const driftY = Math.cos(timeSeconds * (config.drift.speed * 1.17) + config.offset * Math.PI * 1.7) * config.drift.y;
      const x = (attractX + driftX) * compositionWidth;
      const y = (attractY + driftY) * compositionHeight;

      const width = element.offsetWidth;
      const height = element.offsetHeight;
      const scalePulse = staticMode
        ? 1
        : 1 + Math.sin(timeSeconds * (config.drift.speed * 1.4) + config.offset * 6) * 0.025;
      const scale = mix(config.scale.from, config.scale.to, influence) * scalePulse;
      const rotation =
        config.rotation.base +
        config.rotation.delta * motion +
        Math.sin(timeSeconds * config.drift.speed + config.offset * 10) * config.rotation.wobble;

      element.style.opacity = (visibility * (0.97 - influence * 0.08)).toFixed(3);
      element.style.setProperty("--influence", influence.toFixed(3));
      element.style.transform = `translate3d(${(x - width / 2).toFixed(2)}px, ${(y - height / 2).toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    }
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

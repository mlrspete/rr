import { gsap } from "gsap";
import * as THREE from "three";

export function createCalloutOverlay({
  container,
  maxPerSide = 2,
  duration = 1.55,
  sideOffsetX = 36,
  sideOffsetY = -6,
  fadeDuration = 0.28,
  safeInsetX = 28,
  safeInsetTop = 88,
  safeInsetBottom = 132,
} = {}) {
  if (!(container instanceof HTMLElement)) {
    return createNoopCalloutOverlay();
  }

  const root = document.createElement("div");
  root.className = "callout-overlay";
  container.append(root);

  const entries = new Map();
  const worldPosition = new THREE.Vector3();
  const projected = new THREE.Vector3();

  return {
    root,
    showCallout({
      id,
      side,
      anchor,
      kicker = "",
      title = "",
      tone = "neutral",
      duration: entryDuration = duration,
    }) {
      if (!id || !anchor) {
        return;
      }

      const existing = entries.get(id);

      if (existing) {
        existing.expiresAt = performance.now() + entryDuration * 1000;
        return;
      }

      enforceSideLimit(entries, side, maxPerSide, fadeDuration);

      const element = document.createElement("div");
      element.className = `hero-callout hero-callout--${side} hero-callout--tone-${tone}`;
      element.innerHTML = `
        <span class="hero-callout__kicker">${kicker}</span>
        <span class="hero-callout__title">${title}</span>
      `;

      root.append(element);

      const state = {
        alpha: 0,
        driftX: side === "left" ? -10 : 10,
        driftY: 12,
        scale: 0.985,
      };
      const entry = {
        id,
        side,
        anchor,
        tone,
        element,
        state,
        screenX: 0,
        screenY: 0,
        isRemoving: false,
        expiresAt: performance.now() + entryDuration * 1000,
      };

      entries.set(id, entry);

      gsap.to(state, {
        alpha: 1,
        driftX: 0,
        driftY: 0,
        scale: 1,
        duration: 0.34,
        ease: "power3.out",
      });
    },
    update({ camera, width, height }) {
      const now = performance.now();

      for (const entry of entries.values()) {
        if (!entry.anchor?.parent) {
          removeEntry(entries, entry, fadeDuration);
          continue;
        }

        if (now >= entry.expiresAt) {
          removeEntry(entries, entry, fadeDuration);
          continue;
        }

        entry.anchor.getWorldPosition(worldPosition);
        projected.copy(worldPosition).project(camera);

        const isVisible = projected.z > -1 && projected.z < 1;

        if (!isVisible) {
          entry.element.style.opacity = "0";
          continue;
        }

        const rawX = (projected.x * 0.5 + 0.5) * width;
        const rawY = (-projected.y * 0.5 + 0.5) * height;
        const offsetX = entry.side === "left" ? -sideOffsetX : sideOffsetX;
        const clampedX = clamp(rawX + offsetX, safeInsetX, width - safeInsetX);
        const clampedY = clamp(rawY + sideOffsetY, safeInsetTop, height - safeInsetBottom);

        entry.screenX = clampedX;
        entry.screenY = clampedY;
        renderEntry(entry);
      }
    },
    clear() {
      for (const entry of [...entries.values()]) {
        entry.element.remove();
      }

      entries.clear();
    },
    destroy() {
      this.clear();
      root.remove();
    },
  };
}

function createNoopCalloutOverlay() {
  return {
    showCallout() {},
    update() {},
    clear() {},
    destroy() {},
  };
}

function enforceSideLimit(entries, side, maxPerSide, fadeDuration) {
  const sideEntries = [...entries.values()].filter((entry) => entry.side === side);

  if (sideEntries.length < maxPerSide) {
    return;
  }

  sideEntries
    .sort((left, right) => left.expiresAt - right.expiresAt)
    .slice(0, sideEntries.length - maxPerSide + 1)
    .forEach((entry) => {
      removeEntry(entries, entry, fadeDuration);
    });
}

function removeEntry(entries, entry, fadeDuration) {
  if (!entries.has(entry.id) || entry.isRemoving) {
    return;
  }

  entry.isRemoving = true;
  entries.delete(entry.id);

  gsap.to(entry.state, {
    alpha: 0,
    driftX: entry.side === "left" ? -8 : 8,
    driftY: -10,
    scale: 0.985,
    duration: fadeDuration,
    ease: "power2.in",
    onUpdate: () => {
      renderEntry(entry);
    },
    onComplete: () => {
      entry.element.remove();
    },
  });
}

function renderEntry(entry) {
  entry.element.style.opacity = `${entry.state.alpha}`;
  entry.element.style.transform = `translate3d(${entry.screenX + entry.state.driftX}px, ${entry.screenY + entry.state.driftY}px, 0) scale(${entry.state.scale})`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

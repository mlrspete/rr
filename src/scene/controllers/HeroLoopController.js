import { gsap } from "gsap";

export class HeroLoopController {
  constructor({
    membraneConfig,
    calloutConfig,
    calloutOverlay,
    slotControllers,
    onCycleBoundary = null,
  }) {
    this.membraneConfig = membraneConfig;
    this.calloutConfig = calloutConfig;
    this.calloutOverlay = calloutOverlay;
    this.slotControllers = slotControllers;
    this.onCycleBoundary = onCycleBoundary;

    this.sweepState = {
      x: 0,
      direction: 1,
    };
    this.eventState = {
      pulse: 0,
      flash: 0,
    };

    this.travelX = membraneConfig.travelX;
    this.passDuration = membraneConfig.passDuration;
    this.holdDuration = membraneConfig.holdDuration;
    this.calloutsEnabled = true;
    this.membraneBaseX = 0;
    this.timeline = null;
    this.transitionCounter = 0;
  }

  configure({ membraneBaseX, passDuration, holdDuration, calloutsEnabled, travelX }) {
    this.membraneBaseX = membraneBaseX;
    this.passDuration = passDuration;
    this.holdDuration = holdDuration;
    this.calloutsEnabled = calloutsEnabled;
    this.travelX = travelX ?? this.membraneConfig.travelX;
  }

  start() {
    if (!this.timeline) {
      this.rebuild();
    }

    this.timeline?.play(0);
  }

  rebuild() {
    const wasPlaying = this.timeline?.isActive?.() ?? false;
    this.timeline?.kill();

    const startX = this.membraneBaseX - this.travelX;
    const endX = this.membraneBaseX + this.travelX;

    this.sweepState.x = startX;
    this.sweepState.direction = 1;

    this.timeline = gsap.timeline({
      paused: true,
      repeat: -1,
      onRepeat: () => {
        this.onCycleBoundary?.();
      },
    });

    this.addPass({
      fromX: startX,
      toX: endX,
      direction: 1,
      at: 0,
    });

    this.addPass({
      fromX: endX,
      toX: startX,
      direction: -1,
      at: this.passDuration + this.holdDuration,
    });

    if (wasPlaying) {
      this.timeline.play();
    }
  }

  getState() {
    return {
      sweepX: this.sweepState.x,
      direction: this.sweepState.direction,
      pulse: this.eventState.pulse,
      flash: this.eventState.flash,
    };
  }

  destroy() {
    this.timeline?.kill();
    gsap.killTweensOf(this.eventState);
  }

  addPass({ fromX, toX, direction, at }) {
    this.timeline
      .set(this.sweepState, { x: fromX, direction }, at)
      .to(
        this.sweepState,
        {
          x: toX,
          duration: this.passDuration,
          ease: "sine.inOut",
        },
        at,
      )
      .call(() => {}, null, at + this.passDuration + this.holdDuration);

    const activeSlots = this.slotControllers
      .filter((slot) => slot.isActive)
      .sort((left, right) =>
        direction > 0 ? left.getTriggerX() - right.getTriggerX() : right.getTriggerX() - left.getTriggerX(),
      );

    for (const slot of activeSlots) {
      const startProgress = resolvePassProgress(
        slot.getTransitionStartX(direction),
        fromX,
        toX,
      );
      const peakProgress = resolvePassProgress(slot.getTriggerX(), fromX, toX);

      this.timeline.call(() => {
        this.handleSlotApproach(slot, direction);
      }, null, at + startProgress * this.passDuration);

      this.timeline.call(() => {
        this.handleSlotPeak(slot);
      }, null, at + peakProgress * this.passDuration);
    }
  }

  handleSlotApproach(slot, direction) {
    const didStart = slot.beginTransition({
      direction,
      passId: ++this.transitionCounter,
    });

    if (!didStart) {
      return;
    }

    this.kickEvent({
      pulse: 0.055,
      flash: 0.05,
      duration: 0.46,
    });
  }

  handleSlotPeak(slot) {
    this.kickEvent({
      pulse: 0.12,
      flash: 0.14,
      duration: 0.7,
    });

    if (!this.calloutsEnabled) {
      return;
    }

    const event = slot.getCalloutEvent();

    if (!event) {
      return;
    }

    this.calloutOverlay.showCallout({
      ...event,
      duration: this.calloutConfig.duration,
    });
  }

  kickEvent({ pulse, flash, duration }) {
    gsap.killTweensOf(this.eventState);
    this.eventState.pulse = pulse;
    this.eventState.flash = flash;

    gsap.to(this.eventState, {
      pulse: 0,
      flash: 0,
      duration,
      ease: "power2.out",
    });
  }
}

function resolvePassProgress(position, fromX, toX) {
  if (fromX === toX) {
    return 0.5;
  }

  return Math.min(Math.max((position - fromX) / (toX - fromX), 0.01), 0.99);
}

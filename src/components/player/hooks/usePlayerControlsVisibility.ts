import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";

export function usePlayerControlsVisibility(isPlaying: boolean) {
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isTouchPlayer, setIsTouchPlayer] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [controlsLocked, setControlsLocked] = useState(false);

  const clearTimer = () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = null;
  };

  const showControlsTemporarily = () => {
    if (controlsLocked) return;
    setControlsVisible(true);
    clearTimer();
    if (isPlaying) controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const syncInputMode = () => {
      setIsTouchPlayer(media.matches);
    };
    syncInputMode();
    media.addEventListener("change", syncInputMode);
    return () => media.removeEventListener("change", syncInputMode);
  }, []);

  useEffect(() => {
    if (!isPlaying && !controlsLocked) {
      clearTimer();
      setControlsVisible(true);
    } else if (isPlaying && !controlsLocked) {
      setControlsVisible(true);
      clearTimer();
      controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
    }
    return clearTimer;
  }, [isPlaying, controlsLocked]);

  const handlePlayerMouseMove = () => {
    showControlsTemporarily();
  };

  const handlePlayerMouseLeave = () => {
    if (isPlaying && !controlsLocked) {
      clearTimer();
      setControlsVisible(false);
    }
  };

  const handlePlayerPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!isTouchPlayer || controlsLocked) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, select, .progress-wrap")) return;
    clearTimer();
    setControlsVisible((visible) => {
      const next = !visible;
      if (next && isPlaying) controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
      return next;
    });
  };

  const toggleControlsLock = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    clearTimer();
    setControlsLocked((locked) => {
      const next = !locked;
      setControlsVisible(!next);
      return next;
    });
  };

  return {
    controlsLocked,
    controlsVisible,
    handlePlayerMouseMove,
    handlePlayerMouseLeave,
    handlePlayerPointerUp,
    toggleControlsLock,
  };
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const INITIAL_ACTION_BAR_ACTIONS_HEIGHT = 480;

export function useReceiptWorkspaceLayout({
  isDeleteConfirming,
  isSharingSummary,
  isSaving,
  sourceReceiptId,
}: {
  isDeleteConfirming: boolean;
  isSharingSummary: boolean;
  isSaving: boolean;
  sourceReceiptId?: string;
}) {
  const summaryRef = useRef<HTMLElement | null>(null);
  const actionBarRef = useRef<HTMLDivElement | null>(null);
  const actionBarActionsRef = useRef<HTMLDivElement | null>(null);
  const actionBarScrollYRef = useRef(0);
  const [actionBarHeight, setActionBarHeight] = useState(128);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileActionBarCompact, setIsMobileActionBarCompact] =
    useState(false);
  const [isMobileActionBarMinimized, setIsMobileActionBarMinimized] =
    useState(false);
  const [actionBarActionsHeight, setActionBarActionsHeight] = useState(
    INITIAL_ACTION_BAR_ACTIONS_HEIGHT,
  );

  const isCompactActionBar =
    (isMobileViewport || isMobileActionBarCompact) && !isDeleteConfirming;
  const isMinimizedMobileActionBar =
    isMobileViewport && isCompactActionBar && isMobileActionBarMinimized;

  useEffect(() => {
    const actionBarElement = actionBarRef.current;

    if (actionBarElement === null) {
      return;
    }

    const measuredActionBarElement = actionBarElement;

    function updateActionBarHeight() {
      const measuredHeight = Math.ceil(
        measuredActionBarElement.getBoundingClientRect().height,
      );

      setActionBarHeight((currentHeight) => {
        if (isMobileViewport && measuredHeight < currentHeight) {
          return currentHeight;
        }

        return currentHeight === measuredHeight ? currentHeight : measuredHeight;
      });
    }

    updateActionBarHeight();

    const observer = new ResizeObserver(updateActionBarHeight);
    observer.observe(measuredActionBarElement);

    return () => {
      observer.disconnect();
    };
  }, [isMobileViewport]);

  useLayoutEffect(() => {
    const actionBarActionsElement = actionBarActionsRef.current;

    if (actionBarActionsElement === null) {
      return;
    }

    const measuredActionBarActionsElement = actionBarActionsElement;

    function updateActionBarActionsHeight() {
      setActionBarActionsHeight(measuredActionBarActionsElement.scrollHeight);
    }

    updateActionBarActionsHeight();

    const observer = new ResizeObserver(updateActionBarActionsHeight);
    observer.observe(measuredActionBarActionsElement);

    return () => {
      observer.disconnect();
    };
  }, [
    isMobileViewport,
    isMobileActionBarCompact,
    isDeleteConfirming,
    isSharingSummary,
    isSaving,
    sourceReceiptId,
  ]);

  useLayoutEffect(() => {
    function updateCompactState() {
      const nextIsMobileViewport = window.innerWidth < 768;
      const currentScrollY = window.scrollY;
      const previousScrollY = actionBarScrollYRef.current;

      setIsMobileViewport(nextIsMobileViewport);
      if (!nextIsMobileViewport) {
        setIsMobileActionBarMinimized(false);
      }

      if (!nextIsMobileViewport || currentScrollY < 96) {
        setIsMobileActionBarCompact(false);
      } else if (currentScrollY > previousScrollY + 8) {
        setIsMobileActionBarCompact(true);
      } else if (currentScrollY < previousScrollY - 8) {
        setIsMobileActionBarCompact(false);
      }

      actionBarScrollYRef.current = currentScrollY;
    }

    updateCompactState();

    window.addEventListener("scroll", updateCompactState, { passive: true });
    window.addEventListener("resize", updateCompactState);

    return () => {
      window.removeEventListener("scroll", updateCompactState);
      window.removeEventListener("resize", updateCompactState);
    };
  }, []);

  function toggleMobileActionBarMinimized() {
    if (isMobileActionBarMinimized) {
      const measuredHeight = actionBarActionsRef.current?.scrollHeight ?? 0;

      if (measuredHeight > 0) {
        setActionBarActionsHeight(measuredHeight);
      }
    }

    setIsMobileActionBarMinimized((current) => !current);
  }

  function scrollToSummary() {
    summaryRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function scrollToFullSummary() {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });
  }

  return {
    summaryRef,
    actionBarRef,
    actionBarActionsRef,
    actionBarHeight,
    actionBarActionsHeight,
    isMobileViewport,
    isMobileActionBarCompact,
    isMobileActionBarMinimized,
    isCompactActionBar,
    isMinimizedMobileActionBar,
    toggleMobileActionBarMinimized,
    scrollToSummary,
    scrollToFullSummary,
  };
}

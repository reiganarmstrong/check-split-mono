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
  const footerElementRef = useRef<HTMLElement | null>(null);
  const footerOffsetFrameRef = useRef<number | null>(null);
  const [footerOffset, setFooterOffset] = useState(0);
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
    let footerResizeObserver: ResizeObserver | null = null;

    function resolveFooterElement() {
      const cachedFooter = footerElementRef.current;
      const footer =
        cachedFooter && cachedFooter.isConnected
          ? cachedFooter
          : document.querySelector("footer");

      footerElementRef.current = footer;

      return footer;
    }

    function updateFooterOffset(nextOffset: number) {
      const normalizedOffset =
        nextOffset <= 1 ? 0 : Math.round(nextOffset / 2) * 2;

      setFooterOffset((currentOffset) =>
        currentOffset === normalizedOffset ? currentOffset : normalizedOffset,
      );
    }

    function scheduleFooterOffsetMeasure() {
      if (footerOffsetFrameRef.current !== null) {
        return;
      }

      footerOffsetFrameRef.current = window.requestAnimationFrame(() => {
        footerOffsetFrameRef.current = null;
        measureFooterOffset();
      });
    }

    function measureFooterOffset() {
      const footer = resolveFooterElement();

      if (!footer) {
        updateFooterOffset(0);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      updateFooterOffset(Math.max(0, window.innerHeight - footerRect.top));
    }

    const footer = resolveFooterElement();

    if (!footer) {
      updateFooterOffset(0);
      return;
    }

    footerResizeObserver = new ResizeObserver(scheduleFooterOffsetMeasure);
    footerResizeObserver.observe(footer);
    window.addEventListener("scroll", scheduleFooterOffsetMeasure, {
      passive: true,
    });
    window.addEventListener("resize", scheduleFooterOffsetMeasure);
    window.visualViewport?.addEventListener(
      "resize",
      scheduleFooterOffsetMeasure,
    );
    window.visualViewport?.addEventListener(
      "scroll",
      scheduleFooterOffsetMeasure,
      { passive: true },
    );
    measureFooterOffset();

    return () => {
      footerResizeObserver?.disconnect();
      window.removeEventListener("scroll", scheduleFooterOffsetMeasure);
      window.removeEventListener("resize", scheduleFooterOffsetMeasure);
      window.visualViewport?.removeEventListener(
        "resize",
        scheduleFooterOffsetMeasure,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        scheduleFooterOffsetMeasure,
      );

      if (footerOffsetFrameRef.current !== null) {
        window.cancelAnimationFrame(footerOffsetFrameRef.current);
        footerOffsetFrameRef.current = null;
      }
    };
  }, []);

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
    footerOffset,
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

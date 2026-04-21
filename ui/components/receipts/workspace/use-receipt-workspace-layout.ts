"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

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
  const [footerOffset, setFooterOffset] = useState(0);
  const [actionBarHeight, setActionBarHeight] = useState(128);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [isMobileActionBarCompact, setIsMobileActionBarCompact] =
    useState(false);
  const [isMobileActionBarMinimized, setIsMobileActionBarMinimized] =
    useState(false);
  const [actionBarActionsHeight, setActionBarActionsHeight] = useState(0);

  useEffect(() => {
    let footerIntersectionObserver: IntersectionObserver | null = null;
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
        nextOffset <= 2 ? 0 : Math.round(nextOffset / 6) * 6;

      setFooterOffset((currentOffset) =>
        currentOffset === normalizedOffset ? currentOffset : normalizedOffset,
      );
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

    const thresholds = Array.from({ length: 21 }, (_, index) => index / 20);

    footerIntersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry) {
          return;
        }

        updateFooterOffset(
          entry.isIntersecting ? entry.intersectionRect.height : 0,
        );
      },
      {
        threshold: thresholds,
      },
    );
    footerIntersectionObserver.observe(footer);

    footerResizeObserver = new ResizeObserver(measureFooterOffset);
    footerResizeObserver.observe(footer);
    window.addEventListener("resize", measureFooterOffset);
    measureFooterOffset();

    return () => {
      footerIntersectionObserver?.disconnect();
      footerResizeObserver?.disconnect();
      window.removeEventListener("resize", measureFooterOffset);
    };
  }, []);

  useEffect(() => {
    const actionBarElement = actionBarRef.current;

    if (actionBarElement === null) {
      return;
    }

    const measuredActionBarElement = actionBarElement;

    function updateActionBarHeight() {
      setActionBarHeight(measuredActionBarElement.getBoundingClientRect().height);
    }

    updateActionBarHeight();

    const observer = new ResizeObserver(updateActionBarHeight);
    observer.observe(measuredActionBarElement);

    return () => {
      observer.disconnect();
    };
  }, []);

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

  useEffect(() => {
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

  const isCompactActionBar =
    (isMobileViewport || isMobileActionBarCompact) && !isDeleteConfirming;
  const isMinimizedMobileActionBar =
    isMobileViewport && isCompactActionBar && isMobileActionBarMinimized;

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

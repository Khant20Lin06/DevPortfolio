import { useCallback, useEffect, useRef, useState } from "react";

const BOTTOM_THRESHOLD_PX = 56;

const isAtBottom = (node) =>
  node.scrollHeight - node.scrollTop - node.clientHeight <= BOTTOM_THRESHOLD_PX;

export const useSmartChatScroll = ({ items, isOpen, forceScrollSignal }) => {
  const containerRef = useRef(null);
  const previousCountRef = useRef(Array.isArray(items) ? items.length : 0);

  const [isPinnedToBottom, setIsPinnedToBottom] = useState(true);
  const [pendingNewCount, setPendingNewCount] = useState(0);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const node = containerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
    setIsPinnedToBottom(true);
    setPendingNewCount(0);
  }, []);

  const onContainerScroll = useCallback(() => {
    const node = containerRef.current;
    if (!node) return;
    const pinned = isAtBottom(node);
    setIsPinnedToBottom(pinned);
    if (pinned) {
      setPendingNewCount(0);
    }
  }, []);

  const jumpToLatest = useCallback(() => {
    scrollToBottom("smooth");
  }, [scrollToBottom]);

  useEffect(() => {
    const nextCount = Array.isArray(items) ? items.length : 0;
    const previousCount = previousCountRef.current;
    const delta = nextCount - previousCount;

    previousCountRef.current = nextCount;

    if (!isOpen) return;
    const node = containerRef.current;
    if (!node) return;

    if (nextCount === 0) {
      setPendingNewCount(0);
      setIsPinnedToBottom(true);
      return;
    }

    if (previousCount === 0 && nextCount > 0) {
      requestAnimationFrame(() => {
        const currentNode = containerRef.current;
        if (!currentNode) return;
        currentNode.scrollTo({ top: currentNode.scrollHeight, behavior: "auto" });
        setIsPinnedToBottom(true);
        setPendingNewCount(0);
      });
      return;
    }

    if (delta > 0) {
      const pinned = isAtBottom(node);
      if (pinned) {
        requestAnimationFrame(() => scrollToBottom("smooth"));
      } else {
        setIsPinnedToBottom(false);
        setPendingNewCount((count) => count + delta);
      }
    }
  }, [items, isOpen, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      const node = containerRef.current;
      if (!node) return;
      node.scrollTo({ top: node.scrollHeight, behavior: "auto" });
      setIsPinnedToBottom(true);
      setPendingNewCount(0);
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => scrollToBottom("smooth"));
  }, [forceScrollSignal, isOpen, scrollToBottom]);

  return {
    containerRef,
    isPinnedToBottom,
    pendingNewCount,
    jumpToLatest,
    onContainerScroll,
  };
};


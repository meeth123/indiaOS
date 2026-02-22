"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/fb-pixel";

export function FbViewContent({
  contentName,
  contentCategory,
}: {
  contentName: string;
  contentCategory: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    trackEvent("ViewContent", {
      content_name: contentName,
      content_category: contentCategory,
    });
  }, [contentName, contentCategory]);
  return null;
}

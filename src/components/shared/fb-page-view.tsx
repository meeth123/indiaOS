"use client";

import { useEffect, useRef } from "react";
import { sendServerEvent, generateEventId, getFbp, getFbc } from "@/lib/fb-pixel";

// Sends PageView to Conversions API (Pixel already fires PageView on init)
export function FbPageView() {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    const eventId = generateEventId();
    // The Pixel fires PageView on init, but we also need server-side for CAPI coverage
    sendServerEvent("PageView", eventId);
  }, []);
  return null;
}

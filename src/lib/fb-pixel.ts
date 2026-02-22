// Facebook Pixel + Conversions API utilities

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID!;

// Generate unique event ID for deduplication between Pixel and Conversions API
export function generateEventId(): string {
  return `${Date.now()}.${Math.random().toString(36).substring(2, 10)}`;
}

// Get fbp cookie value (set by FB Pixel)
export function getFbp(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)_fbp=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Get fbc cookie value (set from fbclid URL param)
export function getFbc(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)_fbc=([^;]*)/);
  if (match) return decodeURIComponent(match[1]);

  // Generate from fbclid URL parameter if cookie doesn't exist
  const url = new URL(window.location.href);
  const fbclid = url.searchParams.get("fbclid");
  if (fbclid) {
    return `fb.1.${Date.now()}.${fbclid}`;
  }
  return null;
}

// Client-side: fire Pixel event
export function fbPixelTrack(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined" || !(window as any).fbq) return;
  if (eventId) {
    (window as any).fbq("track", eventName, params || {}, { eventID: eventId });
  } else {
    (window as any).fbq("track", eventName, params || {});
  }
}

// Client-side: fire custom Pixel event
export function fbPixelTrackCustom(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined" || !(window as any).fbq) return;
  if (eventId) {
    (window as any).fbq("trackCustom", eventName, params || {}, {
      eventID: eventId,
    });
  } else {
    (window as any).fbq("trackCustom", eventName, params || {});
  }
}

// Send event to server-side Conversions API (via our API route)
export async function sendServerEvent(
  eventName: string,
  eventId: string,
  params?: Record<string, unknown>
) {
  try {
    await fetch("/api/fb-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        eventId,
        sourceUrl: window.location.href,
        fbp: getFbp(),
        fbc: getFbc(),
        userAgent: navigator.userAgent,
        ...params,
      }),
    });
  } catch {
    // Silent fail — don't break UX for tracking
  }
}

// Combined: fire both Pixel + Conversions API with deduplication
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
  isCustom = false
) {
  const eventId = generateEventId();

  // Client-side Pixel
  if (isCustom) {
    fbPixelTrackCustom(eventName, params, eventId);
  } else {
    fbPixelTrack(eventName, params, eventId);
  }

  // Server-side Conversions API
  sendServerEvent(eventName, eventId, params);
}

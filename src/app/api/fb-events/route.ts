import { NextRequest, NextResponse } from "next/server";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID!;
const FB_TOKEN = process.env.FB_CONVERSIONS_API_TOKEN!;
const FB_API_VERSION = "v21.0";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventId, sourceUrl, fbp, fbc, userAgent, ...customData } = body;

    // Get client IP from headers (Vercel/proxy forwards this)
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "0.0.0.0";

    const userData: Record<string, unknown> = {
      client_ip_address: clientIp,
      client_user_agent: userAgent || req.headers.get("user-agent"),
    };

    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
    // External ID: use fbp as anonymous identifier
    if (fbp) userData.external_id = fbp;

    const eventData: Record<string, unknown> = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: sourceUrl,
      action_source: "website",
      user_data: userData,
    };

    if (eventId) eventData.event_id = eventId;

    // Add custom data params if present
    if (Object.keys(customData).length > 0) {
      eventData.custom_data = customData;
    }

    const response = await fetch(
      `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${FB_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [eventData] }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("[FB CAPI] Error:", result);
      return NextResponse.json({ error: result }, { status: response.status });
    }

    return NextResponse.json({ success: true, events_received: result.events_received });
  } catch (error) {
    console.error("[FB CAPI] Exception:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

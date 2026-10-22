export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    if (!env.CALENDLY_ACCESS_TOKEN) {
      return json({ error: "CALENDLY_ACCESS_TOKEN is not configured" }, 500);
    }

    const body = await request.json();
    const eventUri = body && body.eventUri;

    if (!eventUri) {
      return json({ error: "Missing eventUri" }, 400);
    }

    let parsed;
    try {
      parsed = new URL(eventUri);
    } catch {
      return json({ error: "Invalid eventUri" }, 400);
    }

    if (parsed.protocol !== "https:" || parsed.hostname !== "api.calendly.com" || !parsed.pathname.startsWith("/scheduled_events/")) {
      return json({ error: "Unsupported eventUri" }, 400);
    }

    const response = await fetch(eventUri, {
      headers: {
        Authorization: "Bearer " + env.CALENDLY_ACCESS_TOKEN,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const detail = await response.text();
      return json({ error: "Calendly API request failed", status: response.status, detail }, 502);
    }

    const data = await response.json();
    const event = data && data.resource ? data.resource : data;

    const location = event && event.location ? event.location : null;
    const meetingLink =
      location && (
        location.join_url ||
        location.url ||
        location.link ||
        (typeof location.location === "string" && /^https?:\/\//i.test(location.location) ? location.location : null)
      );

    return json({
      startTime: event && event.start_time ? event.start_time : null,
      endTime: event && event.end_time ? event.end_time : null,
      status: event && event.status ? event.status : null,
      eventUri: event && event.uri ? event.uri : eventUri,
      meetingLink: meetingLink || null,
      locationType: location && location.type ? location.type : null
    });
  } catch (error) {
    return json({ error: "Unexpected server error" }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}

// Redeploy marker: Calendly token enabled

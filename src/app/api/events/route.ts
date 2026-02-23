import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

const EVENTS_KEY = "aic-events";

function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

export interface Event {
  id: string;
  lumaUrl?: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  timezone: string;
  location?: string;
  imageUrl?: string | string[];
  type:
    | "Summit"
    | "Roundtable"
    | "Workshop"
    | "Forum"
    | "Demo Night"
    | "Meetup"
    | "Other";
  addedAt: string;
}

interface EventsData {
  events: Event[];
}

interface LumaEventData {
  title: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  timezone?: string;
  location?: string;
  imageUrl?: string;
  lumaUrl: string;
}

const EVENTS_FILE = path.join(process.cwd(), "src/data/events.json");

async function readEventsFromFile(): Promise<EventsData> {
  try {
    const data = await fs.readFile(EVENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { events: [] };
  }
}

async function readEvents(): Promise<EventsData> {
  const redis = getRedis();
  if (redis) {
    try {
      const stored = await redis.get<EventsData>(EVENTS_KEY);
      if (stored && typeof stored === "object" && Array.isArray(stored.events)) {
        return stored;
      }
    } catch {
      // fall back to file
    }
    const fileData = await readEventsFromFile();
    try {
      await redis.set(EVENTS_KEY, fileData);
    } catch {
      // ignore seed failure
    }
    return fileData;
  }
  return readEventsFromFile();
}

async function writeEvents(data: EventsData): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(EVENTS_KEY, data);
      return;
    } catch (err) {
      console.error("Redis set failed:", err);
      throw err;
    }
  }
  await fs.writeFile(EVENTS_FILE, JSON.stringify(data, null, 2));
}

function extractMetaContent(html: string, attribute: string): string {
  const regex = new RegExp(
    `<meta[^>]*${attribute}[^>]*content="([^"]*)"`,
    "i"
  );
  const altRegex = new RegExp(
    `<meta[^>]*content="([^"]*)"[^>]*${attribute}`,
    "i"
  );
  const match = html.match(regex) || html.match(altRegex);
  return match ? match[1] : "";
}

function parseEventData(html: string, url: string): LumaEventData {
  const data: LumaEventData = {
    title: "",
    lumaUrl: url,
  };

  const ogTitle = extractMetaContent(html, 'property="og:title"');
  const ogDescription = extractMetaContent(html, 'property="og:description"');
  const ogImage = extractMetaContent(html, 'property="og:image"');
  const metaTitle = extractMetaContent(html, 'name="title"');
  const metaDescription = extractMetaContent(html, 'name="description"');

  const jsonLdMatch = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
  );

  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const eventSchema = Array.isArray(jsonLd)
        ? jsonLd.find((item: { "@type"?: string }) => item["@type"] === "Event")
        : (jsonLd as { "@type"?: string })["@type"] === "Event"
          ? jsonLd
          : null;

      if (eventSchema && typeof eventSchema === "object") {
        const s = eventSchema as Record<string, unknown>;
        data.title = (s.name as string) || data.title;
        data.description = (s.description as string) || data.description;
        data.startAt = (s.startDate as string) || data.startAt;
        data.endAt = (s.endDate as string) || data.endAt;
        data.imageUrl = (s.image as string) || data.imageUrl;
        if (s.location) {
          const loc = s.location as Record<string, unknown> | string;
          if (typeof loc === "string") data.location = loc;
          else if (loc && typeof loc === "object" && loc.name)
            data.location = `${loc.name}${(loc as { address?: { streetAddress?: string } }).address?.streetAddress ? `, ${(loc as { address: { streetAddress: string } }).address.streetAddress}` : ""}`;
        }
      }
    } catch {
      // continue with meta tags
    }
  }

  data.title = data.title || ogTitle || metaTitle || "Untitled Event";
  data.description = data.description || ogDescription || metaDescription;
  data.imageUrl = data.imageUrl || ogImage;
  if (!data.startAt) {
    const dateMatch = html.match(/datetime="([^"]+)"/i);
    if (dateMatch) data.startAt = dateMatch[1];
  }
  data.timezone = data.timezone || "America/Los_Angeles";
  return data;
}

async function fetchLumaEvent(url: string): Promise<LumaEventData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  // Use URL as-is (luma.com or lu.ma) so we hit the same page the user sees
  const fetchUrl = url.trim();

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        Referer: "https://luma.com/",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Upgrade-Insecure-Requests": "1",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Lu.ma returned ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    if (!html || html.length < 500) {
      throw new Error("Lu.ma returned an empty or invalid page");
    }

    return parseEventData(html, url);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 20 seconds");
    }
    throw error;
  }
}

// GET - List all events from local JSON
export async function GET() {
  try {
    const data = await readEvents();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading events:", error);
    return NextResponse.json(
      { error: "Failed to read events", events: [] },
      { status: 500 }
    );
  }
}

// POST - Add a new event (fetch from Lu.ma, or manual entry)
export async function POST(request: Request) {
  try {
    let body: {
      lumaUrl?: string;
      type?: string;
      manual?: boolean;
      title?: string;
      startAt?: string;
      endAt?: string;
      timezone?: string;
      location?: string;
      imageUrl?: string;
      description?: string;
      externalUrl?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    let newEvent: Event;

    if (body.manual) {
      // Manual event — validate required fields
      if (!body.title?.trim()) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 }
        );
      }
      if (!body.startAt) {
        return NextResponse.json(
          { error: "Start date/time is required" },
          { status: 400 }
        );
      }

      newEvent = {
        id: crypto.randomUUID(),
        lumaUrl: body.externalUrl?.trim() || undefined,
        title: body.title.trim(),
        description: body.description?.trim() || undefined,
        startAt: body.startAt,
        endAt: body.endAt || undefined,
        timezone: body.timezone || "America/Los_Angeles",
        location: body.location?.trim() || undefined,
        imageUrl: body.imageUrl?.trim() || undefined,
        type: (body.type as Event["type"]) || "Other",
        addedAt: new Date().toISOString(),
      };

      const data = await readEvents();
      const isDuplicate = data.events.some((e) => e.title === newEvent.title);
      if (isDuplicate) {
        return NextResponse.json(
          { error: "An event with this title already exists" },
          { status: 400 }
        );
      }

      data.events.push(newEvent);
      try {
        await writeEvents(data);
      } catch (writeErr) {
        const code = writeErr && typeof writeErr === "object" && "code" in writeErr ? (writeErr as NodeJS.ErrnoException).code : "";
        if (code === "EROFS" || (typeof (writeErr as Error).message === "string" && (writeErr as Error).message.includes("read-only file system"))) {
          return NextResponse.json(
            {
              error:
                "Adding events isn’t available in this environment (read-only). Add events by editing src/data/events.json and redeploying, or run the app locally (e.g. npm run dev) to use this form.",
            },
            { status: 503 }
          );
        }
        throw writeErr;
      }
      return NextResponse.json(newEvent, { status: 201 });
    }

    // Lu.ma event flow
    const { lumaUrl, type } = body;

    if (!lumaUrl) {
      return NextResponse.json(
        { error: "Lu.ma URL is required" },
        { status: 400 }
      );
    }
    if (!lumaUrl.includes("lu.ma/") && !lumaUrl.includes("luma.com/")) {
      return NextResponse.json(
        { error: "Invalid Lu.ma URL. URL must be from lu.ma or luma.com" },
        { status: 400 }
      );
    }

    let lumaData: LumaEventData;
    try {
      lumaData = await fetchLumaEvent(lumaUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching Lu.ma event:", err);
      return NextResponse.json(
        { error: `Lu.ma fetch failed: ${message}. Check the URL or try again.` },
        { status: 400 }
      );
    }

    newEvent = {
      id: crypto.randomUUID(),
      lumaUrl,
      title: lumaData.title,
      description: lumaData.description,
      startAt: lumaData.startAt || new Date().toISOString(),
      endAt: lumaData.endAt,
      timezone: lumaData.timezone || "America/Los_Angeles",
      location: lumaData.location,
      imageUrl: lumaData.imageUrl,
      type: (type as Event["type"]) || "Other",
      addedAt: new Date().toISOString(),
    };

    const data = await readEvents();
    const isDuplicate = data.events.some(
      (e) => e.lumaUrl === lumaUrl || e.title === newEvent.title
    );
    if (isDuplicate) {
      return NextResponse.json(
        { error: "This event already exists" },
        { status: 400 }
      );
    }

    data.events.push(newEvent);
    try {
      await writeEvents(data);
    } catch (writeErr) {
      const code = writeErr && typeof writeErr === "object" && "code" in writeErr ? (writeErr as NodeJS.ErrnoException).code : "";
      if (code === "EROFS" || (typeof (writeErr as Error).message === "string" && (writeErr as Error).message.includes("read-only file system"))) {
        return NextResponse.json(
          {
            error:
              "Adding events isn’t available in this environment (read-only). Add events by editing src/data/events.json and redeploying, or run the app locally (e.g. npm run dev) to use this form.",
          },
          { status: 503 }
        );
      }
      throw writeErr;
    }
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error adding event:", error);
    return NextResponse.json(
      { error: `Failed to add event: ${message}` },
      { status: 500 }
    );
  }
}

// DELETE - Remove an event
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }
    const data = await readEvents();
    const initialLength = data.events.length;
    data.events = data.events.filter((e) => e.id !== id);
    if (data.events.length === initialLength) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    try {
      await writeEvents(data);
    } catch (writeErr) {
      const code = writeErr && typeof writeErr === "object" && "code" in writeErr ? (writeErr as NodeJS.ErrnoException).code : "";
      if (code === "EROFS" || (typeof (writeErr as Error).message === "string" && (writeErr as Error).message.includes("read-only file system"))) {
        return NextResponse.json(
          {
            error:
              "Deleting events isn’t available in this environment (read-only). Edit src/data/events.json and redeploy, or run the app locally.",
          },
          { status: 503 }
        );
      }
      throw writeErr;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

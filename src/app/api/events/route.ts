import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export interface Event {
  id: string;
  lumaUrl: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  timezone: string;
  location?: string;
  imageUrl?: string;
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

async function readEvents(): Promise<EventsData> {
  try {
    const data = await fs.readFile(EVENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { events: [] };
  }
}

async function writeEvents(data: EventsData): Promise<void> {
  await fs.writeFile(EVENTS_FILE, JSON.stringify(data, null, 2));
}

// Scrape Lu.ma event data directly
async function fetchLumaEvent(url: string): Promise<LumaEventData> {
  // Create an AbortController with a 15-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Normalize the URL - lu.ma redirects to luma.com
    let fetchUrl = url;
    if (url.includes("lu.ma/")) {
      fetchUrl = url.replace("lu.ma/", "luma.com/");
    }

    console.log(`Fetching Lu.ma event from: ${fetchUrl}`);

    const response = await fetch(fetchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    console.log(`Lu.ma response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch Lu.ma page: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Received HTML length: ${html.length}`);

    return parseEventData(html, url);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Lu.ma fetch error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out after 15 seconds");
    }
    throw error;
  }
}

function parseEventData(html: string, url: string): LumaEventData {
  const data: LumaEventData = {
    title: "",
    lumaUrl: url,
  };

  // Extract Open Graph meta tags
  const ogTitle = extractMetaContent(html, 'property="og:title"');
  const ogDescription = extractMetaContent(html, 'property="og:description"');
  const ogImage = extractMetaContent(html, 'property="og:image"');

  // Extract regular meta tags as fallback
  const metaTitle = extractMetaContent(html, 'name="title"');
  const metaDescription = extractMetaContent(html, 'name="description"');

  // Try to extract JSON-LD structured data
  const jsonLdMatch = html.match(
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
  );

  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);

      // Handle array of JSON-LD objects
      const eventSchema = Array.isArray(jsonLd)
        ? jsonLd.find((item) => item["@type"] === "Event")
        : jsonLd["@type"] === "Event"
        ? jsonLd
        : null;

      if (eventSchema) {
        data.title = eventSchema.name || data.title;
        data.description = eventSchema.description || data.description;
        data.startAt = eventSchema.startDate;
        data.endAt = eventSchema.endDate;
        data.imageUrl = eventSchema.image;

        if (eventSchema.location) {
          if (typeof eventSchema.location === "string") {
            data.location = eventSchema.location;
          } else if (eventSchema.location.name) {
            data.location = eventSchema.location.name;
            if (eventSchema.location.address?.streetAddress) {
              data.location += `, ${eventSchema.location.address.streetAddress}`;
            }
          }
        }
      }
    } catch {
      // JSON-LD parsing failed, continue with meta tags
    }
  }

  // Use meta tags as fallback
  data.title = data.title || ogTitle || metaTitle || "Untitled Event";
  data.description = data.description || ogDescription || metaDescription;
  data.imageUrl = data.imageUrl || ogImage;

  // Try to extract date from page content if not found in JSON-LD
  if (!data.startAt) {
    const dateMatch = html.match(/datetime="([^"]+)"/i);
    if (dateMatch) {
      data.startAt = dateMatch[1];
    }
  }

  // Extract timezone from meta or default to America/Los_Angeles for Seattle
  data.timezone = data.timezone || "America/Los_Angeles";

  return data;
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

// GET - List all events
export async function GET() {
  try {
    const data = await readEvents();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error reading events:", error);
    return NextResponse.json(
      { error: "Failed to read events" },
      { status: 500 }
    );
  }
}

// POST - Add a new event
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lumaUrl, type } = body;

    if (!lumaUrl) {
      return NextResponse.json(
        { error: "Lu.ma URL is required" },
        { status: 400 }
      );
    }

    // Validate Lu.ma URL (accepts both lu.ma and luma.com)
    if (!lumaUrl.includes("lu.ma/") && !lumaUrl.includes("luma.com/")) {
      return NextResponse.json(
        { error: "Invalid Lu.ma URL. URL must be from lu.ma or luma.com" },
        { status: 400 }
      );
    }

    // Fetch event data from Lu.ma directly
    let lumaData: LumaEventData;
    try {
      lumaData = await fetchLumaEvent(lumaUrl);
    } catch (err) {
      console.error("Error fetching Lu.ma event:", err);
      return NextResponse.json(
        { error: "Failed to fetch event from Lu.ma. Please check the URL." },
        { status: 400 }
      );
    }

    // Create new event
    const newEvent: Event = {
      id: crypto.randomUUID(),
      lumaUrl,
      title: lumaData.title,
      description: lumaData.description,
      startAt: lumaData.startAt || new Date().toISOString(),
      endAt: lumaData.endAt,
      timezone: lumaData.timezone || "America/Los_Angeles",
      location: lumaData.location,
      imageUrl: lumaData.imageUrl,
      type: type || "Other",
      addedAt: new Date().toISOString(),
    };

    // Read existing events and add new one
    const data = await readEvents();

    // Check for duplicate
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
    await writeEvents(data);

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error("Error adding event:", error);
    return NextResponse.json(
      { error: "Failed to add event" },
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

    await writeEvents(data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate Lu.ma URL
    if (!url.includes("lu.ma/")) {
      return NextResponse.json(
        { error: "Invalid Lu.ma URL. URL must contain lu.ma/" },
        { status: 400 }
      );
    }

    // Fetch the Lu.ma event page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch Lu.ma page: ${response.status}` },
        { status: 500 }
      );
    }

    const html = await response.text();

    // Extract data from meta tags and JSON-LD
    const eventData = parseEventData(html, url);

    return NextResponse.json(eventData);
  } catch (error) {
    console.error("Error fetching Lu.ma event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event data" },
      { status: 500 }
    );
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
    // Look for date patterns in the HTML
    const dateMatch = html.match(
      /datetime="([^"]+)"/i
    );
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

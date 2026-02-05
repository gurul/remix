import { NextResponse } from "next/server";

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

// Google Sheets published CSV URL - replace with your own!
// To get this URL:
// 1. Open your Google Sheet
// 2. File → Share → Publish to web
// 3. Select the sheet, choose CSV format
// 4. Click Publish and paste the URL here
const GOOGLE_SHEETS_CSV_URL = process.env.GOOGLE_SHEETS_URL || "";

async function fetchEventsFromGoogleSheets(): Promise<Event[]> {
  if (!GOOGLE_SHEETS_CSV_URL) {
    console.warn("GOOGLE_SHEETS_URL not configured, returning empty events");
    return [];
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_CSV_URL, {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.status}`);
    }

    const csvText = await response.text();
    return parseCSVToEvents(csvText);
  } catch (error) {
    console.error("Error fetching from Google Sheets:", error);
    return [];
  }
}

function parseCSVToEvents(csv: string): Event[] {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  const events: Event[] = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const event: Record<string, string> = {};

    headers.forEach((header, index) => {
      event[header.trim()] = values[index]?.trim() || "";
    });

    // Only add events with required fields
    if (event.lumaUrl && event.title && event.startAt) {
      events.push({
        id: event.id || crypto.randomUUID(),
        lumaUrl: event.lumaUrl,
        title: event.title,
        description: event.description || undefined,
        startAt: event.startAt,
        endAt: event.endAt || undefined,
        timezone: event.timezone || "America/Los_Angeles",
        location: event.location || undefined,
        imageUrl: event.imageUrl || undefined,
        type: (event.type as Event["type"]) || "Meetup",
        addedAt: event.addedAt || new Date().toISOString(),
      });
    }
  }

  return events;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// GET - List all events from Google Sheets
export async function GET() {
  try {
    const events = await fetchEventsFromGoogleSheets();
    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error reading events:", error);
    return NextResponse.json(
      { error: "Failed to read events", events: [] },
      { status: 500 }
    );
  }
}

// POST - Not supported with Google Sheets (read-only)
export async function POST() {
  return NextResponse.json(
    {
      error: "Adding events is not supported. Please add events directly to the Google Sheet.",
      sheetUrl: "https://docs.google.com/spreadsheets"
    },
    { status: 405 }
  );
}

// DELETE - Not supported with Google Sheets (read-only)
export async function DELETE() {
  return NextResponse.json(
    {
      error: "Deleting events is not supported. Please delete events directly from the Google Sheet."
    },
    { status: 405 }
  );
}

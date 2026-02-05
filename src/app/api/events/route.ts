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

const EVENTS_FILE = path.join(process.cwd(), "src/data/events.json");

async function readEvents(): Promise<EventsData> {
  try {
    const data = await fs.readFile(EVENTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return { events: [] };
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

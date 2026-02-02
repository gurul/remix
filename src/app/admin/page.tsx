"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, ExternalLink, Calendar, Loader2 } from "lucide-react";

interface Event {
  id: string;
  lumaUrl: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  timezone: string;
  location?: string;
  imageUrl?: string;
  type: string;
  addedAt: string;
}

const EVENT_TYPES = [
  "Summit",
  "Roundtable",
  "Workshop",
  "Forum",
  "Demo Night",
  "Meetup",
  "Other",
] as const;

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [lumaUrl, setLumaUrl] = useState("");
  const [eventType, setEventType] = useState<string>("Other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lumaUrl, type: eventType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add event");
      }

      setSuccess(`Successfully added: ${data.title}`);
      setLumaUrl("");
      setEventType("Other");
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const response = await fetch(`/api/events?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete event");
      }

      setSuccess(`Deleted: ${title}`);
      fetchEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const isUpcoming = (dateStr: string) => {
    return new Date(dateStr) > new Date();
  };

  // Sort events: upcoming first, then by date
  const sortedEvents = [...events].sort((a, b) => {
    const aUpcoming = isUpcoming(a.startAt);
    const bUpcoming = isUpcoming(b.startAt);
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    return new Date(b.startAt).getTime() - new Date(a.startAt).getTime();
  });

  return (
    <main className="min-h-screen bg-[#0c0a09] text-[#fafaf9] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-serif italic mb-2">Event Admin</h1>
          <p className="text-[#a8a29e] font-mono text-sm">
            Manage Lu.ma events for the Seattle Chapter
          </p>
        </div>

        {/* Add Event Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 p-6 mb-8"
        >
          <h2 className="text-lg font-mono uppercase tracking-widest text-[#f59e0b] mb-6">
            Add New Event
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#a8a29e] mb-2">
                Lu.ma Event URL
              </label>
              <input
                type="url"
                value={lumaUrl}
                onChange={(e) => setLumaUrl(e.target.value)}
                placeholder="https://lu.ma/your-event"
                required
                className="w-full bg-black/30 border border-white/10 px-4 py-3 text-white placeholder-white/30 font-mono text-sm focus:border-[#f59e0b] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-widest text-[#a8a29e] mb-2">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full bg-black/30 border border-white/10 px-4 py-3 text-white font-mono text-sm focus:border-[#f59e0b] focus:outline-none"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type} className="bg-[#0c0a09]">
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-sm font-mono">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 text-sm font-mono">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-[#f59e0b] text-black px-6 py-3 text-xs font-mono font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Fetching Event...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Add Event
                </>
              )}
            </button>
          </div>
        </form>

        {/* Events List */}
        <div className="bg-white/5 border border-white/10 p-6">
          <h2 className="text-lg font-mono uppercase tracking-widest text-[#f59e0b] mb-6">
            Current Events ({events.length})
          </h2>

          {sortedEvents.length === 0 ? (
            <p className="text-[#a8a29e] font-mono text-sm text-center py-8">
              No events added yet. Add your first Lu.ma event above.
            </p>
          ) : (
            <div className="space-y-4">
              {sortedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-black/30 border border-white/5 p-4 flex items-start gap-4 group hover:border-white/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-[8px] font-mono border px-2 py-0.5 uppercase tracking-widest ${
                          isUpcoming(event.startAt)
                            ? "border-green-500/30 text-green-400"
                            : "border-white/20 text-[#a8a29e]"
                        }`}
                      >
                        {isUpcoming(event.startAt) ? "Upcoming" : "Past"}
                      </span>
                      <span className="text-[8px] font-mono border border-[#f59e0b]/30 text-[#f59e0b] px-2 py-0.5 uppercase tracking-widest">
                        {event.type}
                      </span>
                    </div>

                    <h3 className="font-serif italic text-lg mb-1 truncate">
                      {event.title}
                    </h3>

                    <div className="flex items-center gap-4 text-[#a8a29e] text-xs font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(event.startAt)}
                      </span>
                      {event.location && (
                        <span className="truncate max-w-[200px]">
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={event.lumaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-[#a8a29e] hover:text-[#f59e0b] transition-colors"
                      title="View on Lu.ma"
                    >
                      <ExternalLink size={16} />
                    </a>
                    <button
                      onClick={() => handleDelete(event.id, event.title)}
                      className="p-2 text-[#a8a29e] hover:text-red-400 transition-colors"
                      title="Delete event"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to Home Link */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-[#a8a29e] hover:text-[#f59e0b] font-mono text-xs uppercase tracking-widest transition-colors"
          >
            ← Back to Homepage
          </a>
        </div>
      </div>
    </main>
  );
}

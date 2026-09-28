# AISEA

The AI Collective Seattle website. Next.js 15 (App Router), Tailwind CSS 4, Framer Motion.

## Run it

```bash
npm install
npm run dev      # development
npm run build    # production build
npm run start    # serve the production build on http://localhost:3000
```

## Events

Events live in `src/data/events.json`. The home page shows an event under
**Upcoming Events** when its `startAt` is in the future, and under **Past Events**
otherwise. Add events by editing that file, or through `/admin` when running locally.

Event types: Summit, Roundtable, Workshop, Forum, Demo Night, Hackathon, Meetup, Other.

Clicking an event card opens its `lumaUrl`:

- A full URL, such as a Luma page, opens in a new tab.
- A path starting with `/` opens a page on this site in the same tab.

### Attendee guide pages

An event can have its own guide page under `src/app/events/<slug>/`. The IA40
Hackathon guide lives at `/events/ia40-hackathon`, with schedule, WiFi, challenge,
credits, setup and prizes. It includes an audio walkthrough using the browser's
built-in speech synthesis. Event cover images go in `public/events/`.

import ical from 'ical-generator'
import { DateTime } from 'luxon'

import parse from './rss-to-json'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cacheKey = request.clone()
    const cache = caches.default
    let response = await cache.match(cacheKey)
    if (!response) {
      const content = await makeIcs(env)
      response = new Response(content, {
        headers: {
          'Cache-Control': 'public, max-age=21600, s-maxage=21600',
          'Content-Type': 'text/calendar',
          'Content-Disposition': 'attachment; filename=otherland.ics',
        },
      })
      await cache.put(cacheKey, response.clone())
    }
    return response
  },
} satisfies ExportedHandler<Env>

const feedUrl = 'https://www.otherland-berlin.de/share/otherland-events.xml'

const EuropeBerlinTz = {
  name: 'Europe/Berlin',
  generator: () => `BEGIN:VTIMEZONE
TZID:Europe/Berlin
TZURL:http://tzurl.org/zoneinfo-outlook/Europe/Berlin
X-LIC-LOCATION:Europe/Berlin
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
`,
}

type RssItem = {
  title: string
  description: string
  link: string
}

async function makeIcs(env: Env) {
  const rss = await parse(feedUrl)

  const calendar = ical({ name: 'Otherland Events' })
  calendar.timezone(EuropeBerlinTz)
  const pattern = /(\d+). ([A-Z][a-zä][a-z]) (\d{4}) \((\d+):(\d+)(–.*)?\) (.*)/
  for (const it of rss!.items as RssItem[]) {
    const title = await override(env, it.title)
    const match = title.match(pattern)
    if (!match) throw `bad match ${it.title}`
    const year = Number(match[3])
    const month = {
      Jan: 1,
      Feb: 2,
      Mär: 3,
      Apr: 4,
      Mai: 5,
      Jun: 6,
      Jul: 7,
      Aug: 8,
      Sep: 9,
      Okt: 10,
      Nov: 11,
      Dez: 12,
    }[match[2]]
    if (month == null) throw `bad month ${it.title}`
    const day = Number(match[1])
    const hour = Number(match[4])
    const minute = Number(match[5])
    const start = DateTime.fromObject({ year, month, day, hour, minute }, { zone: 'Europe/Berlin' })
    const summary = match[7].trim()
    calendar.createEvent({
      start,
      summary,
      description: it.description,
      url: it.link,
      timezone: 'Europe/Berlin',
    })
  }
  return calendar.toString()
}

async function override(env: Env, title: string): Promise<string> {
  const overridden = await env.olics.get(title)
  return overridden ?? title
}

import ical from 'ical-generator'
import { DateTime } from 'luxon'

import log from './logger'
import { Rss } from './rss-to-json'

export default async function (rss: Rss, env: Env) {
  const calendar = ical({ name: 'Otherland Events' })
  calendar.timezone(EuropeBerlinTz)
  const pattern = /(\d+). ([A-Z][a-zä][a-z]) (\d{4}) \((\d+):(\d+)(–.*)?\) (.*)/
  for (const it of rss.items) {
    const title = await override(env, it.title)
    const match = title.match(pattern)
    if (!match) {
      log(`bad match ${it.title}`)
      continue
    }
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
    if (month == null) {
      log(`bad month ${it.title}`)
      continue
    }
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
  const overridden = await env.kv.get(title)
  return overridden ?? title
}

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
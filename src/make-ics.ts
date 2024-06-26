import ical from 'ical-generator'
import { DateTime } from 'luxon'

import log from './logger'
import { Rss } from './rss-to-json'

export default async function (rss: Rss, env: Env) {
  const calendar = ical({ name: 'Otherland Events' })
  calendar.timezone(EuropeBerlinTz)
  const pattern =
    /((?<day1>\d+). (?<month1>[A-Z][a-zä][a-z]) (?<year1>\d{4})|(?<year2>\d{4})[-–](?<month2>\d{2})[-–](?<day2>\d{2})) \((?<hour>\d+):(?<minute>\d+)([-–].*)?\) (?<title>.*)/
  for (const it of rss.items) {
    const title = await override(env, it.title)
    let match = title.match(pattern)
    if (!match || !match.groups) {
      log(`bad match ${it.title}`)
      continue
    }
    const year = +(match.groups.year1 ?? match.groups.year2)
    const month =
      {
        Jan: 1,
        Feb: 2,
        Mär: 3,
        Mar: 3,
        Apr: 4,
        Mai: 5,
        May: 5,
        Jun: 6,
        Jul: 7,
        Aug: 8,
        Sep: 9,
        Okt: 10,
        Oct: 10,
        Nov: 11,
        Dez: 12,
        Dec: 12,
      }[match.groups.month1] ?? +match.groups.month2
    if (!month || isNaN(month)) {
      log(`bad month ${it.title}`)
      continue
    }
    const day = +(match.groups.day1 ?? match.groups.day2)
    const hour = +match.groups.hour
    const minute = +match.groups.minute
    if(isNaN(year + month + day + hour + minute)) {
      log(`NaN date ${it.title}`)
    }
    const start = DateTime.fromObject({ year, month, day, hour, minute }, { zone: 'Europe/Berlin' })
    const summary = match.groups.title?.trim() ?? ''
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

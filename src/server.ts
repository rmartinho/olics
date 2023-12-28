import * as express from 'express'
import { parse } from 'rss-to-json'
import ical from 'ical-generator'
import { DateTime } from 'luxon'
import { getVtimezoneComponent } from '@touch4it/ical-timezones'

type RssItem = { title: string; description: string; link: string }

const feedUrl = 'https://www.otherland-berlin.de/share/otherland-events.xml'

const app = express()
app.use(express.static('public'))

app.get('/otherland-events.ics', async (_request, response) => {
  try {
    const content = await makeIcs()
    response.set('Content-Type', 'text/calendar')
    response.send(content)
  } catch (error) {
    response.send()
  }
})

app.listen(3000, () => {
  console.log('Server is listening on port 3000')
})

async function makeIcs() {
  const rss = await parse(feedUrl)

  const calendar = ical({ name: 'Otherland Events' })
  calendar.timezone({
    name: 'Europe/Berlin',
    generator: getVtimezoneComponent,
  })
  const pattern = /(\d+). ([A-Z][a-zä][a-z]) (\d{4}) \((\d+):(\d+)\) (.*)/
  rss.items.forEach((it: RssItem) => {
    const match = it.title.match(pattern)
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
    const start = DateTime.fromObject(
      { year, month, day, hour, minute },
      { zone: 'Europe/Berlin' }
    )
    const summary = match[6]
    calendar.createEvent({
      start,
      summary,
      description: it.description,
      url: it.link,
      timezone: 'Europe/Berlin'
    })
  })
  return calendar.toString()
}

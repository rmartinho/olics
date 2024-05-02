import log from './logger'
import makeIcs from './make-ics'
import parseRss from './rss-to-json'

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    log.init(env, ctx)
    const cacheKey = request.clone()
    const cache = caches.default
    let response = await cache.match(cacheKey)
    if (!response) {
      try {
        const rss = await parseRss(feedUrl)
        const content = await makeIcs(rss, env)
        response = new Response(content, { headers: cacheHeaders })
        ctx.waitUntil(cache.put(cacheKey, response.clone()))
      } catch (e) {
        log('' + e)
        response = new Response(null, { status: 500 })
      }
    }
    return response
  },
} satisfies ExportedHandler<Env>

const feedUrl = 'https://www.otherland-berlin.de/share/otherland-events.xml'

const cacheHeaders = {
  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
  'Content-Type': 'text/calendar',
  'Content-Disposition': 'attachment; filename=otherland.ics',
}

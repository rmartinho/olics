import { DateTime, Duration } from 'luxon'
import crypto from 'node:crypto'

function log(message: string) {
  const id = crypto.randomUUID()
  const timestamp = DateTime.now().toISO()
  const expirationTtl = Duration.fromObject({ days: 7 }).as('seconds')
  options.ctx.waitUntil(options.env.logs.put(id, `${timestamp} ${message}`, { expirationTtl }))
}

log.init = (env: Env, ctx: ExecutionContext) => {
  options = { env, ctx }
}

export default log

let options: {
  env: Env
  ctx: ExecutionContext
}

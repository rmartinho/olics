import { EmailMessage } from 'cloudflare:email'
import { DateTime } from 'luxon'
import { createMimeMessage } from 'mimetext/browser'

async function log(message: string) {
  const timestamp = DateTime.now().toISO()
  message = `${timestamp} ${message}`
  logs.push(message.replace('\n', '\r\n'))
  console.log(message)
}
log.init = (env: Env) => {
  options = { env }
}

log.send = async () => {
  if (!logs.length) return
  const msg = createMimeMessage()
  msg.setSender({ name: 'olics', addr: 'logs@pinus.rmf.io' })
  msg.setRecipient('olics@rmf.io')
  msg.setSubject('Execution logs from olics')
  msg.addMessage({ contentType: 'text/plain', data: logs.join('\r\n') })

  var message = new EmailMessage('logs@pinus.rmf.io', 'olics@rmf.io', msg.asRaw())
  return options.env.email.send(message)
}

export default log

let logs = [] as string[]

let options: {
  env: Env
}

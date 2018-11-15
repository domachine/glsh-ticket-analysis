import { IncomingMessage } from 'http'
import { parse } from 'querystring'
import { text, createError } from 'micro'
import * as request from 'request-promise-native'
import * as URL from 'url'
import { createAutotaskClient } from '@domachine/autotask'
import createServices from './services'
import { analyseTicket } from './analyse-ticket'

const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL
const autotaskUsername = process.env.AUTOTASK_USERNAME
const autotaskPassword = process.env.AUTOTASK_PASSWORD
if (!slackWebhookUrl) throw new Error('No SLACK_WEBHOOK_URL set')
if (!autotaskUsername || !autotaskPassword)
  throw new Error('Incomplete autotask credentials')
const servicesP = createAutotaskClient({
  username: autotaskUsername,
  password: autotaskPassword
}).then((autotask: any) =>
  createServices({
    autotask,
    azureCognitive: request.defaults({
      baseUrl: process.env.AZURE_API_URL,
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_API_KEY
      }
    })
  })
)

export default async (req: IncomingMessage) => {
  const services = await servicesP
  const body = parse(await text(req))
  const { query } = URL.parse(req.url || '/', true)
  if (process.env.TOKEN && query.token !== process.env.TOKEN)
    throw createError(401, 'Invalid token')
  return analyseTicket(services, body.id as string)
}

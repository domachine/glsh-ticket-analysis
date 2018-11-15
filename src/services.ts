import { RequiredUriUrl, RequestAPI } from 'request'
import { RequestPromiseOptions, RequestPromise } from 'request-promise-native'
import { fetchTicket, updateTicket } from './services/autotask'
import { analyseText } from './services/azure-cognitive'
import { TextAnalysis, Ticket } from './models'

export interface Services {
  fetchTicket(id: string): Promise<Ticket>
  analyseText(text: string): Promise<TextAnalysis>
  updateTicket(ticket: Ticket): Promise<void>
}

export interface Params {
  autotask: any
  azureCognitive: RequestAPI<
    RequestPromise,
    RequestPromiseOptions,
    RequiredUriUrl
  >
}

export default (params: Params): Services => ({
  fetchTicket: fetchTicket.bind(params),
  updateTicket: updateTicket.bind(params),
  analyseText: analyseText.bind(params)
})

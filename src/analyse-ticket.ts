import { Services } from './services'
import { TextAnalysis } from './models'
import { createError } from 'micro'
import { UnsupportedLanguageError } from './services/azure-cognitive'

export const calculatePriority = (sentiment: number) =>
  sentiment <= 0.2 ? 4 : sentiment < 0.3 ? 3 : 0

export const calculateTicketPriority = (
  ticketPriority: number,
  calculatedPriority: number
) => (calculatedPriority > ticketPriority ? calculatedPriority : ticketPriority)

export const analyseTicket = async (
  services: Pick<Services, 'fetchTicket' | 'analyseText' | 'updateTicket'>,
  ticketId: string
): Promise<TextAnalysis | { skip: boolean; message: string }> => {
  const ticket = await services.fetchTicket(ticketId)
  if (!ticket) throw createError(404, 'Ticket not found')
  if (!ticket.title && !ticket.description)
    throw createError(400, 'Ticket has no description')
  const text = (ticket.title + '. ' + ticket.description).slice(0, 5000)
  let textAnalysis: TextAnalysis
  try {
    textAnalysis = await services.analyseText(text)
  } catch (err) {
    if (err.name === UnsupportedLanguageError.name)
      return { skip: true, message: err.message }
    else throw err
  }
  const priority = calculateTicketPriority(
    Number(ticket.priority),
    calculatePriority(textAnalysis.sentiment)
  )
  await services.updateTicket({
    ...ticket,
    priority: String(priority),
    userDefinedFields: {
      ...ticket.userDefinedFields,
      textanalytics: String(Math.round(textAnalysis.sentiment * 100)),
      keyphrases: (textAnalysis.keyPhrases || []).join(', '),
      ...priority !== Number(ticket.priority) ? { pbta: ticket.priority } : {}
    }
  })
  return textAnalysis
}

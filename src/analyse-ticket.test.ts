import {
  analyseTicket,
  calculatePriority,
  calculateTicketPriority
} from './analyse-ticket'
import { Ticket } from './models'
import { UnsupportedLanguageError } from './services/azure-cognitive'

test('Calculate priority', () => {
  expect(calculatePriority(0.1)).toEqual(4)
  expect(calculatePriority(0.2)).toEqual(4)
  expect(calculatePriority(0.21)).toEqual(3)
  expect(calculatePriority(0.29)).toEqual(3)
  expect(calculatePriority(0.5)).toEqual(0)
})

test('Calculate ticket-priority', () => {
  expect(calculateTicketPriority(3, 4)).toEqual(4)
  expect(calculateTicketPriority(5, 4)).toEqual(5)
  expect(calculateTicketPriority(2, 2)).toEqual(2)
})

test('Analyse ticket', async () => {
  const ticketId = '10708'
  const ticketTitle = ''
  const ticketDescription = 'Blubasdasdad'
  const ticketPriority = '1'
  const ticket: Ticket = {
    id: ticketId,
    title: ticketTitle,
    description: ticketDescription,
    priority: ticketPriority,
    userDefinedFields: {}
  }
  const sentiment = 0.146332
  const mockedAzureRes = { sentiment }
  const services = {
    fetchTicket: jest.fn(() => Promise.resolve(ticket)),
    analyseText: jest.fn(() => Promise.resolve(mockedAzureRes)),
    updateTicket: jest.fn(() => Promise.resolve())
  }
  await analyseTicket(services as any, ticketId)
  expect(services.fetchTicket.mock.calls[0]).toMatchSnapshot()
  expect(services.analyseText.mock.calls[0]).toMatchSnapshot()
  expect(services.updateTicket.mock.calls[0]).toMatchSnapshot()
})

test('Analyse ticket with long description', async () => {
  const ticketId = '10708'
  const ticketTitle = ''
  const ticketDescription = Array.from({ length: 6000 })
    .map(() => 'x')
    .join('')
  const ticketPriority = '1'
  const ticket: Ticket = {
    id: ticketId,
    title: ticketTitle,
    description: ticketDescription,
    priority: ticketPriority,
    userDefinedFields: {}
  }
  const sentiment = 0.146332
  const mockedAzureRes = { sentiment }
  const services = {
    fetchTicket: jest.fn(() => Promise.resolve(ticket)),
    analyseText: jest.fn(() => Promise.resolve(mockedAzureRes)),
    updateTicket: jest.fn(() => Promise.resolve())
  }
  await analyseTicket(services as any, ticketId)
  expect(ticketDescription.slice(0, 5000).length).toEqual(5000)
  expect(services.analyseText.mock.calls[0]).toEqual([
    (ticketTitle + '. ' + ticketDescription).slice(0, 5000)
  ])
})

test('Stop on unsupported language', async () => {
  const ticketId = '10708'
  const ticketTitle = ''
  const ticketDescription = 'asasd'
  const ticketPriority = '1'
  const ticket: Ticket = {
    id: ticketId,
    title: ticketTitle,
    description: ticketDescription,
    priority: ticketPriority,
    userDefinedFields: {}
  }
  const services = {
    fetchTicket: jest.fn(() => Promise.resolve(ticket)),
    analyseText: jest.fn(() =>
      Promise.reject(new UnsupportedLanguageError('ro', ''))
    ),
    updateTicket: jest.fn(() => Promise.resolve())
  }
  expect(await analyseTicket(services as any, ticketId)).toEqual({
    skip: true,
    message: ''
  })
  expect(services.updateTicket.mock.calls.length).toBe(0)
})

import {
  updateTicketUserField,
  updateTicketFields,
  getTicketField,
  getTicketUserDefinedFields
} from './autotask'
import { Ticket } from '../models'
test('Update existing ticket field', () => {
  const value = 'my value'
  const sample = {
    Entity: [
      {
        UserDefinedFields: [
          {
            UserDefinedField: [{ Name: ['textanalytics'], Value: ['test'] }]
          }
        ]
      }
    ]
  }
  expect(updateTicketUserField('textanalytics', value)(sample)).toEqual({
    Entity: [
      {
        UserDefinedFields: [
          {
            UserDefinedField: [{ Name: ['textanalytics'], Value: [value] }]
          }
        ]
      }
    ]
  })
})
test('Update missing ticket field', () => {
  const value = 'my value'
  const sample = {
    Entity: [
      {
        UserDefinedFields: ['']
      }
    ]
  }
  expect(updateTicketUserField('textanalytics', value)(sample)).toEqual({
    Entity: [
      {
        UserDefinedFields: [
          {
            UserDefinedField: [{ Name: ['textanalytics'], Value: [value] }]
          }
        ]
      }
    ]
  })
})
test('Update all ticket fields', () => {
  const ticket: Ticket = {
    id: 'my id',
    title: 'test title',
    description: 'test description',
    priority: '20',
    userDefinedFields: { textanalytics: 'foobar' }
  }
  const sample = {
    Entity: [
      {
        UserDefinedFields: ['']
      }
    ]
  }
  const result = updateTicketFields(ticket)(sample)
  expect(getTicketUserDefinedFields(result)).toEqual(ticket.userDefinedFields)
  expect(getTicketField('Title')(result)).toEqual(ticket.title)
  expect(getTicketField('Description')(result)).toEqual(ticket.description)
  expect(getTicketField('Priority')(result)).toEqual(ticket.priority)
})
test('Update user defined field', () => {
  const ticket: Ticket = {
    id: '123',
    title: 'testinger title',
    description: 'testinger description',
    priority: '20',
    userDefinedFields: {
      keyphrases: 'My phrases',
      textanalytics: '0.7'
    }
  }
  expect(
    updateTicketFields(ticket)({
      Entity: [
        {
          $: { 'xsi:type': 'Ticket' },
          id: ['86693'],
          UserDefinedFields: [
            {
              UserDefinedField: [
                { Name: ['keyphrases'] },
                { Name: ['pbta'] },
                { Name: ['textanalytics'], Value: ['0.5'], test: 42 }
              ]
            }
          ]
        }
      ]
    } as any)
  ).toEqual({
    Entity: [
      {
        $: { 'xsi:type': 'Ticket' },
        id: ['86693'],
        Description: [{ _: 'testinger description' }],
        Title: [{ _: 'testinger title' }],
        Priority: [{ _: ticket.priority }],
        UserDefinedFields: [
          {
            UserDefinedField: [
              {
                Name: ['keyphrases'],
                Value: [ticket.userDefinedFields.keyphrases]
              },
              { Name: ['pbta'] },
              {
                Name: ['textanalytics'],
                Value: [ticket.userDefinedFields.textanalytics],
                test: 42
              }
            ]
          }
        ]
      }
    ]
  })
  expect(
    updateTicketFields(ticket)({
      Entity: [
        {
          $: { 'xsi:type': 'Ticket' },
          id: ['86693'],
          UserDefinedFields: ['']
        }
      ]
    } as any)
  ).toEqual({
    Entity: [
      {
        $: { 'xsi:type': 'Ticket' },
        id: ['86693'],
        Description: [{ _: 'testinger description' }],
        Title: [{ _: 'testinger title' }],
        Priority: [{ _: ticket.priority }],
        UserDefinedFields: [
          {
            UserDefinedField: [
              {
                Name: ['textanalytics'],
                Value: [ticket.userDefinedFields.textanalytics]
              },
              {
                Name: ['keyphrases'],
                Value: [ticket.userDefinedFields.keyphrases]
              }
            ]
          }
        ]
      }
    ]
  })
  expect(
    updateTicketFields(ticket)({
      Entity: [
        {
          $: { 'xsi:type': 'Ticket' },
          id: ['86693']
        }
      ]
    } as any)
  ).toEqual({
    Entity: [
      {
        $: { 'xsi:type': 'Ticket' },
        id: ['86693'],
        Description: [{ _: 'testinger description' }],
        Title: [{ _: 'testinger title' }],
        Priority: [{ _: ticket.priority }],
        UserDefinedFields: [
          {
            UserDefinedField: [
              {
                Name: ['textanalytics'],
                Value: [ticket.userDefinedFields.textanalytics]
              },
              {
                Name: ['keyphrases'],
                Value: [ticket.userDefinedFields.keyphrases]
              }
            ]
          }
        ]
      }
    ]
  })
})
test('Get user defined fields', () => {
  expect(
    getTicketUserDefinedFields({
      Entity: [
        {
          $: { 'xsi:type': 'Ticket' },
          id: ['86693'],
          UserDefinedFields: ['']
        }
      ]
    } as any)
  ).toEqual({})
  expect(
    getTicketUserDefinedFields({
      Entity: [
        {
          $: { 'xsi:type': 'Ticket' },
          id: ['86693']
        }
      ]
    } as any)
  ).toEqual({})
})

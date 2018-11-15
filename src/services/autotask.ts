import { compose } from 'ramda'
import { Ticket } from '../models'
import { Params } from '../services'

type TicketFields = 'Title' | 'Description' | 'Priority'

export interface AutotaskUserDefinedField {
  Name: string[]
  Value?: string[]
}

export interface AutotaskUserDefinedFields {
  UserDefinedField: { Name: string[]; Value?: string[] }[]
}

export interface AutotaskTicket {
  Entity: {
    Title?: { _: string }[]
    Description?: { _: string }[]
    Priority?: { _: string }[]
    UserDefinedFields?: (string | AutotaskUserDefinedFields)[]
  }[]
}

export const getTicketField = (key: TicketFields) => (
  ticket: AutotaskTicket
): string | null => {
  const field = ticket.Entity[0][key]
  if (!field) return null
  return field[0]._
}

export const getTicketUserDefinedFields = (
  ticket: AutotaskTicket
): { [key: string]: string } => {
  const entity = ticket.Entity[0]
  if (!entity.UserDefinedFields) return {}
  const fieldWrapper = entity.UserDefinedFields[0] as AutotaskUserDefinedFields
  if (!fieldWrapper) return {}
  const fields = fieldWrapper.UserDefinedField
  if (!fields) return {}
  return fields.reduce((fields, field) => {
    if (field.Value === undefined) return fields
    return {
      ...fields,
      [field.Name[0]]: field.Value[0]
    }
  }, {})
}

export const updateTicketFields = (ticket: Ticket) =>
  compose(
    updateTicketField('Title', ticket.title),
    updateTicketField('Description', ticket.description),
    updateTicketField('Priority', ticket.priority),
    ...Object.keys(ticket.userDefinedFields).map(key =>
      updateTicketUserField(key, ticket.userDefinedFields[key])
    )
  )

export const updateTicketField = (name: TicketFields, value: string) => (
  ticket: AutotaskTicket
) => {
  const field = (ticket.Entity[0][name] || [])[0]
  return {
    ...ticket,
    Entity: [
      { ...ticket.Entity[0], [name]: [{ ...field, _: value }] },
      ...ticket.Entity.slice(1)
    ]
  }
}

export const updateTicketUserField = (name: string, value: string) => (
  ticket: AutotaskTicket
) => {
  const entity = ticket.Entity[0]
  const normalizedFields: AutotaskUserDefinedFields['UserDefinedField'] =
    !entity.UserDefinedFields || entity.UserDefinedFields[0] === ''
      ? []
      : (entity.UserDefinedFields[0] as AutotaskUserDefinedFields)
          .UserDefinedField
  const updatedFields = normalizedFields.find(field => field.Name[0] === name)
    ? normalizedFields.map(
        field => (field.Name[0] === name ? { ...field, Value: [value] } : field)
      )
    : [...normalizedFields, { Name: [name], Value: [value] }]
  return {
    ...ticket,
    Entity: [
      {
        ...ticket.Entity[0],
        UserDefinedFields: [{ UserDefinedField: updatedFields }]
      },
      ...ticket.Entity.slice(1)
    ]
  }
}

export async function fetchAutotaskTicket(
  this: Pick<Params, 'autotask'>,
  id: string
): Promise<AutotaskTicket | null> {
  const res = await this.autotask.query({
    queryxml: {
      entity: 'ticket',
      query: { field: { _: 'id', expression: { $: { op: 'equals' }, _: id } } }
    }
  })
  if (!res.EntityResults.length || !res.EntityResults[0].Entity) return null
  const autotaskTicket = res.EntityResults[0]
  return autotaskTicket
}

export async function fetchTicket(
  this: Pick<Params, 'autotask'>,
  id: string
): Promise<Ticket | null> {
  const autotaskTicket = await fetchAutotaskTicket.call(this, id)
  if (!autotaskTicket) return null
  return {
    id,
    title: getTicketField('Title')(autotaskTicket) || '',
    description: getTicketField('Description')(autotaskTicket) || '',
    priority: getTicketField('Priority')(autotaskTicket) || '-1',
    userDefinedFields: getTicketUserDefinedFields(autotaskTicket)
  }
}

export async function updateTicket(
  this: Pick<Params, 'autotask'>,
  ticket: Ticket
) {
  const autotaskTicket = await fetchAutotaskTicket.call(this, ticket.id)
  await this.autotask.update(updateTicketFields(ticket)(autotaskTicket))
}

export interface TextAnalysis {
  sentiment: number
  language: string | null
  keyPhrases: string[]
}

export interface Ticket {
  id: string
  title: string
  description: string
  priority: string
  userDefinedFields: {
    [key: string]: string
  }
}

import { Params } from '../services'

export class UnsupportedLanguageError extends Error {
  constructor(public language: string, public message: string) {
    super(message)
    this.name = UnsupportedLanguageError.name
  }
}

const SUPPORTED_LANGUAGES = new Set([
  'ar',
  'da',
  'de',
  'el',
  'en',
  'es',
  'fi',
  'fr',
  'it',
  'ja',
  'nl',
  'no',
  'pl',
  'pt-PT',
  'ru',
  'sv',
  'tr',
  'zh-Hans'
])

export const extractDocumentLanguage = (res: {
  detectedLanguages: { iso6391Name: string; score: number }[]
}): string | null => {
  const lang = res.detectedLanguages
    .slice()
    .sort((a, b) => a.score - b.score)[0]
  return lang ? lang.iso6391Name : null
}

export async function analyseText(this: Params, text: string) {
  const languagesRes = await this.azureCognitive.post(
    '/text/analytics/v2.0/languages',
    { json: { documents: [{ id: '1', text }] } }
  )
  if (languagesRes.errors[0]) throw new Error(languagesRes.errors[0].message)
  const language = extractDocumentLanguage(languagesRes.documents[0])
  if (!language) throw new Error("Language wasn't recognized")
  if (!SUPPORTED_LANGUAGES.has(language))
    throw new UnsupportedLanguageError(
      language,
      'Language is not supported by azure'
    )
  const [sentimentRes, keyPhrasesRes] = await Promise.all([
    this.azureCognitive.post('/text/analytics/v2.0/sentiment', {
      json: { documents: [{ id: '1', language, text }] }
    }),
    this.azureCognitive.post('/text/analytics/v2.0/keyPhrases', {
      json: { documents: [{ id: '1', language, text }] }
    })
  ])
  const errors = [sentimentRes, keyPhrasesRes]
    .map(res => res.errors[0])
    .filter(Boolean)
  if (errors[0]) throw new Error(errors[0].message)
  const sentiment = sentimentRes.documents[0].score
  const keyPhrases = keyPhrasesRes.documents[0].keyPhrases
  return { language, sentiment, keyPhrases }
}

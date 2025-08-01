import { Context, Effect, Layer } from 'effect'
import mammoth from 'mammoth'
import { LoggerService } from './logger.js'

const getPdfParser = async () => {
  const pdf = await import('pdf-parse-new')
  return pdf.default
}

export interface FileParserService {
  readonly parseFile: (fileBuffer: Buffer, fileName: string) => Effect.Effect<string, Error>
}

export const FileParserService = Context.GenericTag<FileParserService>('FileParserService')

const make = Effect.gen(function* () {
  const logger = yield* LoggerService

  return {
    parseFile: (fileBuffer: Buffer, fileName: string) =>
      Effect.gen(function* () {
        const extension = fileName.toLowerCase().split('.').pop()

        yield* logger.info('Parsing file', {
          fileName,
          extension,
          fileSize: fileBuffer.length,
        })

        let textContent = ''

        switch (extension) {
          case 'pdf': {
            yield* logger.debug('Parsing PDF file')
            const pdfParser = yield* Effect.tryPromise({
              try: () => getPdfParser(),
              catch: (error) => new Error(`Failed to load PDF parser: ${error}`),
            })
            const pdfData = yield* Effect.tryPromise({
              try: () => pdfParser(fileBuffer),
              catch: (error) => new Error(`PDF parsing failed: ${error}`),
            })
            textContent = pdfData.text

            yield* logger.debug('PDF metadata', {
              pages: pdfData.numpages,
              info: pdfData.info,
            })
            break
          }

          case 'docx': {
            yield* logger.debug('Parsing DOCX file')
            const docxResult = yield* Effect.tryPromise({
              try: () => mammoth.extractRawText({ buffer: fileBuffer }),
              catch: (error) => new Error(`DOCX parsing failed: ${error}`),
            })
            textContent = docxResult.value

            if (docxResult.messages.length > 0) {
              yield* logger.warn('DOCX parsing warnings', {
                warnings: docxResult.messages,
              })
            }
            break
          }

          case 'doc': {
            yield* logger.debug('Parsing DOC file')
            const docParseResult = yield* Effect.tryPromise({
              try: () => mammoth.extractRawText({ buffer: fileBuffer }),
              catch: () => new Error('DOC parsing failed'),
            }).pipe(Effect.catchAll(() => Effect.succeed(null)))

            if (docParseResult) {
              textContent = docParseResult.value
            } else {
              textContent = fileBuffer.toString('utf-8')
            }
            break
          }

          case 'txt':
          case 'text': {
            yield* logger.debug('Parsing text file')
            textContent = fileBuffer.toString('utf-8')
            break
          }

          case 'rtf': {
            yield* logger.debug('Parsing RTF file')
            textContent = fileBuffer.toString('utf-8')
            textContent = textContent.replace(/\\[a-z]+(\d+)?[ ]?/gi, ' ')
            textContent = textContent.replace(/[{}]/g, '')
            break
          }

          default: {
            yield* logger.warn('Unknown file format, attempting text extraction', {
              extension,
            })
            textContent = fileBuffer.toString('utf-8')
            break
          }
        }

        textContent = textContent
          .replace(/\s+/g, ' ')
          .replace(/\n{3,}/g, '\n\n')
          .trim()

        if (!textContent || textContent.length < 10) {
          return yield* Effect.fail(new Error('No readable text content found in file'))
        }

        yield* logger.info('File parsing completed', {
          fileName,
          extractedLength: textContent.length,
          preview: `${textContent.substring(0, 100)}...`,
        })

        return textContent
      }),
  } satisfies FileParserService
})

export const FileParserServiceLive = Layer.effect(FileParserService, make)

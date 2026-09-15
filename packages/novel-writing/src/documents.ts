import { Document, HeadingLevel, Packer, Paragraph, PatchType, TableOfContents, TextRun, patchDocument } from 'docx'
import { strToU8, zipSync } from 'fflate'
import { z } from 'zod'

const revisionSchema = z.number().int().nonnegative()

const novelPublicationFormatSchema = z.enum(['utf8', 'source', 'epub', 'docx'])

const novelPublicationScopeSchema = z.enum(['unit', 'book'])

export const novelPublicationRequestSchema = z.object({
  revision: revisionSchema,
  unitId: z.string().min(1),
  destination: z.string().min(1),
  format: novelPublicationFormatSchema.default('utf8'),
  scope: novelPublicationScopeSchema.default('unit'),
  title: z.string().min(1).optional(),
  coverPath: z.string().min(1).optional(),
  templatePath: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
}).strict()

export type NovelPublicationRequest = z.infer<typeof novelPublicationRequestSchema>

export interface NovelPublicationChapter {
  readonly unitId: string
  readonly title: string
  readonly text: string
  readonly sourceRevision: number
}

export interface BinaryNovelPublication {
  readonly revision: number
  readonly scope: 'unit' | 'book'
  readonly unitId: string
  readonly format: 'epub' | 'docx'
  readonly title: string
  readonly chapters: readonly NovelPublicationChapter[]
  readonly cover?: NovelPublicationCover
  readonly template?: Uint8Array
  readonly author?: string
  readonly language?: string
}

export interface NovelPublicationCover {
  readonly extension: 'png' | 'jpg'
  readonly mediaType: 'image/png' | 'image/jpeg'
  readonly bytes: Uint8Array
}

export function novelPublicationCoverFormat(coverPath: string): Pick<NovelPublicationCover, 'extension' | 'mediaType'> {
  const normalizedPath = coverPath.toLowerCase()
  if (normalizedPath.endsWith('.png')) {
    return { extension: 'png', mediaType: 'image/png' }
  }
  if (normalizedPath.endsWith('.jpg') || normalizedPath.endsWith('.jpeg')) {
    return { extension: 'jpg', mediaType: 'image/jpeg' }
  }
  throw new Error(`EPUB cover '${coverPath}' must be a PNG or JPEG file`)
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export async function encodeNovelDocument(publication: BinaryNovelPublication): Promise<Uint8Array> {
  if (publication.format === 'docx') {
    if (publication.template !== undefined) {
      const content = publication.scope === 'unit'
        ? publication.chapters[0]!.text
            .split(/\r\n|\r|\n/)
            .map(line => new Paragraph(line))
        : publication.chapters.flatMap(chapter => [
            new Paragraph({
              text: chapter.title,
              heading: HeadingLevel.HEADING_2,
              pageBreakBefore: true,
            }),
            ...chapter.text
              .split(/\r\n|\r|\n/)
              .map(line => new Paragraph(line)),
          ])
      return await patchDocument({
        outputType: 'nodebuffer',
        data: publication.template,
        patches: {
          title: {
            type: PatchType.PARAGRAPH,
            children: [new TextRun(publication.title)],
          },
          content: {
            type: PatchType.DOCUMENT,
            children: content,
          },
        },
        keepOriginalStyles: true,
      })
    }
    const children = publication.scope === 'unit'
      ? [
          new Paragraph({
            text: publication.title,
            heading: HeadingLevel.HEADING_1,
          }),
          ...publication.chapters[0]!.text
            .split(/\r\n|\r|\n/)
            .map(line => new Paragraph(line)),
        ]
      : [
          new Paragraph({
            text: publication.title,
            heading: HeadingLevel.HEADING_1,
          }),
          new TableOfContents('目录', {
            headingStyleRange: '2-2',
            hyperlink: true,
          }),
          ...publication.chapters.flatMap(chapter => [
            new Paragraph({
              text: chapter.title,
              heading: HeadingLevel.HEADING_2,
              pageBreakBefore: true,
            }),
            ...chapter.text
              .split(/\r\n|\r|\n/)
              .map(line => new Paragraph(line)),
          ]),
        ]
    const document = new Document({
      title: publication.title,
      ...(publication.author === undefined ? {} : { creator: publication.author }),
      sections: [{
        children,
      }],
    })
    return await Packer.toBuffer(document)
  }

  const title = escapeXml(publication.title)
  const author = publication.author === undefined ? undefined : escapeXml(publication.author)
  const language = escapeXml(publication.language ?? 'und')
  const identifier = escapeXml(
    `urn:novel-agent:${publication.unitId}:revision-${String(publication.revision)}`,
  )
  const modifiedAt = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const chapters = publication.chapters.map((chapter, index) => {
    const id = publication.scope === 'unit' ? 'chapter' : `chapter-${String(index + 1)}`
    const href = `text/${id}.xhtml`
    return {
      id,
      href,
      title: escapeXml(chapter.title),
      text: escapeXml(chapter.text),
    }
  })
  const coverImageHref = publication.cover === undefined
    ? undefined
    : `images/cover.${publication.cover.extension}`
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${identifier}</dc:identifier>
    <dc:title>${title}</dc:title>
${author === undefined ? '' : `    <dc:creator>${author}</dc:creator>\n`}    <dc:language>${language}</dc:language>
    <meta property="dcterms:modified">${modifiedAt}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
${publication.cover === undefined ? '' : `    <item id="cover-image" href="${coverImageHref}" media-type="${publication.cover.mediaType}" properties="cover-image"/>
    <item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/>`}
${chapters.map(chapter => `    <item id="${chapter.id}" href="${chapter.href}" media-type="application/xhtml+xml"/>`).join('\n')}
  </manifest>
  <spine>
${publication.cover === undefined ? '' : '    <itemref idref="cover"/>\n'}${chapters.map(chapter => `    <itemref idref="${chapter.id}"/>`).join('\n')}
  </spine>
</package>`
  const navXhtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>${title}</title></head>
  <body><nav epub:type="toc"><ol>${chapters.map(chapter => `<li><a href="${chapter.href}">${chapter.title}</a></li>`).join('')}</ol></nav></body>
</html>`
  const chapterEntries = Object.fromEntries(chapters.map(chapter => [
    `OEBPS/${chapter.href}`,
    strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>${chapter.title}</title></head>
  <body><h1>${chapter.title}</h1><div style="white-space: pre-wrap">${chapter.text}</div></body>
</html>`),
  ]))
  const coverEntries = publication.cover === undefined
    ? {}
    : {
        [`OEBPS/${coverImageHref}`]: publication.cover.bytes,
        'OEBPS/text/cover.xhtml': strToU8(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>${title}</title></head>
  <body><div><img src="../${coverImageHref}" alt="${title}"/></div></body>
</html>`),
      }
  return zipSync({
    mimetype: [strToU8('application/epub+zip'), { level: 0 }],
    'META-INF/container.xml': strToU8(containerXml),
    'OEBPS/content.opf': strToU8(contentOpf),
    'OEBPS/nav.xhtml': strToU8(navXhtml),
    ...coverEntries,
    ...chapterEntries,
  }, { level: 9 })
}

export const novelTextImportRequestSchema = z.object({
  expectedRevision: revisionSchema,
  format: z.enum(['txt', 'markdown', 'epub', 'docx']),
  sourceId: z.string().min(1),
  unitId: z.string().min(1),
  title: z.string().min(1),
  text: z.string(),
  deltas: z.array(z.unknown()).default([]),
  sourceEncoding: z.string().min(1).optional(),
  sourceBom: z.boolean().optional(),
  sourceByteLength: z.number().int().nonnegative().optional(),
  sourcePath: z.string().min(1).optional(),
}).strict()

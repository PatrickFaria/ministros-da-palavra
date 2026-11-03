import * as pdfjs from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const MONTHS = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const MAX_FILE_SIZE = 20 * 1024 * 1024
const MAX_PAGES = 20

function normalizeText(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR')
}

function readMonthAndYear(text) {
  const normalized = normalizeText(text)
  const monthPattern = MONTHS.join('|')
  const match = normalized.match(new RegExp(`\\b(${monthPattern})\\b\\s*[–—-]?\\s*(20\\d{2})\\b`, 'i'))
  if (!match) throw new Error('Não encontrei o mês e o ano no cabeçalho do PDF.')
  return { month: MONTHS.indexOf(match[1]) + 1, year: Number(match[2]) }
}

function parseDateLabel(text, month, year) {
  const match = text.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/)
  if (!match) return null
  const day = Number(match[1])
  const labelMonth = Number(match[2])
  if (labelMonth !== month) throw new Error(`Encontrei uma data fora do mês do cabeçalho: ${match[0]}.`)
  const date = new Date(Date.UTC(year, labelMonth - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== labelMonth - 1 || date.getUTCDate() !== day) {
    throw new Error(`A data ${match[0]} não é válida.`)
  }
  return `${year}-${String(labelMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseTimes(text) {
  const times = []
  for (const match of text.matchAll(/\b(\d{1,2})\s*h(?:\s*(\d{2}))?\b/gi)) {
    const hour = Number(match[1])
    const minute = Number(match[2] || 0)
    if (hour > 23 || minute > 59) throw new Error(`Horário inválido no PDF: ${match[0]}.`)
    const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    if (!times.includes(time)) times.push(time)
  }
  return times
}

function groupPageLines(items, pageWidth) {
  const lines = []
  for (const item of items) {
    const text = item.str?.trim()
    if (!text) continue
    const x = item.transform?.[4] ?? 0
    const y = item.transform?.[5] ?? 0
    let line = lines.find((candidate) => Math.abs(candidate.y - y) <= 2.5)
    if (!line) {
      line = { y, items: [] }
      lines.push(line)
    }
    line.items.push({ x, text })
  }

  return lines.map((line) => {
    const columns = { date: [], community: [], time: [] }
    for (const item of line.items.sort((a, b) => a.x - b.x)) {
      if (item.x < pageWidth * 0.31) columns.date.push(item.text)
      else if (item.x < pageWidth * 0.84) columns.community.push(item.text)
      else columns.time.push(item.text)
    }
    return {
      y: line.y,
      dateText: columns.date.join(' ').replace(/\s+/g, ' ').trim(),
      communityText: columns.community.join(' ').replace(/\s+/g, ' ').trim(),
      timeText: columns.time.join(' ').replace(/\s+/g, ' ').trim(),
    }
  }).sort((a, b) => b.y - a.y)
}

function parsePageEvents(lines, monthInfo, inheritedDate) {
  const dateLabels = lines
    .map((line) => ({ y: line.y, date: parseDateLabel(line.dateText, monthInfo.month, monthInfo.year) }))
    .filter((item) => item.date)
  let lastDate = dateLabels.at(-1)?.date || inheritedDate
  const timeLines = lines.filter((line) => parseTimes(line.timeText).length)
  const candidates = lines.filter((line) => normalizeText(line.communityText).includes('missa matriz'))
  const events = []

  for (const candidate of candidates) {
    const matchingTimeLine = timeLines
      .map((line) => ({ line, distance: Math.abs(line.y - candidate.y) }))
      .sort((a, b) => a.distance - b.distance)[0]
    if (!matchingTimeLine || matchingTimeLine.distance > 8) {
      throw new Error(`Não consegui associar um horário ao evento “${candidate.communityText}”.`)
    }

    const dateLabel = dateLabels
      .map((label) => ({ ...label, distance: Math.abs(label.y - candidate.y) }))
      .sort((a, b) => a.distance - b.distance)[0]
    const date = dateLabel?.date || inheritedDate
    if (!date) throw new Error(`Não consegui identificar a data do evento “${candidate.communityText}”.`)

    const candidateIndex = lines.indexOf(candidate)
    const firstFollowingTimeIndex = lines.findIndex((line, index) => index > candidateIndex && parseTimes(line.timeText).length)
    const boundaryIndex = firstFollowingTimeIndex < 0 ? lines.length : firstFollowingTimeIndex
    let title = candidate.communityText
    for (let index = candidateIndex + 1; index < boundaryIndex; index += 1) {
      const continuation = lines[index]
      if (continuation.dateText || continuation.timeText) break
      if (Math.abs(continuation.y - candidate.y) > 36) break
      if (continuation.communityText) title += ` ${continuation.communityText}`
    }

    const times = parseTimes(matchingTimeLine.line.timeText)
    if (!times.length) throw new Error(`Não encontrei horários para “${title}”.`)
    for (const time of times) events.push({ title: title.replace(/\s+/g, ' ').trim(), date, time, kind: 'Missa' })
    if (dateLabel) lastDate = dateLabel.date
  }

  return { events, lastDate }
}

export async function parseMonthlyMassAgenda(file) {
  if (!file || !/\.pdf$/i.test(file.name || '') || (file.type && file.type !== 'application/pdf')) {
    throw new Error('Selecione um arquivo PDF da agenda mensal.')
  }
  if (file.size > MAX_FILE_SIZE) throw new Error('O PDF excede o limite de 20 MB.')

  let document
  try {
    const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) })
    document = await loadingTask.promise
    if (document.numPages > MAX_PAGES) throw new Error(`O PDF tem mais de ${MAX_PAGES} páginas.`)

    const pages = []
    const allText = []
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber)
      const content = await page.getTextContent()
      const lines = groupPageLines(content.items, page.getViewport({ scale: 1 }).width)
      pages.push(lines)
      allText.push(lines.map((line) => `${line.dateText} ${line.communityText} ${line.timeText}`).join(' '))
    }

    const monthInfo = readMonthAndYear(allText.join(' '))
    let inheritedDate = null
    const events = []
    for (const lines of pages) {
      const parsedPage = parsePageEvents(lines, monthInfo, inheritedDate)
      events.push(...parsedPage.events)
      inheritedDate = parsedPage.lastDate || inheritedDate
    }

    const uniqueEvents = [...new Map(events.map((event) => [`${normalizeText(event.title)}|${event.date}|${event.time}`, event])).values()]
    if (!uniqueEvents.length) throw new Error('Não encontrei eventos com o nome “Missa Matriz” neste PDF.')
    return uniqueEvents.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
  } catch (error) {
    if (error instanceof Error && /^(Não |O PDF |Encontrei |A data )/.test(error.message)) throw error
    throw new Error('Não foi possível ler este PDF. Use uma agenda em PDF de texto no modelo da paróquia.')
  } finally {
    await document?.destroy()
  }
}

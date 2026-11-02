import ExcelJS from 'exceljs'

const MONTHS = new Map([
  ['janeiro', 1], ['fevereiro', 2], ['marco', 3], ['abril', 4],
  ['maio', 5], ['junho', 6], ['julho', 7], ['agosto', 8],
  ['setembro', 9], ['outubro', 10], ['novembro', 11], ['dezembro', 12],
])
const PARTICIPATED_COLORS = new Set(['FF38761D'])
const NOT_PARTICIPATED_COLORS = new Set(['FFCC0000', 'FFFF0000', 'FFA61C00', 'FF980000'])

function normalizeText(value) {
  return String(value ?? '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function normalizeMinisterName(value) {
  return normalizeText(value).replace(/\s+/g, ' ')
}

function monthNumber(value) {
  const name = normalizeText(value).replace(/\.$/, '')
  if (MONTHS.has(name)) return MONTHS.get(name)
  return [...MONTHS.entries()].find(([month]) => month.startsWith(name) && name.length >= 3)?.[1] ?? null
}

function getCellColor(cell) {
  const fill = cell.fill
  if (fill?.type !== 'pattern' || fill.pattern !== 'solid' || !fill.fgColor) return null
  const color = fill.fgColor
  if (color.argb) return String(color.argb).replace(/^#/, '').toUpperCase()
  if (color.rgb) return String(color.rgb).replace(/^#/, '').toUpperCase()
  if (color.indexed !== undefined) return `INDEXED:${color.indexed}`
  if (color.theme !== undefined) return `THEME:${color.theme}:${color.tint ?? 0}`
  return null
}

function normalizeArgb(color) {
  if (!color || color.startsWith('INDEXED:') || color.startsWith('THEME:')) return color
  return color.length === 6 ? `FF${color}` : color
}

export async function parseLegacySpreadsheet(file) {
  if (!file || !/\.xlsx$/i.test(file.name)) throw new Error('Selecione uma planilha Excel no formato .xlsx.')
  if (file.size > 10 * 1024 * 1024) throw new Error('A planilha excede o limite de 10 MB.')

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())
  const sheet = workbook.worksheets[0]
  if (!sheet) throw new Error('Não encontrei nenhuma aba na planilha.')

  let headerRow = null
  let monthColumns = []
  for (let rowNumber = 1; rowNumber <= Math.min(sheet.rowCount, 10); rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const found = []
    row.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const month = monthNumber(cell.text || cell.value)
      if (month) found.push({ columnNumber, month })
    })
    if (found.length) { headerRow = rowNumber; monthColumns = found; break }
  }
  if (!headerRow || !monthColumns.length) throw new Error('Não consegui identificar os cabeçalhos de mês na primeira aba.')

  const people = []
  const colors = new Map()
  const unknownColors = new Set()
  let emptyCells = 0
  let nonParticipationCells = 0
  const duplicateNames = new Set()
  const seenNames = new Set()
  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber)
    const name = String(row.getCell(1).text || row.getCell(1).value || '').trim()
    if (!name) continue
    const normalizedName = normalizeMinisterName(name)
    if (seenNames.has(normalizedName)) duplicateNames.add(name)
    seenNames.add(normalizedName)
    const participatedMonths = []

    for (const { columnNumber, month } of monthColumns) {
      const cell = row.getCell(columnNumber)
      const color = normalizeArgb(getCellColor(cell))
      if (!color) { emptyCells += 1; continue }
      colors.set(color, (colors.get(color) || 0) + 1)
      if (PARTICIPATED_COLORS.has(color)) participatedMonths.push(month)
      else if (NOT_PARTICIPATED_COLORS.has(color)) nonParticipationCells += 1
      else unknownColors.add(color)
    }
    people.push({ name, participatedMonths })
  }

  if (!people.length) throw new Error('Não encontrei ministros abaixo da linha de cabeçalhos.')
  return {
    sheetName: sheet.name,
    people,
    monthColumns: monthColumns.map(({ month }) => month),
    colors: [...colors.entries()].map(([color, count]) => ({ color, count })),
    unknownColors: [...unknownColors],
    emptyCells,
    nonParticipationCells,
    duplicateNames: [...duplicateNames],
  }
}

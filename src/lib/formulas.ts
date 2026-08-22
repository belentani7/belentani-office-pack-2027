import type { GridContent } from './types'

const cellPattern = /^([A-Z]+)([1-9][0-9]*)$/

export function columnName(index: number): string {
  let value = index + 1
  let label = ''
  while (value > 0) {
    const remainder = (value - 1) % 26
    label = String.fromCharCode(65 + remainder) + label
    value = Math.floor((value - 1) / 26)
  }
  return label
}

function rangeCells(start: string, end: string): string[] {
  const startMatch = start.match(cellPattern)
  const endMatch = end.match(cellPattern)
  if (!startMatch || !endMatch) return []
  const toIndex = (column: string) => column.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1
  const from = toIndex(startMatch[1])
  const to = toIndex(endMatch[1])
  const firstRow = Number(startMatch[2])
  const lastRow = Number(endMatch[2])
  const output: string[] = []
  for (let col = Math.min(from, to); col <= Math.max(from, to); col += 1) {
    for (let row = Math.min(firstRow, lastRow); row <= Math.max(firstRow, lastRow); row += 1) output.push(`${columnName(col)}${row}`)
  }
  return output
}

export function calculateCell(address: string, grid: GridContent, visited = new Set<string>()): string {
  const raw = grid.cells[address] ?? ''
  if (!raw.startsWith('=')) return raw
  if (visited.has(address)) return '#CICLO'
  const nextVisited = new Set(visited).add(address)
  try {
    let expression = raw.slice(1).toUpperCase()
    expression = expression.replace(/SUM\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)/g, (_match, start, end) => {
      const total = rangeCells(start, end).reduce((sum, cell) => sum + Number(calculateCell(cell, grid, nextVisited) || 0), 0)
      return String(total)
    })
    expression = expression.replace(/AVERAGE\(([A-Z]+[0-9]+):([A-Z]+[0-9]+)\)/g, (_match, start, end) => {
      const values = rangeCells(start, end).map((cell) => Number(calculateCell(cell, grid, nextVisited) || 0))
      return String(values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0)
    })
    expression = expression.replace(/\b([A-Z]+[1-9][0-9]*)\b/g, (reference) => {
      const value = calculateCell(reference, grid, nextVisited)
      return String(Number(value) || 0)
    })
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) return '#FORMATO'
    const result = Function(`"use strict"; return (${expression})`)()
    return Number.isFinite(result) ? String(Number(result.toFixed(10))) : '#ERROR'
  } catch {
    return '#ERROR'
  }
}

export function formulaExplanation(raw: string): string {
  if (!raw.startsWith('=')) return 'Valor literal. Escribe = para iniciar una fórmula.'
  if (/^=SUM\(/i.test(raw)) return 'SUM agrega todos los valores del rango indicado.'
  if (/^=AVERAGE\(/i.test(raw)) return 'AVERAGE calcula el promedio del rango indicado.'
  return 'Fórmula aritmética. Puedes usar referencias de celda, +, −, ×, ÷, SUM y AVERAGE.'
}

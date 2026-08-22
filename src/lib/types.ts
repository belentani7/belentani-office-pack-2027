export type DocumentKind = 'write' | 'grid' | 'canvas' | 'slides' | 'pdf'

export type FormatHealth = 'native' | 'interoperable' | 'preserved'

export interface DocumentMetadata {
  lastSavedAt?: string
  aiConsent: boolean
  formatHealth: FormatHealth
}

export interface WriteContent {
  html: string
}

export interface GridContent {
  cells: Record<string, string>
  columnWidths: Record<string, number>
  rowHeights: Record<string, number>
}

export type CanvasBlockType = 'note' | 'text' | 'file' | 'frame'

export interface CanvasBlock {
  id: string
  type: CanvasBlockType
  title: string
  body: string
  x: number
  y: number
  width: number
  height: number
  color: 'indigo' | 'amber' | 'mint' | 'rose' | 'slate'
  source?: string
}

export interface CanvasEdge {
  id: string
  from: string
  to: string
  label: 'referencia' | 'decisión' | 'dependencia' | 'libre'
}

export interface CanvasContent {
  blocks: CanvasBlock[]
  edges: CanvasEdge[]
}

export interface Slide {
  id: string
  title: string
  kicker: string
  body: string
  accent: 'violet' | 'teal' | 'amber' | 'rose'
  notes: string
}

export interface SlidesContent {
  slides: Slide[]
}

export interface PdfAnnotation {
  id: string
  page: number
  type: 'nota' | 'resaltado'
  text: string
  createdAt: string
}

export interface PdfContent {
  fileName?: string
  dataUrl?: string
  pageCount?: number
  annotations: PdfAnnotation[]
}

export type DocumentContent = WriteContent | GridContent | CanvasContent | SlidesContent | PdfContent

export interface BelentaniDocument {
  id: string
  title: string
  kind: DocumentKind
  createdAt: string
  updatedAt: string
  version: number
  content: DocumentContent
  metadata: DocumentMetadata
}

export interface RecoveryEntry {
  id: string
  path: string
  updatedAt: string
}

export const isWrite = (document: BelentaniDocument): document is BelentaniDocument & { content: WriteContent } => document.kind === 'write'
export const isGrid = (document: BelentaniDocument): document is BelentaniDocument & { content: GridContent } => document.kind === 'grid'
export const isCanvas = (document: BelentaniDocument): document is BelentaniDocument & { content: CanvasContent } => document.kind === 'canvas'
export const isSlides = (document: BelentaniDocument): document is BelentaniDocument & { content: SlidesContent } => document.kind === 'slides'
export const isPdf = (document: BelentaniDocument): document is BelentaniDocument & { content: PdfContent } => document.kind === 'pdf'

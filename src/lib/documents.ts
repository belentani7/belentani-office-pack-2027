import type { BelentaniDocument, CanvasContent, DocumentKind, GridContent, PdfContent, SlidesContent, WriteContent } from './types'

const now = () => new Date().toISOString()
const makeId = () => crypto.randomUUID()

const writeTemplate = (): WriteContent => ({
  html: `<h1>Documento sin título</h1><p>Empieza aquí. Belentani guarda una copia recuperable en este dispositivo mientras trabajas.</p><h2>Ideas principales</h2><p>Selecciona un texto y usa la barra de herramientas para darle estructura.</p>`
})

const gridTemplate = (): GridContent => ({
  cells: {
    A1: 'Proyecto', B1: 'Estado', C1: 'Presupuesto',
    A2: 'Diseño', B2: 'En curso', C2: '1200',
    A3: 'Pruebas', B3: 'Pendiente', C3: '800',
    B5: 'Total', C5: '=SUM(C2:C3)'
  },
  columnWidths: {},
  rowHeights: {}
})

const canvasTemplate = (): CanvasContent => ({
  blocks: [
    { id: makeId(), type: 'frame', title: 'Proyecto 2027', body: 'Marco de trabajo', x: 84, y: 72, width: 540, height: 360, color: 'slate' },
    { id: makeId(), type: 'note', title: 'Pregunta clave', body: '¿Qué necesita la persona para avanzar con confianza?', x: 126, y: 138, width: 220, height: 154, color: 'amber' },
    { id: makeId(), type: 'note', title: 'Siguiente paso', body: 'Crear una versión pequeña, probarla y aprender.', x: 390, y: 240, width: 190, height: 130, color: 'mint' }
  ],
  edges: []
})

const slidesTemplate = (): SlidesContent => ({
  slides: [
    { id: makeId(), kicker: 'BELENTANI / PRESENTACIÓN', title: 'Una historia que se entiende.', body: 'Construye una presentación clara desde una diapositiva en blanco. Este texto, el color y las notas se pueden editar.', accent: 'violet', notes: 'Abre explicando el propósito de la reunión.' },
    { id: makeId(), kicker: 'CONTEXTO', title: 'El problema antes de la solución.', body: 'Usa esta sección para ordenar hechos, necesidades y oportunidades de forma simple.', accent: 'teal', notes: 'Mantén una idea principal por diapositiva.' },
    { id: makeId(), kicker: 'DECISIÓN', title: 'El siguiente paso es visible.', body: 'Cierra con una acción concreta, una persona responsable y una fecha clara.', accent: 'amber', notes: 'Termina pidiendo una decisión concreta.' }
  ]
})

const pdfTemplate = (): PdfContent => ({ annotations: [] })

export function makeDocument(kind: DocumentKind, title?: string): BelentaniDocument {
  const createdAt = now()
  const content = kind === 'write' ? writeTemplate() : kind === 'grid' ? gridTemplate() : kind === 'canvas' ? canvasTemplate() : kind === 'slides' ? slidesTemplate() : pdfTemplate()
  const names: Record<DocumentKind, string> = { write: 'Documento sin título', grid: 'Hoja sin título', canvas: 'Canvas sin título', slides: 'Presentación sin título', pdf: 'Revisión PDF sin título' }
  return {
    id: makeId(),
    title: title ?? names[kind],
    kind,
    createdAt,
    updatedAt: createdAt,
    version: 1,
    content,
    metadata: { aiConsent: false, formatHealth: 'native' }
  }
}

export function touchDocument(document: BelentaniDocument, patch: Partial<BelentaniDocument>): BelentaniDocument {
  return {
    ...document,
    ...patch,
    updatedAt: now(),
    version: document.version + 1
  }
}

export const kindLabel: Record<DocumentKind, string> = {
  write: 'Documento',
  grid: 'Hoja',
  canvas: 'Canvas',
  slides: 'Presentación',
  pdf: 'PDF'
}

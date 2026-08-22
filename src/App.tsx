import { useEffect, useRef, useState } from 'react'
import {
  Bot, Check, ChevronDown, CircleHelp, CloudOff, FileSpreadsheet, FileText,
  FileSearch, FolderOpen, Grid3X3, LayoutDashboard, Menu, MonitorPlay, Plus,
  Presentation, Save, Search, Settings2, Share2, Sparkles, Undo2, Redo2, X, ZoomIn
} from 'lucide-react'
import { calculateCell, columnName, formulaExplanation } from './lib/formulas'
import { kindLabel, makeDocument, touchDocument } from './lib/documents'
import type { BelentaniDocument, CanvasBlock, CanvasBlockType, DocumentContent, DocumentKind, GridContent, PdfContent, RecoveryEntry, SlidesContent, WriteContent } from './lib/types'
import { isCanvas, isGrid, isPdf, isSlides, isWrite } from './lib/types'

type View = 'hub' | DocumentKind

type Status = { tone: 'saved' | 'working' | 'warning'; text: string }

const starterDocuments = [
  makeDocument('write', 'Plan de lanzamiento 2027'),
  makeDocument('grid', 'Presupuesto de producto'),
  makeDocument('canvas', 'Mapa estratégico'),
  makeDocument('slides', 'Presentación de producto'),
  makeDocument('pdf', 'Revisión de contrato')
]

function App() {
  const [documents, setDocuments] = useState<BelentaniDocument[]>(starterDocuments)
  const [activeId, setActiveId] = useState(starterDocuments[0].id)
  const [view, setView] = useState<View>('hub')
  const [filePath, setFilePath] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ tone: 'saved', text: 'Todo está protegido en este dispositivo' })
  const [recoveries, setRecoveries] = useState<RecoveryEntry[]>([])
  const [showRecovery, setShowRecovery] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const activeDocument = documents.find((document) => document.id === activeId) ?? documents[0]

  const refreshRecoveries = async () => {
    if (!window.belentani) return
    try {
      setRecoveries(await window.belentani.recoveries())
    } catch {
      setStatus({ tone: 'warning', text: 'No se pudo consultar la recuperación local' })
    }
  }

  useEffect(() => { void refreshRecoveries() }, [])

  useEffect(() => {
    if (!activeDocument || !window.belentani) return
    setStatus({ tone: 'working', text: 'Protegiendo una copia recuperable…' })
    const timer = window.setTimeout(async () => {
      try {
        const result = await window.belentani?.autosave(activeDocument.id, activeDocument)
        if (result) setStatus({ tone: 'saved', text: `Copia recuperable · ${new Date(result.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` })
      } catch {
        setStatus({ tone: 'warning', text: 'La copia recuperable necesita atención' })
      }
    }, 900)
    return () => window.clearTimeout(timer)
  }, [activeDocument])

  const updateDocument = (updater: (document: BelentaniDocument) => BelentaniDocument) => {
    setDocuments((current) => current.map((document) => document.id === activeId ? updater(document) : document))
  }

  const updateContent = (content: DocumentContent) => {
    updateDocument((document) => touchDocument(document, { content }))
  }

  const createDocument = (kind: DocumentKind) => {
    const created = makeDocument(kind)
    setDocuments((current) => [created, ...current])
    setActiveId(created.id)
    setView(kind)
    setFilePath(null)
    setStatus({ tone: 'working', text: 'Nuevo archivo: la primera copia recuperable se está preparando' })
  }

  const selectDocument = (document: BelentaniDocument) => {
    setActiveId(document.id)
    setView(document.kind)
    setFilePath(null)
  }

  const saveDocument = async (forceSaveAs = false) => {
    if (!window.belentani) {
      setStatus({ tone: 'warning', text: 'Usa la aplicación de escritorio para guardar en archivos locales' })
      return
    }
    try {
      setStatus({ tone: 'working', text: 'Confirmando escritura en disco…' })
      const result = forceSaveAs || !filePath
        ? await window.belentani.saveAs(activeDocument)
        : await window.belentani.save(filePath, activeDocument)
      if (!result.canceled && result.path && result.savedAt) {
        setFilePath(result.path)
        updateDocument((document) => ({ ...document, metadata: { ...document.metadata, lastSavedAt: result.savedAt } }))
        setStatus({ tone: 'saved', text: `Guardado confirmado · ${new Date(result.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` })
      }
    } catch {
      setStatus({ tone: 'warning', text: 'El archivo no se confirmó en disco. La copia recuperable sigue disponible.' })
    }
  }

  const openDocument = async () => {
    if (!window.belentani) return
    try {
      const result = await window.belentani.open()
      if (!('kind' in result)) return
      if (result.kind === 'belentani') {
        const opened = result.document
        setDocuments((current) => [opened, ...current.filter((document) => document.id !== opened.id)])
        setActiveId(opened.id)
        setView(opened.kind)
        setFilePath(result.path)
        setStatus({ tone: 'saved', text: 'Proyecto local abierto sin modificar el original' })
      }
      if (result.kind === 'pdf') {
        const opened = makeDocument('pdf', result.fileName.replace(/\.pdf$/i, ''))
        opened.content = { fileName: result.fileName, dataUrl: result.dataUrl, annotations: [] }
        setDocuments((current) => [opened, ...current])
        setActiveId(opened.id)
        setView('pdf')
        setFilePath(null)
        setStatus({ tone: 'saved', text: 'PDF abierto en modo de revisión; el original no se modifica' })
      }
    } catch {
      setStatus({ tone: 'warning', text: 'No se pudo abrir el archivo seleccionado' })
    }
  }

  const restoreRecovery = async (entry: RecoveryEntry) => {
    if (!window.belentani) return
    try {
      const restored = await window.belentani.loadRecovery(entry.id) as BelentaniDocument
      setDocuments((current) => [restored, ...current.filter((document) => document.id !== restored.id)])
      setActiveId(restored.id)
      setView(restored.kind)
      setFilePath(null)
      setShowRecovery(false)
      setStatus({ tone: 'saved', text: 'Copia recuperable restaurada. Guárdala con un nombre cuando estés listo.' })
    } catch {
      setStatus({ tone: 'warning', text: 'No se pudo restaurar esta copia' })
    }
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="brand-row">
          <div className="brand-mark" aria-hidden="true"><span>B</span></div>
          <div><strong>Belentani</strong><small>Office Pack 2027</small></div>
          <button className="icon-button mobile-menu" aria-label="Abrir menú" onClick={() => setMenuOpen((value) => !value)}><Menu size={18} /></button>
        </div>
        <nav className={menuOpen ? 'nav open' : 'nav'}>
          <button className={view === 'hub' ? 'nav-item active' : 'nav-item'} onClick={() => setView('hub')}><LayoutDashboard size={18} /> Hub</button>
          <span className="nav-label">CREAR</span>
          <button className="nav-item" onClick={() => createDocument('write')}><FileText size={18} /> Documento <Plus size={14} /></button>
          <button className="nav-item" onClick={() => createDocument('grid')}><FileSpreadsheet size={18} /> Hoja <Plus size={14} /></button>
          <button className="nav-item" onClick={() => createDocument('canvas')}><Presentation size={18} /> Canvas <Plus size={14} /></button>
          <button className="nav-item" onClick={() => createDocument('slides')}><MonitorPlay size={18} /> Presentación <Plus size={14} /></button>
          <button className="nav-item" onClick={() => createDocument('pdf')}><FileSearch size={18} /> PDF <Plus size={14} /></button>
          <span className="nav-label">BIBLIOTECA</span>
          {documents.slice(0, 8).map((document) => (
            <button key={document.id} className={activeId === document.id && view !== 'hub' ? 'library-item active' : 'library-item'} onClick={() => selectDocument(document)}>
              <DocumentGlyph kind={document.kind} />
              <span>{document.title}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="privacy-state" onClick={() => setAiOpen(true)}><CloudOff size={16} /><span>Datos locales</span><Check size={15} /></button>
          <button className="help-row" onClick={() => setShowRecovery(true)}><CircleHelp size={16} /> Recuperación</button>
        </div>
      </aside>

      <section className="workbench">
        <header className="topbar">
          <div className="crumbs"><span>Espacio personal</span><span className="crumb-separator">/</span><strong>{view === 'hub' ? 'Hub' : activeDocument.title}</strong></div>
          <div className="topbar-actions">
            <div className={`save-indicator ${status.tone}`}><span className="status-dot" />{status.text}</div>
            <button className="icon-button" aria-label="Buscar"><Search size={18} /></button>
            <button className="icon-button" aria-label="Configuración"><Settings2 size={18} /></button>
            <button className="avatar" aria-label="Perfil local">B</button>
          </div>
        </header>

        {view === 'hub' ? (
          <Hub
            documents={documents}
            recoveries={recoveries}
            onCreate={createDocument}
            onSelect={selectDocument}
            onOpen={openDocument}
            onRecover={() => setShowRecovery(true)}
          />
        ) : (
          <DocumentWorkspace
            document={activeDocument}
            filePath={filePath}
            onUpdateTitle={(title) => updateDocument((document) => touchDocument(document, { title }))}
            onUpdateContent={updateContent}
            onSave={() => void saveDocument(false)}
            onSaveAs={() => void saveDocument(true)}
            onOpen={openDocument}
            onToggleAI={() => setAiOpen(true)}
          />
        )}
      </section>

      {showRecovery && (
        <RecoveryDialog
          entries={recoveries}
          onClose={() => setShowRecovery(false)}
          onRefresh={() => void refreshRecoveries()}
          onRestore={restoreRecovery}
        />
      )}
      {aiOpen && <AIDrawer document={activeDocument} onClose={() => setAiOpen(false)} onApply={(html) => {
        if (isWrite(activeDocument)) updateContent({ html })
      }} />}
    </main>
  )
}

function DocumentGlyph({ kind }: { kind: DocumentKind }) {
  if (kind === 'write') return <FileText size={15} />
  if (kind === 'grid') return <FileSpreadsheet size={15} />
  if (kind === 'slides') return <MonitorPlay size={15} />
  if (kind === 'pdf') return <FileSearch size={15} />
  return <Presentation size={15} />
}

interface HubProps {
  documents: BelentaniDocument[]
  recoveries: RecoveryEntry[]
  onCreate: (kind: DocumentKind) => void
  onSelect: (document: BelentaniDocument) => void
  onOpen: () => void
  onRecover: () => void
}

function Hub({ documents, recoveries, onCreate, onSelect, onOpen, onRecover }: HubProps) {
  return <div className="hub-page">
    <section className="hero-card">
      <div className="hero-text"><span className="eyebrow">BELENTANI / LOCAL-FIRST</span><h1>Tu trabajo, claro y bajo control.</h1><p>Crea, conecta y recupera documentos sin una cuenta obligatoria ni envíos de datos silenciosos.</p></div>
      <div className="hero-actions"><button className="primary-button" onClick={() => onCreate('write')}><Plus size={18} /> Nuevo documento</button><button className="secondary-button" onClick={onOpen}><FolderOpen size={18} /> Abrir local</button></div>
      <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
    </section>
    <section className="trust-strip"><div><Check size={18} /><span><strong>Recuperación activa</strong><small>Se crea una copia local mientras trabajas.</small></span></div><div><Grid3X3 size={18} /><span><strong>Formato nativo</strong><small>El estado del archivo se explica antes de exportar.</small></span></div><div><CloudOff size={18} /><span><strong>IA desactivada</strong><small>Solo se activa si tú decides instalarla.</small></span></div></section>
    <section className="hub-section"><div className="section-heading"><div><span className="eyebrow">EMPEZAR</span><h2>Elige un espacio de trabajo</h2></div></div><div className="create-grid">
      <CreateCard type="write" icon={<FileText size={21} />} title="Documento" body="Escribe, estructura y revisa con un guardado que se puede comprobar." onClick={() => onCreate('write')} />
      <CreateCard type="grid" icon={<FileSpreadsheet size={21} />} title="Hoja" body="Calcula con fórmulas explicables y relaciones visibles." onClick={() => onCreate('grid')} />
      <CreateCard type="canvas" icon={<Presentation size={21} />} title="Canvas" body="Conecta ideas, archivos y decisiones sin perder el origen." onClick={() => onCreate('canvas')} />
      <CreateCard type="slides" icon={<MonitorPlay size={21} />} title="Presentación" body="Diseña una narrativa, edita diapositivas y presenta a pantalla completa." onClick={() => onCreate('slides')} />
      <CreateCard type="pdf" icon={<FileSearch size={21} />} title="PDF" body="Abre un PDF local, revísalo y conserva sus anotaciones en un proyecto separado." onClick={() => onCreate('pdf')} />
    </div></section>
    <section className="hub-section recent-section"><div className="section-heading"><div><span className="eyebrow">TU BIBLIOTECA</span><h2>Trabajo reciente</h2></div><button className="text-button" onClick={onRecover}>Ver recuperación {recoveries.length ? `(${recoveries.length})` : ''}</button></div><div className="recent-table">
      <div className="recent-header"><span>Nombre</span><span>Tipo</span><span>Estado</span><span>Actualizado</span></div>
      {documents.map((document) => <button key={document.id} className="recent-row" onClick={() => onSelect(document)}><span className="recent-name"><span className={`doc-icon ${document.kind}`}><DocumentGlyph kind={document.kind} /></span>{document.title}</span><span>{kindLabel[document.kind]}</span><span><i className="tiny-dot" /> Local</span><span>{new Date(document.updatedAt).toLocaleDateString()}</span></button>)}
    </div></section>
  </div>
}

function CreateCard({ type, icon, title, body, onClick }: { type: DocumentKind; icon: React.ReactNode; title: string; body: string; onClick: () => void }) {
  return <button className={`create-card ${type}`} onClick={onClick}><span className="create-icon">{icon}</span><span><strong>{title}</strong><small>{body}</small></span><Plus size={19} /></button>
}

interface WorkspaceProps {
  document: BelentaniDocument
  filePath: string | null
  onUpdateTitle: (title: string) => void
  onUpdateContent: (content: DocumentContent) => void
  onSave: () => void
  onSaveAs: () => void
  onOpen: () => void
  onToggleAI: () => void
}

function DocumentWorkspace({ document, filePath, onUpdateTitle, onUpdateContent, onSave, onSaveAs, onOpen, onToggleAI }: WorkspaceProps) {
  return <div className="document-page">
    <section className="document-header"><div className="document-title-row"><DocumentGlyph kind={document.kind} /><input aria-label="Nombre del documento" value={document.title} onChange={(event) => onUpdateTitle(event.target.value)} /><span className="native-pill">Nativo</span></div><div className="document-controls"><button className="secondary-button compact" onClick={onOpen}><FolderOpen size={16} /> Abrir</button><button className="secondary-button compact" onClick={onSaveAs}><ChevronDown size={16} /> Guardar como</button><button className="primary-button compact" onClick={onSave}><Save size={16} /> {filePath ? 'Guardar' : 'Guardar local'}</button></div></section>
    <section className="document-toolbar"><button className="tool-button" aria-label="Deshacer"><Undo2 size={17} /></button><button className="tool-button" aria-label="Rehacer"><Redo2 size={17} /></button><span className="toolbar-divider" />{document.kind === 'write' && <WriteToolbar />} {document.kind === 'grid' && <><span className="tool-caption">Fórmulas seguras: SUM · AVERAGE · referencias</span></>}{document.kind === 'canvas' && <span className="tool-caption">Arrastra objetos y conecta decisiones desde el panel lateral</span>}<span className="toolbar-grow" /><button className="ai-trigger" onClick={onToggleAI}><Sparkles size={16} /> Asistente local</button><button className="tool-button" aria-label="Compartir"><Share2 size={17} /></button></section>
    <section className={`editor-stage ${document.kind}`}>
      {isWrite(document) && <WriteEditor content={document.content} onChange={(content) => onUpdateContent(content)} />}
      {isGrid(document) && <GridEditor content={document.content} onChange={(content) => onUpdateContent(content)} />}
      {isCanvas(document) && <CanvasEditor content={document.content} onChange={(content) => onUpdateContent(content)} />}
      {isSlides(document) && <SlidesEditor content={document.content} onChange={(content) => onUpdateContent(content)} />}
      {isPdf(document) && <PdfEditor content={document.content} onChange={(content) => onUpdateContent(content)} onOpen={onOpen} />}
    </section>
  </div>
}

function WriteToolbar() {
  const run = (command: string, value?: string) => { document.execCommand(command, false, value) }
  return <><button className="tool-button text-tool" onMouseDown={(event) => { event.preventDefault(); run('bold') }}><strong>B</strong></button><button className="tool-button text-tool italic" onMouseDown={(event) => { event.preventDefault(); run('italic') }}>I</button><button className="tool-button text-tool underline" onMouseDown={(event) => { event.preventDefault(); run('underline') }}>U</button><span className="toolbar-divider" /><button className="tool-select" onMouseDown={(event) => { event.preventDefault(); run('formatBlock', 'h2') }}>Título <ChevronDown size={14} /></button><button className="tool-select" onMouseDown={(event) => { event.preventDefault(); run('insertUnorderedList') }}>Lista <ChevronDown size={14} /></button></>
}

function WriteEditor({ content, onChange }: { content: WriteContent; onChange: (content: WriteContent) => void }) {
  const editorRef = useRef<HTMLDivElement>(null)
  const previousContent = useRef(content.html)
  useEffect(() => {
    if (editorRef.current && content.html !== previousContent.current) editorRef.current.innerHTML = content.html
    previousContent.current = content.html
  }, [content.html])
  return <div className="write-layout"><article className="write-page" aria-label="Editor de documento"><div ref={editorRef} className="rich-editor" contentEditable suppressContentEditableWarning dangerouslySetInnerHTML={{ __html: content.html }} onInput={(event) => { const html = event.currentTarget.innerHTML; previousContent.current = html; onChange({ html }) }} /></article><aside className="write-inspector"><span className="eyebrow">ESTADO DEL ARCHIVO</span><h3>Trabajo protegido</h3><p>El archivo se mantiene local. Una copia recuperable se actualiza mientras escribes.</p><div className="inspector-rule" /><span className="inspect-label">FORMATO</span><strong>Belentani nativo</strong><small>Exportación de terceros: próxima fase.</small><button className="text-button" onClick={() => window.print()}><ZoomIn size={15} /> Vista de impresión</button></aside></div>
}

function GridEditor({ content, onChange }: { content: GridContent; onChange: (content: GridContent) => void }) {
  const [selected, setSelected] = useState('A1')
  const rows = Array.from({ length: 18 }, (_, index) => index + 1)
  const cols = Array.from({ length: 10 }, (_, index) => columnName(index))
  const selectedRaw = content.cells[selected] ?? ''
  const selectedValue = calculateCell(selected, content)
  return <div className="grid-layout"><div className="sheet-wrap"><div className="formula-bar"><span className="cell-ref">{selected}</span><span className="formula-equals">ƒx</span><input value={selectedRaw} onChange={(event) => onChange({ ...content, cells: { ...content.cells, [selected]: event.target.value } })} aria-label="Contenido o fórmula de la celda seleccionada" /></div><div className="spreadsheet" role="grid" aria-label="Hoja de cálculo"><div className="grid-cell corner" />{cols.map((col) => <div className="grid-cell column-header" key={col}>{col}</div>)}{rows.flatMap((row) => [<div className="grid-cell row-header" key={`row-${row}`}>{row}</div>, ...cols.map((col) => { const address = `${col}${row}`; const raw = content.cells[address] ?? ''; const value = calculateCell(address, content); return <input key={address} className={selected === address ? 'grid-cell grid-input selected' : 'grid-cell grid-input'} value={raw.startsWith('=') ? raw : raw} aria-label={`Celda ${address}`} onFocus={() => setSelected(address)} onChange={(event) => onChange({ ...content, cells: { ...content.cells, [address]: event.target.value } })} onBlur={(event) => { if (!event.currentTarget.value.startsWith('=')) return }} title={raw.startsWith('=') ? `Resultado: ${value}` : undefined} /> })])}</div></div><aside className="grid-inspector"><span className="eyebrow">INSPECTOR DE CELDA</span><h3>{selected}</h3><div className="value-card"><span>RESULTADO</span><strong>{selectedValue || '—'}</strong></div><p>{formulaExplanation(selectedRaw)}</p><div className="inspector-rule" /><span className="inspect-label">SUGERENCIA</span><p className="muted">Usa <code>=SUM(C2:C5)</code> para sumar un rango o una expresión como <code>=B2*1.21</code>.</p></aside></div>
}

function CanvasEditor({ content, onChange }: { content: import('./lib/types').CanvasContent; onChange: (content: import('./lib/types').CanvasContent) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(content.blocks[0]?.id ?? null)
  const [linkStart, setLinkStart] = useState<string | null>(null)
  const dragging = useRef<{ id: string; x: number; y: number } | null>(null)
  const addBlock = (type: CanvasBlockType) => {
    const color = type === 'note' ? 'amber' : type === 'text' ? 'indigo' : type === 'file' ? 'mint' : 'slate'
    const block: CanvasBlock = { id: crypto.randomUUID(), type, title: type === 'note' ? 'Nota nueva' : type === 'file' ? 'Archivo vinculado' : type === 'frame' ? 'Marco nuevo' : 'Bloque de texto', body: 'Escribe el contenido de este objeto.', x: 160 + content.blocks.length * 24, y: 120 + content.blocks.length * 24, width: type === 'frame' ? 420 : 220, height: type === 'frame' ? 260 : 144, color }
    onChange({ ...content, blocks: [...content.blocks, block] })
    setSelectedId(block.id)
  }
  const updateBlock = (id: string, patch: Partial<CanvasBlock>) => onChange({ ...content, blocks: content.blocks.map((block) => block.id === id ? { ...block, ...patch } : block) })
  const selected = content.blocks.find((block) => block.id === selectedId)
  const makeConnection = (targetId: string) => {
    if (!linkStart || linkStart === targetId) { setLinkStart(targetId); return }
    if (content.edges.some((edge) => edge.from === linkStart && edge.to === targetId)) { setLinkStart(null); return }
    onChange({ ...content, edges: [...content.edges, { id: crypto.randomUUID(), from: linkStart, to: targetId, label: 'referencia' }] })
    setLinkStart(null)
  }
  const blocksById = new Map(content.blocks.map((block) => [block.id, block]))
  return <div className="canvas-layout"><div className="canvas-toolbar"><button className="secondary-button compact" onClick={() => addBlock('note')}><Plus size={16} /> Nota</button><button className="secondary-button compact" onClick={() => addBlock('text')}><Plus size={16} /> Texto</button><button className="secondary-button compact" onClick={() => addBlock('file')}><Plus size={16} /> Archivo</button><button className="secondary-button compact" onClick={() => addBlock('frame')}><Plus size={16} /> Marco</button><span className="canvas-help">{linkStart ? 'Selecciona otro objeto para crear un vínculo.' : 'Selecciona un objeto y usa «Conectar» para relacionarlo.'}</span></div><div className="canvas-viewport" onPointerMove={(event) => { const current = dragging.current; if (!current) return; updateBlock(current.id, { x: Math.max(12, event.clientX - current.x), y: Math.max(12, event.clientY - current.y) }) }} onPointerUp={() => { dragging.current = null }}><div className="canvas-plane"> <svg className="edge-layer" aria-hidden="true">{content.edges.map((edge) => { const from = blocksById.get(edge.from); const to = blocksById.get(edge.to); if (!from || !to) return null; const x1 = from.x + from.width; const y1 = from.y + from.height / 2; const x2 = to.x; const y2 = to.y + to.height / 2; return <g key={edge.id}><path d={`M ${x1} ${y1} C ${x1 + 58} ${y1}, ${x2 - 58} ${y2}, ${x2} ${y2}`} /><circle cx={x2} cy={y2} r="4" /></g> })}</svg>{content.blocks.map((block) => <button key={block.id} className={`canvas-block ${block.type} ${block.color} ${selectedId === block.id ? 'selected' : ''} ${linkStart === block.id ? 'link-origin' : ''}`} style={{ left: block.x, top: block.y, width: block.width, height: block.height }} onPointerDown={(event) => { if ((event.target as HTMLElement).closest('.block-edit')) return; setSelectedId(block.id); dragging.current = { id: block.id, x: event.clientX - block.x, y: event.clientY - block.y }; event.currentTarget.setPointerCapture(event.pointerId) }} aria-label={`${block.type}: ${block.title}. Usa las flechas para moverlo.`} onKeyDown={(event) => { const distance = event.shiftKey ? 24 : 8; const movement = event.key === 'ArrowLeft' ? { x: -distance, y: 0 } : event.key === 'ArrowRight' ? { x: distance, y: 0 } : event.key === 'ArrowUp' ? { x: 0, y: -distance } : event.key === 'ArrowDown' ? { x: 0, y: distance } : null; if (movement) { event.preventDefault(); updateBlock(block.id, { x: Math.max(12, block.x + movement.x), y: Math.max(12, block.y + movement.y) }); } }} onClick={() => { if (linkStart) makeConnection(block.id); else setSelectedId(block.id) }}><span className="block-type">{block.type === 'note' ? 'NOTA' : block.type === 'file' ? 'ARCHIVO' : block.type === 'frame' ? 'MARCO' : 'TEXTO'}</span><strong>{block.title}</strong><small>{block.body}</small></button>)}</div></div><aside className="canvas-inspector"><span className="eyebrow">OBJETO</span>{selected ? <><input className="block-edit title" value={selected.title} onChange={(event) => updateBlock(selected.id, { title: event.target.value })} aria-label="Título del objeto" /><textarea className="block-edit" value={selected.body} onChange={(event) => updateBlock(selected.id, { body: event.target.value })} aria-label="Contenido del objeto" /><button className={linkStart ? 'primary-button compact full' : 'secondary-button compact full'} onClick={() => setLinkStart(linkStart ? null : selected.id)}>{linkStart ? <X size={15} /> : <Share2 size={15} />}{linkStart ? 'Cancelar vínculo' : 'Conectar objeto'}</button><div className="inspector-rule" /><span className="inspect-label">RELACIONES</span><p className="muted">{content.edges.filter((edge) => edge.from === selected.id || edge.to === selected.id).length ? `${content.edges.filter((edge) => edge.from === selected.id || edge.to === selected.id).length} vínculo(s) visible(s)` : 'Sin conexiones todavía.'}</p></> : <p className="muted">Selecciona un objeto en el canvas.</p>}</aside></div>
}

function SlidesEditor({ content, onChange }: { content: SlidesContent; onChange: (content: SlidesContent) => void }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeSlide = content.slides[activeIndex] ?? content.slides[0]
  const updateSlide = (patch: Partial<SlidesContent['slides'][number]>) => onChange({ ...content, slides: content.slides.map((slide, index) => index === activeIndex ? { ...slide, ...patch } : slide) })
  const addSlide = () => {
    const slide = { id: crypto.randomUUID(), kicker: 'NUEVA IDEA', title: 'Una diapositiva nueva', body: 'Escribe un mensaje que se pueda recordar.', accent: 'violet' as const, notes: '' }
    onChange({ ...content, slides: [...content.slides, slide] })
    setActiveIndex(content.slides.length)
  }
  const removeSlide = () => {
    if (content.slides.length <= 1) return
    onChange({ ...content, slides: content.slides.filter((_, index) => index !== activeIndex) })
    setActiveIndex(Math.max(0, activeIndex - 1))
  }
  const present = async () => { try { await document.documentElement.requestFullscreen() } catch { /* El navegador puede rechazar el modo presentación. */ } }
  if (!activeSlide) return null
  return <div className="slides-layout"><aside className="slide-rail"><div className="slide-rail-heading"><span>DIAPOSITIVAS</span><button className="icon-button" aria-label="Añadir diapositiva" onClick={addSlide}><Plus size={16} /></button></div>{content.slides.map((slide, index) => <button key={slide.id} className={index === activeIndex ? 'slide-thumb active' : 'slide-thumb'} onClick={() => setActiveIndex(index)}><span className={`thumb-preview ${slide.accent}`}><i>{slide.kicker}</i><strong>{slide.title}</strong></span><small>{index + 1}</small></button>)}</aside><main className="slide-canvas"><div className="slide-canvas-actions"><span>{activeIndex + 1} de {content.slides.length}</span><button className="secondary-button compact" onClick={present}><MonitorPlay size={16} /> Presentar</button></div><article className={`present-slide ${activeSlide.accent}`} aria-label={`Diapositiva ${activeIndex + 1}`}><span className="slide-kicker">{activeSlide.kicker || 'PRESENTACIÓN'}</span><h1>{activeSlide.title || 'Sin título'}</h1><p>{activeSlide.body || 'Escribe aquí el mensaje principal.'}</p><div className="slide-index">{String(activeIndex + 1).padStart(2, '0')}</div></article></main><aside className="slide-inspector"><span className="eyebrow">CONTENIDO</span><label>Etiqueta<input value={activeSlide.kicker} onChange={(event) => updateSlide({ kicker: event.target.value })} /></label><label>Título<textarea value={activeSlide.title} onChange={(event) => updateSlide({ title: event.target.value })} /></label><label>Mensaje<textarea value={activeSlide.body} onChange={(event) => updateSlide({ body: event.target.value })} /></label><span className="inspect-label">ACENTO</span><div className="accent-picker">{(['violet', 'teal', 'amber', 'rose'] as const).map((accent) => <button key={accent} aria-label={`Usar acento ${accent}`} className={activeSlide.accent === accent ? `accent-dot ${accent} selected` : `accent-dot ${accent}`} onClick={() => updateSlide({ accent })} />)}</div><div className="inspector-rule" /><label>Notas de presentación<textarea value={activeSlide.notes} onChange={(event) => updateSlide({ notes: event.target.value })} placeholder="Solo para quien presenta…" /></label><div className="slide-inspector-actions"><button className="text-button" onClick={removeSlide} disabled={content.slides.length <= 1}><X size={14} /> Eliminar</button><button className="secondary-button compact" onClick={addSlide}><Plus size={15} /> Añadir</button></div></aside></div>
}

function PdfEditor({ content, onChange, onOpen }: { content: PdfContent; onChange: (content: PdfContent) => void; onOpen: () => void }) {
  const [note, setNote] = useState('')
  const [page, setPage] = useState(1)
  const addAnnotation = () => {
    const text = note.trim()
    if (!text) return
    onChange({ ...content, annotations: [...content.annotations, { id: crypto.randomUUID(), page, type: 'nota', text, createdAt: new Date().toISOString() }] })
    setNote('')
  }
  const discardAnnotation = (id: string) => onChange({ ...content, annotations: content.annotations.filter((annotation) => annotation.id !== id) })
  if (!content.dataUrl) return <div className="pdf-empty"><div className="pdf-empty-icon"><FileSearch size={31} /></div><span className="eyebrow">REVISIÓN PDF</span><h2>Abre un PDF desde Windows</h2><p>Belentani muestra una copia de lectura y guarda tus anotaciones en un proyecto local separado. El PDF original nunca se sobrescribe.</p><button className="primary-button" onClick={onOpen}><FolderOpen size={17} /> Elegir PDF local</button></div>
  return <div className="pdf-layout"><main className="pdf-reader"><header className="pdf-reader-bar"><span><FileSearch size={16} /> {content.fileName ?? 'PDF abierto'}</span><span className="pdf-page-control"><button className="tool-button" onClick={() => setPage(Math.max(1, page - 1))} aria-label="Página anterior">‹</button>Página {page}<button className="tool-button" onClick={() => setPage(page + 1)} aria-label="Página siguiente">›</button></span></header><iframe className="pdf-frame" title={content.fileName ?? 'PDF'} src={`${content.dataUrl}#toolbar=1&navpanes=0`} /></main><aside className="pdf-inspector"><span className="eyebrow">ANOTACIONES</span><h3>Revisión local</h3><p>Registra observaciones sobre el archivo sin modificarlo.</p><label>Nota de página {page}<textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ej.: Confirmar esta cifra con Finanzas" /></label><button className="primary-button compact full" onClick={addAnnotation}><Plus size={15} /> Añadir nota</button><div className="annotation-list">{content.annotations.length ? content.annotations.map((annotation) => <article key={annotation.id} className="annotation"><span>PÁG. {annotation.page}</span><p>{annotation.text}</p><button className="text-button" onClick={() => discardAnnotation(annotation.id)}>Quitar</button></article>) : <div className="empty-state">Todavía no hay anotaciones. Añade una observación para guardarla en este proyecto.</div>}</div></aside></div>
}

function RecoveryDialog({ entries, onClose, onRefresh, onRestore }: { entries: RecoveryEntry[]; onClose: () => void; onRefresh: () => void; onRestore: (entry: RecoveryEntry) => void }) {
  return <div className="dialog-backdrop" role="presentation"><section className="recovery-dialog" role="dialog" aria-modal="true" aria-labelledby="recovery-title"><header><div><span className="eyebrow">RECUPERACIÓN LOCAL</span><h2 id="recovery-title">Tus copias protegidas</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={18} /></button></header><p>Belentani guarda una copia local durante la edición. Restaurar abre una versión nueva sin sobrescribir el archivo original.</p><div className="recovery-list">{entries.length ? entries.map((entry) => <div className="recovery-row" key={entry.id}><span className="doc-icon write"><FileText size={16} /></span><span><strong>{entry.id.slice(0, 8)}</strong><small>{new Date(entry.updatedAt).toLocaleString()}</small></span><button className="secondary-button compact" onClick={() => onRestore(entry)}>Restaurar</button></div>) : <div className="empty-state">No hay copias pendientes. El guardado automático aparecerá aquí cuando edites un documento.</div>}</div><footer><button className="text-button" onClick={onRefresh}>Actualizar lista</button><button className="primary-button compact" onClick={onClose}>Listo</button></footer></section></div>
}

function AIDrawer({ document, onClose, onApply }: { document: BelentaniDocument; onClose: () => void; onApply: (html: string) => void }) {
  const [prompt, setPrompt] = useState('Resume el texto en tres ideas claras.')
  const [response, setResponse] = useState<string | null>(null)
  const [state, setState] = useState<'idle' | 'working' | 'error'>('idle')
  const canApply = isWrite(document) && response
  const runLocal = async () => {
    setState('working'); setResponse(null)
    const context = isWrite(document) ? document.content.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : JSON.stringify(document.content)
    try {
      const result = await fetch('http://127.0.0.1:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'llama3.2:3b', prompt: `${prompt}\n\nContenido:\n${context.slice(0, 8000)}`, stream: false }) })
      if (!result.ok) throw new Error('Modelo local no disponible')
      const data = await result.json() as { response?: string }
      setResponse(data.response ?? 'El modelo local no devolvió una propuesta.')
      setState('idle')
    } catch {
      setState('error')
    }
  }
  return <aside className="ai-drawer" aria-label="Asistente local"><header><div><span className="eyebrow">ASISTENTE OPCIONAL</span><h2>IA en tu dispositivo</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar asistente"><X size={18} /></button></header><div className="ai-local-badge"><CloudOff size={17} /><span><strong>Modo local</strong><small>Se intentará conectar con Ollama en este equipo. No se envía contenido a Internet.</small></span></div><label>Instrucción<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label><button className="primary-button full" onClick={() => void runLocal()} disabled={state === 'working'}><Bot size={17} />{state === 'working' ? 'Pensando localmente…' : 'Generar propuesta'}</button>{state === 'error' && <div className="ai-error"><strong>No se encontró un modelo local.</strong><p>Instala y ejecuta Ollama con un modelo compatible, por ejemplo <code>ollama run llama3.2:3b</code>. Belentani seguirá funcionando sin IA.</p></div>}{response && <div className="ai-response"><span className="eyebrow">PROPUESTA</span><p>{response}</p>{canApply && <button className="secondary-button compact full" onClick={() => onApply(`${(document.content as WriteContent).html}<hr/><h2>Propuesta local</h2><p>${response}</p>`)}><Check size={16} /> Insertar como propuesta</button>}</div>}<footer>La IA no puede guardar, compartir ni modificar archivos sin que tú lo confirmes.</footer></aside>
}

export default App

import type { BelentaniDocument } from './lib/types'

declare global {
  interface Window {
    belentani?: {
      saveAs: (document: BelentaniDocument) => Promise<{ canceled?: boolean; path?: string; savedAt?: string }>
      save: (filePath: string, document: BelentaniDocument) => Promise<{ canceled?: boolean; path?: string; savedAt?: string }>
      open: () => Promise<
        | { canceled: true }
        | { kind: 'belentani'; path: string; document: BelentaniDocument }
        | { kind: 'pdf'; path: string; fileName: string; dataUrl: string }
      >
      autosave: (id: string, document: BelentaniDocument) => Promise<{ path: string; savedAt: string }>
      recoveries: () => Promise<Array<{ id: string; path: string; updatedAt: string }>>
      loadRecovery: (id: string) => Promise<BelentaniDocument>
      discardRecovery: (id: string) => Promise<{ ok: boolean }>
      openExternal: (url: string) => Promise<void>
    }
  }
}

export {}

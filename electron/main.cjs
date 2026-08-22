const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron')
const fs = require('fs/promises')
const path = require('path')
const crypto = require('crypto')

const isDev = !app.isPackaged
const recoveryDirectory = () => path.join(app.getPath('userData'), 'recovery')
const documentsDirectory = () => app.getPath('documents')

async function ensureRecoveryDirectory() {
  await fs.mkdir(recoveryDirectory(), { recursive: true })
}

async function atomicWrite(targetPath, content) {
  const directory = path.dirname(targetPath)
  await fs.mkdir(directory, { recursive: true })
  const temporaryPath = path.join(directory, `.${path.basename(targetPath)}.${crypto.randomUUID()}.tmp`)
  await fs.writeFile(temporaryPath, content, 'utf8')
  await fs.rename(temporaryPath, targetPath)
  return { path: targetPath, savedAt: new Date().toISOString() }
}

async function listRecoveries() {
  await ensureRecoveryDirectory()
  const files = await fs.readdir(recoveryDirectory())
  const recoveries = await Promise.all(files.filter((file) => file.endsWith('.belentani-recovery.json')).map(async (file) => {
    const filePath = path.join(recoveryDirectory(), file)
    const stats = await fs.stat(filePath)
    return { id: file.replace('.belentani-recovery.json', ''), path: filePath, updatedAt: stats.mtime.toISOString() }
  }))
  return recoveries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

async function openSelectedFile() {
  const result = await dialog.showOpenDialog({
    title: 'Abrir en Belentani',
    defaultPath: documentsDirectory(),
    properties: ['openFile'],
    filters: [
      { name: 'Belentani', extensions: ['json'] },
      { name: 'PDF', extensions: ['pdf'] }
    ]
  })
  if (result.canceled || !result.filePaths[0]) return { canceled: true }
  const targetPath = result.filePaths[0]
  if (path.extname(targetPath).toLowerCase() === '.pdf') {
    const data = await fs.readFile(targetPath)
    return {
      kind: 'pdf',
      path: targetPath,
      fileName: path.basename(targetPath),
      dataUrl: `data:application/pdf;base64,${data.toString('base64')}`
    }
  }
  const raw = await fs.readFile(targetPath, 'utf8')
  return { kind: 'belentani', path: targetPath, document: JSON.parse(raw) }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#0b1020',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (isDev) {
    window.loadURL('http://127.0.0.1:5173')
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('storage:save-as', async (_event, document) => {
    const suggested = `${document.title || 'Sin título'}.belentani.json`
    const result = await dialog.showSaveDialog({
      title: 'Guardar proyecto Belentani',
      defaultPath: path.join(documentsDirectory(), suggested),
      filters: [{ name: 'Proyecto Belentani', extensions: ['json'] }]
    })
    if (result.canceled || !result.filePath) return { canceled: true }
    return atomicWrite(result.filePath, JSON.stringify(document, null, 2))
  })

  ipcMain.handle('storage:save', async (_event, filePath, document) => {
    if (!filePath) return { canceled: true }
    return atomicWrite(filePath, JSON.stringify(document, null, 2))
  })
  ipcMain.handle('storage:open', async () => openSelectedFile())

  ipcMain.handle('storage:autosave', async (_event, id, document) => {
    await ensureRecoveryDirectory()
    const recoveryPath = path.join(recoveryDirectory(), `${id}.belentani-recovery.json`)
    return atomicWrite(recoveryPath, JSON.stringify(document, null, 2))
  })
  ipcMain.handle('storage:recoveries', async () => listRecoveries())
  ipcMain.handle('storage:load-recovery', async (_event, id) => {
    const recoveryPath = path.join(recoveryDirectory(), `${id}.belentani-recovery.json`)
    return JSON.parse(await fs.readFile(recoveryPath, 'utf8'))
  })
  ipcMain.handle('storage:discard-recovery', async (_event, id) => {
    await fs.rm(path.join(recoveryDirectory(), `${id}.belentani-recovery.json`), { force: true })
    return { ok: true }
  })
  ipcMain.handle('system:open-external', async (_event, url) => shell.openExternal(url))

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

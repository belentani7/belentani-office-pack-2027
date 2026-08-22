# Belentani Office Pack 2027

> Aplicación de escritorio local-first para **Windows 11** con documentos, hojas de cálculo, presentaciones y revisión de PDF.

**Belentani Office Pack** es una aplicación funcional de escritorio, no una maqueta ni un documento Markdown. La entrega principal para Windows es un archivo ejecutable `.exe` portable. Su diseño es original y local-first: no necesita cuenta, almacena proyectos en este dispositivo y genera copias recuperables mientras se trabaja.

## Aplicación para Windows 11

| Archivo | Uso |
|---|---|
| `Belentani-Office-Pack-Portable-0.1.0-x64.exe` | Aplicación portable de Windows 11 de 64 bits. Descárgala y ejecútala; no requiere instalación. |
| `Belentani-Office-Pack-0.1.0-source.zip` | Código fuente completo para revisar o continuar el desarrollo. |
| `BELENTANI_WINDOWS_SHA256SUMS.txt` | Sumas SHA-256 para comprobar que los archivos no se alteraron. |

> La edición portable no está firmada con certificado comercial. Windows puede mostrar SmartScreen en el primer inicio. Esto no significa que sea un Markdown: es un aviso normal de reputación para binarios nuevos sin firma. Comprueba la suma SHA-256 antes de ejecutarlo.

## Cuatro módulos funcionales

| Equivalencia de trabajo | Módulo Belentani | Funciones actualmente implementadas | Formato actual |
|---|---|---|---|
| Word | **Write** | Redacción enriquecida, encabezados, negrita, cursiva, subrayado, listas, impresión, título editable, guardado y recuperación local. | Proyecto `.belentani.json`. |
| Excel | **Grid** | Celdas editables, fórmulas aritméticas, referencias, `SUM`, `AVERAGE` e inspector de resultado. | Proyecto `.belentani.json`. |
| PowerPoint | **Presentación** | Diapositivas, miniaturas, edición de etiqueta/título/mensaje/notas, cuatro acentos, añadir/eliminar y modo de presentación a pantalla completa. | Proyecto `.belentani.json`. |
| PDF | **PDF** | Abrir un PDF local para lectura en la aplicación; notas por página; las anotaciones se guardan como proyecto separado. | PDF original intacto + proyecto `.belentani.json`. |

También sigue disponible **Canvas** para ordenar notas, objetos, vínculos y decisiones visuales.

## Abrir y guardar

Al iniciar Belentani, crea un módulo desde el Hub o usa **Abrir local**. La aplicación abre proyectos Belentani y PDF. Al abrir un PDF, el archivo original se lee sin sobrescribirlo; las notas se guardan solo si decides crear un proyecto de revisión Belentani.

Al guardar, la aplicación escribe primero un archivo temporal y lo reemplaza al terminar. Además crea una copia local de recuperación durante la edición. El panel **Recuperación** permite restaurar una copia sin alterar un archivo guardado.

## IA local opcional

La aplicación funciona por completo sin IA. El panel **Asistente local** solo intenta conectar con Ollama en `127.0.0.1:11434`, es decir, dentro del propio equipo. Para habilitarlo, instala Ollama y ejecuta un modelo local compatible, por ejemplo:

```powershell
ollama run llama3.2:3b
```

Belentani no inicia esa conexión sin una acción directa de la persona y el asistente no guarda, comparte ni modifica documentos automáticamente.

## Límites actuales que no se deben ocultar

Esta versión es una primera edición funcional, no un reemplazo completo de toda la suite Microsoft Office. **No importa ni exporta todavía DOCX, XLSX, PPTX, ODT, ODS u ODP**; tampoco edita el contenido interno de un PDF. Su siguiente etapa técnica debe implementar interoperabilidad de formatos con pruebas de regresión y un informe de fidelidad por archivo.

## Desarrollo y empaquetado

Se necesita Node.js 22+ y pnpm.

```powershell
pnpm install
pnpm dev
```

Para compilar la interfaz:

```powershell
pnpm build
```

Para generar el ejecutable portable de Windows x64:

```powershell
pnpm dist:win
```

El instalador NSIS se genera preferiblemente desde una máquina Windows con:

```powershell
pnpm dist:win:installer
```

## Arquitectura resumida

```text
Electron para Windows
  ├─ Diálogos locales de archivo
  ├─ Escritura atómica de proyectos
  ├─ Copias recuperables
  └─ Apertura de PDF en modo revisión

Interfaz React
  ├─ Write, Grid, Presentación, PDF y Canvas
  ├─ Modelo nativo versionado
  └─ Asistente Ollama local opcional
```

## Licencia

El código propio se entrega bajo **Mozilla Public License 2.0**. Consulta [`LICENSE`](LICENSE). Antes de una publicación pública se debe mantener una SBOM actualizada y revisar los avisos de todas las dependencias.

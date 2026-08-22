# Validación visual inicial

Fecha: 22 de agosto de 2026.

| Flujo comprobado | Resultado | Observaciones |
|---|---|---|
| Carga del Hub | Correcto | Se muestran identidad Belentani, acciones de creación, estados de confianza y biblioteca local. |
| Crear documento | Correcto | La acción «Documento» abre un editor con título editable, contenido inicial, barra de formato, estado de guardado recuperable y controles de archivo. |

Pendiente de validar: edición en Write, fórmula en Grid, creación/vínculo de Canvas, asistente local, recuperación y empaquetado.
| Editor Grid | Correcto | La hoja presenta datos editables, barra de fórmulas y un inspector de celda. |
| Cálculo `=SUM(C2:C3)` | Correcto | Al seleccionar C5, el inspector devuelve `2000` y explica la función SUM. |
| Editor Canvas | Correcto | Se muestran un marco y notas iniciales sobre una cuadrícula, con creación de Nota, Texto, Archivo y Marco. |
| Inicio de vínculo | Correcto | El panel cambia a «Cancelar vínculo» y guía la selección de un segundo objeto para completar la relación. |
| Vínculo de canvas completado | Correcto | La nota seleccionada indica «1 vínculo(s) visible(s)» y se dibuja una conexión desde el marco. |
| Asistente local | Correcto | El panel declara modo local, explica que no envía contenido a Internet y recuerda que no puede guardar, compartir ni modificar sin confirmación. |
| Compilación TypeScript y Vite | Correcto | `pnpm build` finaliza sin errores; se genera la interfaz de producción. |
| Arranque Electron | Correcto | El proceso de escritorio se mantuvo abierto durante la prueba gráfica virtual y fue detenido únicamente por el límite de tiempo de la prueba. |
| Empaquetado AppImage | Correcto | Se generó `Belentani-Office-Pack-0.1.0-x86_64.AppImage` (Linux x64, 138 MB). |
| Arranque AppImage | Correcto | El artefacto se abrió bajo entorno gráfico virtual y permaneció en ejecución hasta que la prueba lo detuvo por tiempo. |

Nota: el mensaje de Electron sobre `NODE_OPTIONs` procede del entorno de pruebas y no impidió el arranque del artefacto.

## Ampliación para Windows 11

| Flujo | Resultado | Observaciones |
|---|---|---|
| Hub ampliado | Correcto | Se muestran accesos específicos a Presentación y PDF, junto con Documento, Hoja y Canvas. |
| Editor de presentaciones | Correcto | Se crean tres diapositivas iniciales y están disponibles la selección de diapositiva, edición de etiqueta/título/mensaje/notas, acento de color, añadir/eliminar y modo Presentar. |
| Módulo PDF | Correcto | Muestra una pantalla de revisión separada, explica que el original no se sobrescribe y ofrece «Elegir PDF local» para abrir el diálogo nativo de Electron en la aplicación de escritorio. |
| Compilación de interfaz ampliada | Correcto | `pnpm build` finaliza sin errores tras añadir Presentación y PDF. |
| Ejecutable portable Windows x64 | Correcto | Electron Builder generó `Belentani-Office-Pack-Portable-0.1.0-x64.exe` (PE32 para Windows). |
| Integridad de entrega Windows | Correcto | Las sumas SHA-256 del ejecutable portable y el archivo fuente actualizado se verifican correctamente. |

Limitación de entorno: el binario de Windows se generó desde Linux y se inspeccionó como ejecutable PE; su interacción final debe probarse en un equipo Windows 11. El instalador NSIS debe compilarse en Windows o en una máquina de compilación con Wine configurado.

import { EditorContent, useEditor } from '@tiptap/react'
import type { Content } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { getMovieNoteByImdbId, initDatabase, saveMovieNote } from '../db/database'
import type { MovieNote, NoteImportance } from '../types'

interface MovieNoteEditorProps {
  imdbID: string
}

const DEFAULT_IMPORTANCE: NoteImportance = 'medium'

/**
 * jsPDF carga `html2canvas` dinámicamente por el nombre literal del paquete,
 * pero antes revisa si ya existe un `window.html2canvas` global y lo usa en
 * su lugar. Lo registramos así para forzar `html2canvas-pro`, que sí soporta
 * los colores `oklch()` que genera TailwindCSS v4 (el `html2canvas` original
 * los renderiza mal).
 */
type WindowWithHtml2Canvas = typeof window & { html2canvas?: typeof html2canvas }

/**
 * Editor de notas enriquecidas (TipTap + StarterKit) para una película. Al
 * montarse, hace un SELECT en SQLite para ver si ya existe una nota para
 * `imdbID` y la carga automáticamente; el botón "Guardar Apunte" inserta o
 * actualiza esa nota con el documento JSON del editor.
 *
 * El editor se puede usar en cuanto TipTap termina de montarse, sin esperar
 * a SQLite: `initDatabase` puede devolver `null` si el motor no cargó (ver
 * `src/db/database.ts`), y en ese caso se avisa pero no se bloquea la
 * escritura, solo el guardado.
 */
export const MovieNoteEditor = ({ imdbID }: MovieNoteEditorProps) => {
  const [existingNote, setExistingNote] = useState<MovieNote | null>(null)
  const [isLoadingNote, setIsLoadingNote] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [isDbAvailable, setIsDbAvailable] = useState(true)
  const noteContentRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [StarterKit],
    content: '',
  })

  useEffect(() => {
    let isMounted = true

    const loadNote = async () => {
      try {
        const db = await initDatabase()

        if (!isMounted) return

        if (!db) {
          setIsDbAvailable(false)
          return
        }

        const note = getMovieNoteByImdbId(db, imdbID)
        setExistingNote(note)
        editor?.commands.setContent((note?.content as Content) ?? '')
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : 'Error al cargar el apunte guardado.'
          toast.error(message)
        }
      } finally {
        if (isMounted) setIsLoadingNote(false)
      }
    }

    loadNote()

    return () => {
      isMounted = false
    }
  }, [imdbID, editor])

  const handleSave = async () => {
    if (!editor) return

    setIsSaving(true)

    try {
      const db = await initDatabase()

      if (!db) {
        setIsDbAvailable(false)
        toast.error('No se pudo conectar con la base de datos local. El apunte no se guardó.')
        return
      }

      const now = new Date().toISOString()
      const noteToSave: MovieNote = {
        id: existingNote?.id ?? crypto.randomUUID(),
        imdbID,
        content: editor.getJSON(),
        importance: existingNote?.importance ?? DEFAULT_IMPORTANCE,
        createdAt: existingNote?.createdAt ?? now,
        updatedAt: now,
      }

      saveMovieNote(db, noteToSave)
      setExistingNote(noteToSave)
      setIsDbAvailable(true)
      toast.success('Apunte guardado.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar el apunte.'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportPdf = () => {
    const noteContent = noteContentRef.current

    if (!editor || !noteContent) return

    setIsExportingPdf(true)
    ;(window as WindowWithHtml2Canvas).html2canvas = html2canvas

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 40

    pdf
      .html(noteContent, {
        margin,
        autoPaging: 'text',
        width: pdf.internal.pageSize.getWidth() - margin * 2,
        windowWidth: noteContent.scrollWidth,
        html2canvas: { backgroundColor: '#ffffff' },
        callback: (doc) => {
          doc.save(`apunte-${imdbID}.pdf`)
          toast.success('Apunte exportado a PDF.')
        },
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Error al exportar el apunte a PDF.'
        toast.error(message)
      })
      .finally(() => {
        setIsExportingPdf(false)
        delete (window as WindowWithHtml2Canvas).html2canvas
      })
  }

  return (
    <div className="flex flex-col gap-3">
      {!isDbAvailable && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          No se pudo conectar con la base de datos local: podés escribir, pero el apunte no se
          guardará hasta recargar la página.
        </p>
      )}

      <div className="min-h-32 rounded-lg border border-gray-200 p-3 text-sm text-gray-900 dark:border-gray-800 dark:text-gray-100">
        <div ref={noteContentRef}>
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <p className="text-gray-400 dark:text-gray-500">Inicializando editor…</p>
          )}
        </div>
        {isLoadingNote && (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Buscando apunte guardado…</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !editor}
          className="self-start rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {isSaving ? 'Guardando…' : 'Guardar Apunte'}
        </button>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExportingPdf || !editor}
          className="self-start rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          {isExportingPdf ? 'Exportando…' : 'Exportar a PDF'}
        </button>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createNote, updateNote, deleteNote } from '../actions/notes'
import { Trash2, Edit3, Plus, X, Check } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  created_at: string
}

export default function NotesDashboard({ initialNotes }: { initialNotes: Note[] }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    try {
      await createNote(title, content)
      setTitle('')
      setContent('')
    } catch (err) {
      alert('Failed to save note')
    }
  }

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleUpdate = async (id: string) => {
    try {
      await updateNote(id, editTitle, editContent)
      setEditingId(null)
    } catch (err) {
      alert('Failed to update note')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id)
      } catch (err) {
        alert('Failed to delete note')
      }
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleCreate} className="bg-black p-6 rounded-xl shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Plus size={18} /> Take a new note...
        </h3>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none"
        />
        <textarea
          placeholder="Write details..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none  "
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-black rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          Save Note
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {initialNotes.length === 0 ? (
          <p className="text-gray-500 text-center md:col-span-2 py-8">No notes yet. Start writing above!</p>
        ) : (
          initialNotes.map((note) => (
            <div key={note.id} className="bg-black p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[160px]">
              {editingId === note.id ? (
                <div className="space-y-3 w-full">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-1 border rounded"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                    className="w-full p-1 border rounded"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md">
                      <X size={16} />
                    </button>
                    <button onClick={() => handleUpdate(note.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-md">
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="font-bold text-gray-800 text-lg mb-2">{note.title}</h4>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => handleStartEdit(note)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import { createNote, updateNote, deleteNote, uploadAttachment, searchNotes } from '../actions/notes'
import { Trash2, Edit3, Plus, X, Check, Image as ImageIcon, Search } from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  image_url?: string | null
  created_at: string
}

export default function NotesDashboard({ initialNotes }: { initialNotes: Note[] }) {
  // State for original values
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  
  // State for AI Conceptual Search
  const [searchQuery, setSearchQuery] = useState('')
  const [displayNotes, setDisplayNotes] = useState<Note[]>(initialNotes)
  const [isSearching, setIsSearching] = useState(false)

  // State for updates/editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editFile, setEditFile] = useState<File | null>(null) 
  const [updatingId, setUpdatingId] = useState<string | null>(null) 

  // Sync displayed notes if initialNotes updates behind the scenes
  const [prevInitialNotes, setPrevInitialNotes] = useState(initialNotes)
  if (initialNotes !== prevInitialNotes) {
    setDisplayNotes(initialNotes)
    setPrevInitialNotes(initialNotes)
  }

  // Handle semantic search execution
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setDisplayNotes(initialNotes)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const results = await searchNotes(searchQuery)
      if (results) {
        setDisplayNotes(results)
      }
    } catch (err) {
      alert('Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setDisplayNotes(initialNotes)
    setIsSearching(false)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    
    setUploading(true)
    try {
      let uploadedUrl = null

      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        uploadedUrl = await uploadAttachment(formData)
      }

      await createNote(title, content, uploadedUrl)
      
      setTitle('')
      setContent('')
      setFile(null)
      
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (err) {
      alert('Failed to save note with attachment')
    } finally {
      setUploading(false)
    }
  }

  const handleStartEdit = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content || '')
    setEditFile(null) 
  }

  const handleUpdate = async (id: string) => {
    setUpdatingId(id)
    try {
      let updatedUrl = undefined 

      if (editFile) {
        const formData = new FormData()
        formData.append('file', editFile)
        updatedUrl = await uploadAttachment(formData)
      }

      await updateNote(id, editTitle, editContent, updatedUrl)
      setEditingId(null)
      setEditFile(null)
    } catch (err) {
      alert('Failed to update note')
    } finally {
      setUpdatingId(null)
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
      {/* AI Semantic Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 bg-black p-3 rounded-xl border border-gray-800 shadow-md">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search notes conceptually... (e.g., 'fitness', 'ideas')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-slate-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition text-sm"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-gray-500" />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 font-medium transition cursor-pointer disabled:bg-blue-800"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded-lg transition"
          >
            <X size={18} />
          </button>
        )}
      </form>

      {/* Note Creation Form */}
      <form onSubmit={handleCreate} className="bg-black p-6 rounded-xl shadow-xl space-y-4 border border-gray-800">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Plus size={18} className="text-blue-400" /> Take a new note...
        </h3>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-slate-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />
        <textarea
          placeholder="Write details..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full p-2.5 bg-gray-900 border border-gray-800 rounded-lg text-slate-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
        />
        
        <div className="space-y-1">
          <label className="text-xs text-gray-400 font-medium block mb-1">Attach an image (Optional)</label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-gray-200 hover:file:bg-gray-700 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full sm:w-auto px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-400 transition font-medium text-sm shadow-md cursor-pointer"
        >
          {uploading ? 'Uploading...' : 'Save Note'}
        </button>
      </form>

      {/* Notes Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayNotes.length === 0 ? (
          <p className="text-gray-500 text-center md:col-span-2 py-8 bg-black/30 rounded-xl border border-dashed border-gray-800">
            No matching notes found. Try another concept phrase!
          </p>
        ) : (
          displayNotes.map((note) => (
            <div key={note.id} className="bg-black p-5 rounded-xl shadow-md border border-gray-800 flex flex-col justify-between min-h-[180px] transition hover:border-gray-700">
              {editingId === note.id ? (
                <div className="space-y-3 w-full">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full p-2 bg-gray-900 border border-gray-700 rounded text-slate-100 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  
                  <div className="bg-gray-900 p-2.5 rounded border border-gray-800 space-y-1.5">
                    <label className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <ImageIcon size={14} /> Replace or add image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-gray-800 file:text-gray-200 hover:file:bg-gray-700 cursor-pointer"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => setEditingId(null)} 
                      disabled={updatingId === note.id}
                      className="p-1.5 text-gray-400 hover:bg-gray-800 rounded-md transition disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                    <button 
                      onClick={() => handleUpdate(note.id)}
                      disabled={updatingId === note.id}
                      className="p-1.5 text-green-400 hover:bg-green-950/30 rounded-md transition font-semibold disabled:text-gray-600 cursor-pointer"
                    >
                      {updatingId === note.id ? 'Saving...' : <Check size={18} />}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-100 text-lg mb-1 truncate">{note.title}</h4>
                      <p className="text-slate-300 text-sm whitespace-pre-wrap break-words">{note.content}</p>
                    </div>

                    {note.image_url && (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden border border-gray-800 bg-gray-900 shadow-inner">
                        <img 
                          src={note.image_url} 
                          alt={note.title} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-3 mt-4 border-t border-gray-900">
                    <span className="text-xs text-gray-500 font-medium">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-1">
                      <button onClick={() => handleStartEdit(note)} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-gray-900 rounded-md transition">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-900 rounded-md transition">
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
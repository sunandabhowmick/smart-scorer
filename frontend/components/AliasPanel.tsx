'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

interface AliasPanelProps {
  skill: string
  existingAliases: string[]
  existingEquivalents: string[]
  onSave: (aliases: string[], equivalents: string[]) => void
  onDismiss: () => void
}

export default function AliasPanel({
  skill,
  existingAliases,
  existingEquivalents,
  onSave,
  onDismiss,
}: AliasPanelProps) {
  const [loading, setLoading]         = useState(true)
  const [aliases, setAliases]         = useState<string[]>([])
  const [equivalents, setEquivalents] = useState<string[]>([])
  const [selAliases, setSelAliases]   = useState<Set<string>>(new Set())
  const [selEquivs, setSelEquivs]     = useState<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await api.suggestAliases(skill)
        const newAliases = (data.aliases || []).filter(
          (a: string) => !existingAliases.includes(a)
        )
        const newEquivs = (data.equivalents || []).filter(
          (e: string) => !existingEquivalents.includes(e)
        )
        setAliases([...existingAliases, ...newAliases])
        setEquivalents([...existingEquivalents, ...newEquivs])
        // Pre-select all by default
        setSelAliases(new Set([...existingAliases, ...newAliases]))
        setSelEquivs(new Set([...existingEquivalents, ...newEquivs]))
      } catch {
        setAliases(existingAliases)
        setEquivalents(existingEquivalents)
        setSelAliases(new Set(existingAliases))
        setSelEquivs(new Set(existingEquivalents))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [skill])

  const toggleAlias = (a: string) => {
    setSelAliases(prev => {
      const next = new Set(prev)
      next.has(a) ? next.delete(a) : next.add(a)
      return next
    })
  }

  const toggleEquiv = (e: string) => {
    setSelEquivs(prev => {
      const next = new Set(prev)
      next.has(e) ? next.delete(e) : next.add(e)
      return next
    })
  }

  const handleSave = () => {
    onSave(Array.from(selAliases), Array.from(selEquivs))
  }

  return (
    <div className="mt-2 mb-1 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-blue-700">
          ✨ Also search for these in the resume
        </span>
        <button onClick={onDismiss}
          className="text-blue-400 hover:text-blue-600 text-xs">
          Dismiss
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-blue-500 animate-pulse">
          Finding similar keywords...
        </p>
      ) : (
        <>
          {/* Aliases */}
          {aliases.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1.5">
                Same skill — different name (100% match if found)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {aliases.map(a => (
                  <button key={a}
                    onClick={() => toggleAlias(a)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                      selAliases.has(a)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-400 border-gray-200 line-through'
                    }`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Equivalents */}
          {equivalents.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1.5">
                Similar skill (90% match if found)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {equivalents.map(e => (
                  <button key={e}
                    onClick={() => toggleEquiv(e)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium transition ${
                      selEquivs.has(e)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-gray-400 border-gray-200 line-through'
                    }`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
          )}

          {aliases.length === 0 && equivalents.length === 0 && (
            <p className="text-xs text-gray-400 italic">
              No suggestions found for this skill.
            </p>
          )}

          <p className="text-[10px] text-blue-500 mb-2">
            Click to toggle. Blue = will be used in scoring. Strikethrough = excluded.
            These are NOT added as separate skills.
          </p>

          <div className="flex gap-2">
            <button onClick={onDismiss}
              className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSave}
              className="px-3 py-1.5 text-xs font-semibold bg-[#1B4F8A] text-white rounded-lg hover:bg-[#133A66]">
              Save — attach to {skill}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

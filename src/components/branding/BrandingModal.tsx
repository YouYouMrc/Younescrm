import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import type { BrandingConfig } from '@/types'

interface Props {
  onClose: () => void
}

const PRESET_COLORS = [
  '#323E83', '#3B82F6', '#4D6EE8', '#E84F8C', '#2563EB', '#2563EB',
  '#4DBBE8', '#3B82F6', '#E8C44D', '#E88C4D', '#E84D4D', '#8CE84D',
  '#4DE8D9', '#A0A0A0',
]

export default function BrandingModal({ onClose }: Props) {
  const { profile, updateBranding } = useAuthStore()
  const existing = profile?.branding ?? {}

  const [accentColor, setAccentColor] = useState(existing.accentColor ?? '#323E83')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    const config: BrandingConfig = {
      ...(existing as BrandingConfig),
      accentColor,
    }
    await updateBranding(config)
    document.documentElement.style.setProperty('--accent', accentColor)
    setSuccess(true)
    setTimeout(onClose, 800)
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) (e.currentTarget as HTMLElement).dataset.mdown = "1" }} onMouseUp={(e) => { if (e.target === e.currentTarget && (e.currentTarget as HTMLElement).dataset.mdown === "1") { delete (e.currentTarget as HTMLElement).dataset.mdown; onClose() } }}>
      <div className="modal-content max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-syne font-bold text-base text-text1">Couleur principale</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X size={16} /></button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Preview */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border2)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-syne text-sm"
              style={{ background: accentColor, color: '#fff' }}
            >
              Y
            </div>
            <div>
              <p className="font-syne font-bold text-sm text-text1">Couleur accent</p>
              <p className="text-xs font-mono" style={{ color: accentColor }}>{accentColor}</p>
            </div>
            <div
              className="ml-auto px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: accentColor, color: '#fff' }}
            >
              Aperçu
            </div>
          </div>

          {/* Preset colors */}
          <div>
            <label className="form-label block mb-3">Couleurs prédéfinies</label>
            <div className="grid grid-cols-7 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className="w-9 h-9 rounded-lg transition-transform hover:scale-110 relative"
                  style={{
                    background: color,
                    outline: accentColor === color ? `2px solid white` : 'none',
                    outlineOffset: '2px',
                  }}
                  title={color}
                >
                  {accentColor === color && (
                    <Check size={14} className="absolute inset-0 m-auto text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom color */}
          <div className="form-group">
            <label className="form-label">Couleur personnalisée</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-12 h-9 rounded-lg cursor-pointer p-1"
                style={{ background: 'var(--surface2)' }}
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setAccentColor(v)
                }}
                className="flex-1 font-mono"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {success && (
          <div className="mt-4 text-sm rounded-lg px-3 py-2" style={{ background: 'rgba(37,99,235,0.12)', color: 'var(--accent)' }}>
            Couleur sauvegardée !
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex-1 justify-center disabled:opacity-60"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import { Upload, ImagePlus } from 'lucide-react'

const SIZE_OPTIONS = ['12×18"', '18×24"', '24×36"', '36×48"']
const FINISH_OPTIONS = ['Matte Vinyl', 'Gloss Vinyl', 'Reflective', 'Chrome']

export default function BuildYourOwn() {
  const [selectedSize, setSelectedSize] = useState('18×24"')
  const [selectedFinish, setSelectedFinish] = useState('Gloss Vinyl')
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setUploadedFile(url)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <section id="build" aria-labelledby="build-heading"
      style={{ paddingTop: 120, paddingBottom: 120, background: 'linear-gradient(180deg,#0e0e0e 0%,#0a0a0a 100%)' }}>
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left — copy */}
          <div>
            <div className="chip chip-lime mb-6">BUILD YOUR OWN</div>
            <h2 id="build-heading" className="text-headline text-white mb-6">
              Design Your<br />
              <span className="text-vinyl">Signature Sign</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 17, lineHeight: 1.7, marginBottom: 32 }}>
              Upload your artwork, choose your size and finish, and we'll produce a museum-quality
              sign shipped directly to your door. Every piece is hand-finished and quality-checked.
            </p>
            {/* Process steps */}
            <ol className="flex flex-col gap-5" style={{ listStyle: 'none' }}>
              {[
                { n: '01', t: 'Upload your design or artwork', d: 'PNG, SVG, or PDF — any format works' },
                { n: '02', t: 'Choose size & finish', d: 'From 12×18" up to 36×48"' },
                { n: '03', t: 'We produce & ship', d: 'Ready in 5–7 business days' },
              ].map(s => (
                <li key={s.n} className="flex items-start gap-4">
                  <span className="text-label flex-shrink-0" style={{ color: 'rgba(204,255,0,0.7)', fontSize: 11 }}>{s.n}</span>
                  <div>
                    <div className="text-white font-geist" style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{s.t}</div>
                    <div className="text-caption" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Right — form */}
          <div className="bento-card" style={{ background: '#111', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="text-white font-geist" style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', marginBottom: 24 }}>
              Start Your Order
            </div>

            {/* Image upload */}
            <div className="mb-6">
              <label className="text-label block mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>ARTWORK / REFERENCE IMAGE</label>
              <div
                id="upload-zone"
                className="upload-zone"
                style={{ borderColor: dragging ? 'rgba(0,122,255,0.6)' : 'rgba(255,255,255,0.12)', background: dragging ? 'rgba(0,122,255,0.05)' : 'transparent', padding: 32 }}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                aria-label="Upload artwork file"
                tabIndex={0}
              >
                <input ref={fileInputRef} type="file" accept="image/*,.pdf,.svg" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {uploadedFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <img src={uploadedFile} alt="Uploaded artwork preview" className="rounded-lg" style={{ maxHeight: 160, objectFit: 'contain' }} />
                    <span className="text-caption" style={{ color: 'rgba(0,122,255,0.9)', fontSize: 11 }}>Click to replace</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImagePlus size={22} style={{ color: 'rgba(255,255,255,0.4)' }} />
                    </div>
                    <div className="text-center">
                      <div className="text-white font-geist" style={{ fontWeight: 600, fontSize: 14 }}>Drop artwork here</div>
                      <div className="text-caption" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 }}>PNG, SVG, PDF — up to 50MB</div>
                    </div>
                    <div className="btn-ghost" style={{ padding: '8px 16px', fontSize: 12 }}>
                      <Upload size={13} /> Browse Files
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sign text */}
            <div className="mb-5">
              <label htmlFor="sign-text" className="text-label block mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>SIGN TEXT (OPTIONAL)</label>
              <input id="sign-text" type="text" className="input-field" placeholder="e.g. ARTISTRY AVE, your name, a quote…" />
            </div>

            {/* Size picker */}
            <div className="mb-5">
              <div className="text-label mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>SIZE</div>
              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map(s => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className="chip cursor-pointer transition-colors"
                    style={{
                      borderColor: selectedSize === s ? '#CCFF00' : 'rgba(255,255,255,0.15)',
                      color: selectedSize === s ? '#CCFF00' : 'rgba(255,255,255,0.55)',
                      background: selectedSize === s ? 'rgba(204,255,0,0.06)' : 'transparent',
                      padding: '8px 14px', fontSize: 11,
                    }}
                    aria-pressed={selectedSize === s}
                    aria-label={`Select size ${s}`}
                  >{s}</button>
                ))}
              </div>
            </div>

            {/* Finish picker */}
            <div className="mb-6">
              <div className="text-label mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>FINISH</div>
              <div className="flex flex-wrap gap-2">
                {FINISH_OPTIONS.map(f => (
                  <button key={f} onClick={() => setSelectedFinish(f)}
                    className="chip cursor-pointer transition-colors"
                    style={{
                      borderColor: selectedFinish === f ? '#007AFF' : 'rgba(255,255,255,0.15)',
                      color: selectedFinish === f ? '#007AFF' : 'rgba(255,255,255,0.55)',
                      background: selectedFinish === f ? 'rgba(0,122,255,0.06)' : 'transparent',
                      padding: '8px 14px', fontSize: 11,
                    }}
                    aria-pressed={selectedFinish === f}
                    aria-label={`Select finish ${f}`}
                  >{f}</button>
                ))}
              </div>
            </div>

            {/* Special instructions */}
            <div className="mb-6">
              <label htmlFor="notes" className="text-label block mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>SPECIAL NOTES</label>
              <textarea id="notes" className="textarea-field" placeholder="Any special requests, colors, or mounting requirements…" />
            </div>

            <button id="submit-custom-order" className="btn-chrome w-full" style={{ justifyContent: 'center' }}>
              Request a Quote →
            </button>
            <p className="text-caption text-center mt-3" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>
              No payment required yet — we'll email you a quote within 24 hours
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

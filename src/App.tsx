import { useEffect, useMemo, useRef, useState } from 'react';
import { bestForeground, contrast, normalizeHex, tonalScale } from './color';
import { downloadJson, downloadKit } from './export';
import { INITIAL_SPEC, type BrandColor, type BrandSpecification, type LogoVariant } from './types';
import './index.css';

const STORAGE_KEY = 'brand-launch-kit:draft:v1';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const VALID_TYPES = new Set(['image/svg+xml', 'image/png', 'image/webp', 'image/jpeg']);

function readDraft(): BrandSpecification {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...INITIAL_SPEC, ...JSON.parse(stored) as BrandSpecification } : INITIAL_SPEC;
  } catch {
    return INITIAL_SPEC;
  }
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function App() {
  const [spec, setSpec] = useState<BrandSpecification>(readDraft);
  const [activeStep, setActiveStep] = useState(1);
  const [message, setMessage] = useState('Drafts stay in this browser. Nothing is uploaded.');
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
    } catch {
      window.setTimeout(() => setMessage('Draft is too large for local storage. You can still export it now.'), 0);
    }
  }, [spec]);

  const completed = useMemo(() => [
    Boolean(spec.brand.name && spec.brand.description),
    spec.colors.every((color) => Boolean(normalizeHex(color.value))),
    spec.logos.length > 0,
    Boolean(spec.typography.heading && spec.typography.body),
  ], [spec]);

  const updateBrand = (key: keyof BrandSpecification['brand'], value: string | string[]) => {
    setSpec((current) => ({ ...current, brand: { ...current.brand, [key]: value } }));
  };

  const updateColor = (id: string, patch: Partial<BrandColor>) => {
    setSpec((current) => ({ ...current, colors: current.colors.map((color) => color.id === id ? { ...color, ...patch } : color) }));
  };

  const addColor = () => {
    setSpec((current) => ({
      ...current,
      colors: [...current.colors, { id: crypto.randomUUID(), name: 'Accent', value: '#ff5b9d', role: 'accent', origin: 'user' }],
    }));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const accepted: LogoVariant[] = [];
    const rejected: string[] = [];
    for (const file of Array.from(files)) {
      if (!VALID_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
        rejected.push(file.name);
        continue;
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      accepted.push({
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
        use: '',
        filename: file.name.replace(/[^a-zA-Z0-9._-]/g, '-'),
        mimeType: file.type,
        dataUrl,
        background: 'either',
        origin: 'user',
      });
    }
    setSpec((current) => ({ ...current, logos: [...current.logos, ...accepted] }));
    setMessage(rejected.length ? `Skipped ${rejected.join(', ')}. Use SVG, PNG, WebP, or JPEG files under 5 MB.` : `${accepted.length} logo asset${accepted.length === 1 ? '' : 's'} added locally.`);
    if (fileInput.current) fileInput.current.value = '';
  };

  const updateLogo = (id: string, patch: Partial<LogoVariant>) => {
    setSpec((current) => ({ ...current, logos: current.logos.map((logo) => logo.id === id ? { ...logo, ...patch } : logo) }));
  };

  const reset = () => {
    if (!window.confirm('Clear this local draft and start again?')) return;
    localStorage.removeItem(STORAGE_KEY);
    setSpec(INITIAL_SPEC);
    setActiveStep(1);
  };

  const steps = ['Identity', 'Color', 'Logos', 'Rules', 'Export'];

  return (
    <div className="app-shell">
      <header className="masthead">
        <a className="wordmark" href="#top" aria-label="Brand Launch Kit home"><span>BLK</span> Brand Launch Kit</a>
        <p className="privacy-note">Local-first · no uploads</p>
      </header>

      <main id="top">
        <section className="intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">Brand systems, ready to build</p>
            <h1 id="page-title">From brand decisions to an implementation kit.</h1>
          </div>
          <p className="lede">Add the essentials, review every suggestion, then export tokens, guidelines, a website prompt, and an AI coding skill in one portable package.</p>
        </section>

        <div className="workspace">
          <nav className="steps" aria-label="Brand kit sections">
            <ol>
              {steps.map((step, index) => (
                <li key={step}>
                  <button className={activeStep === index + 1 ? 'active' : ''} onClick={() => setActiveStep(index + 1)} aria-current={activeStep === index + 1 ? 'step' : undefined}>
                    <span>{String(index + 1).padStart(2, '0')}</span>{step}{completed[index] && <b aria-label="complete">✓</b>}
                  </button>
                </li>
              ))}
            </ol>
            <div className="draft-status" role="status">{message}</div>
          </nav>

          <section className="editor" aria-live="polite">
            {activeStep === 1 && (
              <fieldset>
                <legend><span>01</span> Define the identity</legend>
                <p className="section-copy">Give the exported tools enough context to make relevant choices without inventing a brand story.</p>
                <label>Brand name<input value={spec.brand.name} onChange={(event) => updateBrand('name', event.target.value)} placeholder="North Star Studio" /></label>
                <label>What does the brand do?<textarea value={spec.brand.description} onChange={(event) => updateBrand('description', event.target.value)} placeholder="A concise, factual description of the organization and its offer." rows={4} /></label>
                <label>Primary audience<input value={spec.brand.audience} onChange={(event) => updateBrand('audience', event.target.value)} placeholder="Independent hospitality teams" /></label>
                <label>Brand attributes <small>Comma-separated</small><input value={spec.brand.attributes.join(', ')} onChange={(event) => updateBrand('attributes', splitList(event.target.value))} placeholder="Warm, precise, optimistic" /></label>
              </fieldset>
            )}

            {activeStep === 2 && (
              <fieldset>
                <legend><span>02</span> Build the palette</legend>
                <p className="section-copy">Add only approved colors. Tonal scales and accessible text pairings are calculated as implementation aids.</p>
                <div className="color-list">
                  {spec.colors.map((color) => {
                    const valid = normalizeHex(color.value);
                    const foreground = valid ? bestForeground(valid) : '#16161d';
                    return <article className="color-card" key={color.id}>
                      <div className="swatch" style={{ background: valid ?? '#f1efea', color: foreground }}>{valid ? `${contrast(valid, foreground).toFixed(1)}:1` : 'Invalid'}</div>
                      <div className="color-fields">
                        <label>Name<input value={color.name} onChange={(event) => updateColor(color.id, { name: event.target.value })} /></label>
                        <label>Hex<div className="hex-input"><input type="color" value={valid ?? '#000000'} aria-label={`${color.name} color picker`} onChange={(event) => updateColor(color.id, { value: event.target.value })} /><input value={color.value} onChange={(event) => updateColor(color.id, { value: event.target.value })} aria-invalid={!valid} /></div></label>
                        <label>Role<select value={color.role} onChange={(event) => updateColor(color.id, { role: event.target.value as BrandColor['role'] })}><option>primary</option><option>secondary</option><option>accent</option><option>neutral</option></select></label>
                      </div>
                      {valid && <div className="tone-row" aria-label={`${color.name} suggested tonal scale`}>{tonalScale(valid).map((tone) => <span key={tone} style={{ background: tone }} title={tone} />)}</div>}
                      {spec.colors.length > 1 && <button className="text-button danger" onClick={() => setSpec((current) => ({ ...current, colors: current.colors.filter((item) => item.id !== color.id) }))}>Remove</button>}
                    </article>;
                  })}
                </div>
                <button className="secondary-button" onClick={addColor}>+ Add color</button>
              </fieldset>
            )}

            {activeStep === 3 && (
              <fieldset>
                <legend><span>03</span> Add logo variants</legend>
                <p className="section-copy">Assets are read locally and packaged as supplied. SVG markup is never injected into this page.</p>
                <div className="upload-zone">
                  <input ref={fileInput} id="logo-files" type="file" multiple accept=".svg,.png,.webp,.jpg,.jpeg,image/svg+xml,image/png,image/webp,image/jpeg" onChange={(event) => void handleFiles(event.target.files)} />
                  <label htmlFor="logo-files"><strong>Choose logo files</strong><span>SVG, PNG, WebP, or JPEG · maximum 5 MB each</span></label>
                </div>
                <div className="logo-list">
                  {spec.logos.map((logo) => <article className="logo-card" key={logo.id}>
                    <div className={`logo-preview ${logo.background === 'dark' ? 'dark' : ''}`}><img src={logo.dataUrl} alt="Uploaded logo preview" /></div>
                    <div className="logo-fields">
                      <label>Variant name<input value={logo.name} onChange={(event) => updateLogo(logo.id, { name: event.target.value })} /></label>
                      <label>Use it for<input value={logo.use} onChange={(event) => updateLogo(logo.id, { use: event.target.value })} placeholder="Primary brand moments" /></label>
                      <label>Approved background<select value={logo.background} onChange={(event) => updateLogo(logo.id, { background: event.target.value as LogoVariant['background'] })}><option value="either">Light and dark</option><option value="light">Light only</option><option value="dark">Dark only</option></select></label>
                    </div>
                    <button className="text-button danger" onClick={() => setSpec((current) => ({ ...current, logos: current.logos.filter((item) => item.id !== logo.id) }))}>Remove asset</button>
                  </article>)}
                  {!spec.logos.length && <p className="empty-state">No logo files yet. The export will preserve a clearly labeled TODO if you continue without them.</p>}
                </div>
              </fieldset>
            )}

            {activeStep === 4 && (
              <fieldset>
                <legend><span>04</span> Confirm the rules</legend>
                <p className="section-copy">Defaults are suggestions, not facts. Edit them to match the approved brand system.</p>
                <div className="two-column">
                  <label>Heading font stack<input value={spec.typography.heading} onChange={(event) => setSpec((current) => ({ ...current, typography: { ...current.typography, heading: event.target.value } }))} /></label>
                  <label>Body font stack<input value={spec.typography.body} onChange={(event) => setSpec((current) => ({ ...current, typography: { ...current.typography, body: event.target.value } }))} /></label>
                </div>
                <label>Font source or licensing note<input value={spec.typography.source} onChange={(event) => setSpec((current) => ({ ...current, typography: { ...current.typography, source: event.target.value } }))} placeholder="URL or licensing instructions" /></label>
                <div className="two-column">
                  <label>Spacing character<select value={spec.layout.spacingCharacter} onChange={(event) => setSpec((current) => ({ ...current, layout: { ...current.layout, spacingCharacter: event.target.value as BrandSpecification['layout']['spacingCharacter'] } }))}><option>compact</option><option>balanced</option><option>generous</option></select></label>
                  <label>Corner style<select value={spec.layout.cornerStyle} onChange={(event) => setSpec((current) => ({ ...current, layout: { ...current.layout, cornerStyle: event.target.value as BrandSpecification['layout']['cornerStyle'] } }))}><option>square</option><option>subtle</option><option>rounded</option></select></label>
                </div>
                <label>Voice attributes <small>Comma-separated</small><input value={spec.voice.attributes.join(', ')} onChange={(event) => setSpec((current) => ({ ...current, voice: { attributes: splitList(event.target.value) } }))} /></label>
                <label>Logo clear space<textarea rows={2} value={spec.rules.clearSpace} onChange={(event) => setSpec((current) => ({ ...current, rules: { ...current.rules, clearSpace: event.target.value } }))} /></label>
                <label>Minimum logo size<textarea rows={2} value={spec.rules.minimumSize} onChange={(event) => setSpec((current) => ({ ...current, rules: { ...current.rules, minimumSize: event.target.value } }))} /></label>
                <div className="two-column">
                  <label>Do <small>One per line</small><textarea rows={5} value={spec.rules.dos.join('\n')} onChange={(event) => setSpec((current) => ({ ...current, rules: { ...current.rules, dos: event.target.value.split('\n').filter(Boolean) } }))} /></label>
                  <label>Do not <small>One per line</small><textarea rows={5} value={spec.rules.donts.join('\n')} onChange={(event) => setSpec((current) => ({ ...current, rules: { ...current.rules, donts: event.target.value.split('\n').filter(Boolean) } }))} /></label>
                </div>
              </fieldset>
            )}

            {activeStep === 5 && (
              <fieldset>
                <legend><span>05</span> Export the kit</legend>
                <p className="section-copy">The package is portable, versionable, and useful without this app. Review the summary before downloading.</p>
                <div className="readiness">
                  <div><span>{spec.brand.name || 'Untitled brand'}</span><strong>{completed.filter(Boolean).length}/4 essentials ready</strong></div>
                  <ul>
                    <li className={completed[0] ? 'ready' : ''}>{completed[0] ? 'Ready' : 'Needs work'} · identity context</li>
                    <li className={completed[1] ? 'ready' : ''}>{completed[1] ? 'Ready' : 'Needs work'} · valid colors</li>
                    <li className={completed[2] ? 'ready' : ''}>{completed[2] ? 'Ready' : 'Optional TODO'} · logo assets</li>
                    <li className={completed[3] ? 'ready' : ''}>{completed[3] ? 'Ready' : 'Needs work'} · typography</li>
                  </ul>
                </div>
                <div className="package-grid">
                  {['brand.json', 'brand-guidelines.md', 'website-prompt.md', 'SKILL.md', 'variables.css', `${spec.logos.length} logo asset${spec.logos.length === 1 ? '' : 's'}`].map((file) => <div key={file}><span aria-hidden="true">↗</span>{file}</div>)}
                </div>
                <div className="export-actions">
                  <button className="primary-button" onClick={() => void downloadKit(spec)}>Download complete ZIP</button>
                  <button className="secondary-button" onClick={() => downloadJson(spec)}>Download JSON only</button>
                </div>
                <p className="export-note">Suggested rules remain editable. Missing evidence stays marked TODO; the export never fabricates brand facts.</p>
              </fieldset>
            )}

            <div className="editor-footer">
              <button className="text-button" onClick={reset}>Clear draft</button>
              <div>
                {activeStep > 1 && <button className="secondary-button" onClick={() => setActiveStep((step) => step - 1)}>Back</button>}
                {activeStep < 5 && <button className="primary-button" onClick={() => setActiveStep((step) => step + 1)}>Continue</button>}
              </div>
            </div>
          </section>

          <aside className="live-preview" aria-label="Live brand preview">
            <div className="preview-label"><span>Live specimen</span><span>{String(activeStep).padStart(2, '0')} / 05</span></div>
            <div className="brand-specimen" style={{ '--primary': normalizeHex(spec.colors[0]?.value) ?? '#5b4bff', '--on-primary': bestForeground(spec.colors[0]?.value ?? '#5b4bff'), '--heading-font': spec.typography.heading } as React.CSSProperties}>
              <div className="specimen-top"><span>{spec.brand.name || 'Your brand'}</span><span>Guidelines / 01</span></div>
              <div className="specimen-body">
                {spec.logos[0] ? <img src={spec.logos[0].dataUrl} alt="" /> : <div className="logo-placeholder">Logo</div>}
                <p>{spec.brand.description || 'A clear expression of what the brand does and why it matters.'}</p>
              </div>
              <div className="specimen-colors">{spec.colors.slice(0, 4).map((color) => <span key={color.id} style={{ background: normalizeHex(color.value) ?? '#ddd' }} />)}</div>
              <div className="specimen-footer"><span>{spec.brand.attributes.slice(0, 3).join(' · ') || 'Clear · useful · distinct'}</span><strong>Brand system</strong></div>
            </div>
            <p className="preview-caption">A directional preview only. The downloaded specification—not this composition—is the source of truth.</p>
          </aside>
        </div>
      </main>

      <footer className="site-footer"><p>Brand Launch Kit · A local-first design systems experiment</p><a href="https://github.com/ql1max/brand-launch-kit">Source code</a></footer>
    </div>
  );
}

export default App;

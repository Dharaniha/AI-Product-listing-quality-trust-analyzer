import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, ClipboardList, FileText, Image as ImageIcon,
  CheckCircle2, Zap, ChevronLeft, ChevronRight, Upload,
  X, Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/common/PageHeader';

const STEPS = [
  { id: 1, label: 'Product Info', icon: Package },
  { id: 2, label: 'Condition', icon: ClipboardList },
  { id: 3, label: 'Description', icon: FileText },
  { id: 4, label: 'Images', icon: ImageIcon },
  { id: 5, label: 'Review', icon: CheckCircle2 },
  { id: 6, label: 'Analyze', icon: Zap },
];

const CATEGORIES = ['Electronics', 'Mobile Phones', 'Laptops', 'Cameras', 'Audio', 'Tablets', 'Accessories', 'Other'];
const CONDITIONS = ['New', 'Like New', 'Excellent', 'Good', 'Fair', 'For Parts'];
const WARRANTY_OPTIONS = ['No Warranty', 'Seller Warranty (30 days)', 'Seller Warranty (90 days)', 'Manufacturer Warranty', 'Extended Warranty'];

const initialForm = {
  productName: '', category: '', brand: '', model: '',
  condition: '', age: '', warranty: '',
  description: '',
  images: [],
};

const aiDescriptionHints = [
  'Add exact model number and color/variant',
  'Mention all included accessories',
  'Describe battery health or screen condition',
  'List connectivity features (Wi-Fi, Bluetooth, etc.)',
  'Include original packaging details if available',
];

export default function NewListingPage() {
  const navigate = useNavigate();
  const { setCurrentListing } = useApp();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [dragOver, setDragOver] = useState(false);
  const [improving, setImproving] = useState(false);

  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const improveDescription = () => {
    if (!form.description) return;
    setImproving(true);
    setTimeout(() => {
      const enhanced = `${form.description}\n\n✓ Includes original box and all accessories\n✓ No scratches or dents — used with a case from day one\n✓ Battery health at 97% (verified in device settings)\n✓ Full factory reset and ready for new owner\n✓ All ports and buttons fully functional`;
      update('description', enhanced);
      setImproving(false);
    }, 1800);
  };

  // ── Stores real File objects (not just { name, size }) ──
  const handleImageDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer?.files || e.target.files || []);
    update('images', [...form.images, ...files].slice(0, 8));
  };

  const removeImage = (i) => {
    update('images', form.images.filter((_, idx) => idx !== i));
  };

  const startAnalysis = () => {
    setCurrentListing(form);
    navigate('/analysis');
  };

  const canProceed = () => {
    if (step === 1) return form.productName && form.category;
    if (step === 2) return form.condition;
    if (step === 3) return form.description.length >= 20;
    return true;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title="New Listing"
        subtitle="Submit a listing for AI trust analysis"
      />

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const active = step === s.id;
          return (
            <div key={s.id} className="flex items-center flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                active ? 'bg-primary/15 text-primary border border-primary/25' :
                done ? 'text-success' : 'text-muted'
              }`}>
                {done
                  ? <CheckCircle2 size={13} className="text-success" />
                  : <s.icon size={13} />
                }
                <span className="hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 mx-1 transition-colors ${done ? 'bg-success/40' : 'bg-white/8'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="card gradient-border min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {/* Step 1: Product Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Product Information</h2>
                  <p className="text-xs text-muted">Tell us what you're selling</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-2">Product Name *</label>
                  <input className="input-field" placeholder="e.g. Sony WH-1000XM5 Wireless Headphones" value={form.productName} onChange={e => update('productName', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2">Category *</label>
                    <select className="input-field" value={form.category} onChange={e => update('category', e.target.value)}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2">Brand</label>
                    <input className="input-field" placeholder="e.g. Sony" value={form.brand} onChange={e => update('brand', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-2">Model Number</label>
                  <input className="input-field" placeholder="e.g. WH-1000XM5" value={form.model} onChange={e => update('model', e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 2: Condition */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Condition Details</h2>
                  <p className="text-xs text-muted">Be honest — accuracy improves your Trust Score</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-2">Condition *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CONDITIONS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update('condition', c)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all duration-150 ${
                          form.condition === c
                            ? 'bg-primary/15 border-primary/40 text-primary'
                            : 'bg-white/3 border-white/8 text-muted hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2">Product Age</label>
                    <input className="input-field" placeholder="e.g. 6 months" value={form.age} onChange={e => update('age', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted mb-2">Warranty</label>
                    <select className="input-field" value={form.warranty} onChange={e => update('warranty', e.target.value)}>
                      <option value="">Select warranty</option>
                      {WARRANTY_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Description */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Listing Description</h2>
                  <p className="text-xs text-muted">A detailed description dramatically raises your quality score</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-muted">Description *</label>
                    <span className="text-xs text-muted">{form.description.length} chars</span>
                  </div>
                  <textarea
                    className="input-field resize-none h-48 font-mono text-xs leading-relaxed"
                    placeholder="Describe your item in detail. What's included? What's its condition? Any cosmetic marks? Original accessories?"
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={improveDescription}
                  disabled={!form.description || improving}
                  className="btn-ghost text-sm disabled:opacity-40"
                >
                  {improving ? (
                    <><div className="w-4 h-4 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" /> Improving…</>
                  ) : (
                    <><Sparkles size={14} className="text-secondary" /> Improve with AI</>
                  )}
                </button>
                <div className="p-3 rounded-xl bg-white/3 border border-white/6">
                  <p className="text-xs text-muted font-medium mb-2">AI hints for a higher score:</p>
                  <ul className="space-y-1">
                    {aiDescriptionHints.map((h, i) => (
                      <li key={i} className="text-xs text-muted/70 flex items-start gap-2">
                        <span className="text-primary/50 mt-0.5">›</span> {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Product Images</h2>
                  <p className="text-xs text-muted">Listings with 4+ images get 25% higher trust scores on average</p>
                </div>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleImageDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer ${
                    dragOver
                      ? 'border-primary/60 bg-primary/8'
                      : 'border-white/12 hover:border-primary/30 hover:bg-white/2'
                  }`}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <Upload size={28} className={`mx-auto mb-3 ${dragOver ? 'text-primary' : 'text-muted'}`} />
                  <p className="text-sm text-white/80 font-medium mb-1">Drop images here or click to upload</p>
                  <p className="text-xs text-muted">PNG, JPG, WEBP up to 10MB each · max 8 images</p>
                  <input id="file-input" type="file" multiple accept="image/*" className="hidden" onChange={handleImageDrop} />
                </div>

                {/* ── Image previews with real thumbnails ── */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden group">
                        <img
                          src={img instanceof File ? URL.createObjectURL(img) : img}
                          alt={img.name || `image-${i}`}
                          className="w-full h-full object-cover"
                        />
                        <p className="text-xs text-white/60 px-2 truncate absolute bottom-2 left-0 right-0 text-center bg-black/40 py-0.5">
                          {img.name}
                        </p>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); removeImage(i); }}
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-danger/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Review Your Listing</h2>
                  <p className="text-xs text-muted">Check everything before running the analysis</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'Product Name', value: form.productName || '—' },
                    { label: 'Category', value: form.category || '—' },
                    { label: 'Brand', value: form.brand || '—' },
                    { label: 'Model', value: form.model || '—' },
                    { label: 'Condition', value: form.condition || '—' },
                    { label: 'Age', value: form.age || '—' },
                    { label: 'Warranty', value: form.warranty || '—' },
                    { label: 'Images', value: form.images.length > 0 ? `${form.images.length} uploaded` : 'None uploaded' },
                    { label: 'Description', value: form.description ? `${form.description.length} characters` : '—' },
                  ].map(row => (
                    <div key={row.label} className="flex items-start justify-between py-2.5 border-b border-white/5">
                      <span className="text-xs font-medium text-muted">{row.label}</span>
                      <span className="text-xs text-white/80 text-right max-w-[200px] truncate">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-xl bg-primary/8 border border-primary/15">
                  <p className="text-xs text-primary/80">
                    Ready to analyze. The AI will check description quality, completeness, duplicates, and suspicious content.
                  </p>
                </div>
              </div>
            )}

            {/* Step 6: Launch */}
            {step === 6 && (
              <div className="flex flex-col items-center text-center py-8 space-y-6">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center"
                >
                  <Zap size={32} className="text-primary" />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-white mb-2">Ready to Analyze</h2>
                  <p className="text-sm text-muted max-w-sm">
                    Click below to run all five AI engines on your listing and generate a full Trust Score report.
                  </p>
                </div>
                <button onClick={startAnalysis} className="btn-primary text-base px-10 py-3">
                  <Zap size={17} /> Run Analysis
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-ghost text-sm disabled:opacity-30"
        >
          <ChevronLeft size={15} /> Back
        </button>
        <span className="text-xs text-muted">Step {step} of {STEPS.length}</span>
        {step < 6 && (
          <button
            onClick={() => setStep(s => Math.min(6, s + 1))}
            disabled={!canProceed()}
            className="btn-primary text-sm disabled:opacity-40"
          >
            Continue <ChevronRight size={15} />
          </button>
        )}
        {step === 6 && <div className="w-20" />}
      </div>
    </div>
  );
}

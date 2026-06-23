/**
 * Results Page — FIX #14
 * Uses real engine data from AnalysisContext.
 * PDF export via jsPDF (FIX #8).
 * Highlighted suspicious terms (FIX #5).
 * Dynamic suggestions from suggestionEngine (FIX #7).
 * Real missing fields from completenessChecker (FIX #6).
 * Real duplicate matches from duplicateDetector (FIX #9).
 */
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Copy, CheckCircle2, XCircle, Info,
  Lightbulb, ArrowRight, PlusCircle, Download, Shield,
  FileText, Loader2
} from 'lucide-react';
import TrustScoreGauge from '../../components/common/TrustScoreGauge';
import { useApp } from '../../context/AppContext';
import { getScoreColor, getRiskLabel } from '../../utils/trustEngine';
import { highlightSuspiciousTerms } from '../../utils/suspiciousDetector';
import QualityRadarChart from '../../components/charts/QualityRadarChart';
import PageHeader from '../../components/common/PageHeader';

// ── Demo fallback used when no real analysis exists ──────────────────────
const DEMO = { 
  trustScore: 74, trustLevel: 'Good', trustColor: '#06B6D4',
  completeness: 68, completenessLevel: 'Fair',
  descriptionQuality: 77,
  duplicateRisk: 32, suspiciousRisk: 18,
  missingFields:    [
    { field: 'Product Images',       weight: 15, hint: 'Upload at least 3 clear product photos' },
    { field: 'Warranty',             weight: 10, hint: 'Specify remaining warranty if any' },
    { field: 'Product Age',          weight: 5,  hint: 'Mention how long you have owned this item' },
    { field: 'Product Specifications', weight: 10, hint: 'Add tech specs to the description' },
  ],
  allPatterns: [
    { phrase: 'send money directly',      severity: 'high',   found: false },
    { phrase: '100% guaranteed',          severity: 'medium', found: false },
    { phrase: 'contact outside platform', severity: 'high',   found: false },
    { phrase: 'wire transfer',            severity: 'high',   found: false },
    { phrase: 'whatsapp only',            severity: 'high',   found: false },
    { phrase: 'instant profit',           severity: 'high',   found: false },
  ],
  suspiciousTerms: [],
  duplicateMatches: [
    { id: 1, title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones', similarity: 92, risk: 'high',   price: 299 },
    { id: 2, title: 'Sony WH1000XM5 Headphones Black',                       similarity: 78, risk: 'medium', price: 270 },
  ],
  suggestions: [
    { id: 1, text: 'Upload at least 3 product images',               priority: 'high',   category: 'images'       },
    { id: 2, text: 'Add technical specifications to the description', priority: 'high',   category: 'description'  },
    { id: 3, text: 'Specify warranty status',                         priority: 'medium', category: 'completeness' },
    { id: 4, text: 'Mention how long you have owned the product',     priority: 'low',    category: 'completeness' },
  ],
  radarData: [
    { subject: 'Completeness', A: 68, fullMark: 100 },
    { subject: 'Description',  A: 77, fullMark: 100 },
    { subject: 'Images',       A: 30, fullMark: 100 },
    { subject: 'Safety',       A: 82, fullMark: 100 },
    { subject: 'Trust',        A: 74, fullMark: 100 },
    { subject: 'Uniqueness',   A: 68, fullMark: 100 },
  ],
  listingName: 'Sony WH-1000XM5',
};

// ── Mini circular gauge ───────────────────────────────────────────────────
function MiniGauge({ label, value }) {
  const color = getScoreColor(value);
  const C = 2 * Math.PI * 26;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-16 h-16">
        <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <motion.circle cx="32" cy="32" r="26" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C - (value / 100) * C }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{value}</span>
        </div>
      </div>
      <span className="text-xs text-muted text-center leading-tight">{label}</span>
    </div>
  );
}

// ── Severity colour helper ────────────────────────────────────────────────
function severityClass(s) {
  if (s === 'high')   return 'text-danger';
  if (s === 'medium') return 'text-warning';
  return 'text-muted';
}
function severityBadge(s) {
  if (s === 'high')   return 'bg-danger/10  text-danger  border-danger/20';
  if (s === 'medium') return 'bg-warning/10 text-warning border-warning/20';
  return 'bg-white/8 text-muted border-white/10';
}

// ── PDF Export (FIX #8) ───────────────────────────────────────────────────
async function exportPDF(result, listingName) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  let y = 20;
  const LINE = 7;
  const INDENT = 20;

  const heading = (text, size = 14, color = [6, 182, 212]) => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(text, INDENT, y);
    y += LINE;
  };
  const body = (text, color = [200, 210, 220]) => {
    doc.setFontSize(10);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, W - INDENT * 2);
    doc.text(lines, INDENT, y);
    y += lines.length * 5.5;
  };
  const rule = () => {
    doc.setDrawColor(40, 60, 80);
    doc.line(INDENT, y, W - INDENT, y);
    y += 5;
  };
  const gap = (n = 5) => { y += n; };

  // Header
  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, W, 297, 'F');
  heading('TrustLens AI — Trust Report', 18, [6, 182, 212]);
  body(`Listing: ${listingName}   |   Generated: ${new Date().toLocaleString()}`);
  rule();

  // Trust Score
  gap();
  heading('Overall Trust Score', 13, [248, 250, 252]);
  body(`${result.trustScore} / 100  —  ${result.trustLevel}`);
  gap();

  heading('Score Breakdown', 12, [148, 163, 184]);
  body(`Completeness:        ${result.completeness} / 100`);
  body(`Description Quality: ${result.descriptionQuality} / 100`);
  body(`Duplicate Risk:      ${result.duplicateRisk}%`);
  body(`Suspicious Risk:     ${result.suspiciousRisk}%`);
  rule();

  // Missing Fields
  gap();
  heading('Missing Information', 13, [248, 250, 252]);
  if (result.missingFields?.length) {
    result.missingFields.forEach(f => body(`• ${f.field} (−${f.weight} pts)`));
  } else {
    body('No missing fields detected.');
  }
  rule();

  // Suspicious Content
  gap();
  heading('Suspicious Content', 13, [248, 250, 252]);
  const found = result.suspiciousTerms || [];
  if (found.length) {
    found.forEach(t => body(`• "${t.phrase}" — ${t.severity} severity`));
  } else {
    body('No suspicious phrases detected.');
  }
  rule();

  // Duplicate Matches
  gap();
  heading('Duplicate Matches', 13, [248, 250, 252]);
  const dups = result.duplicateMatches || [];
  if (dups.length) {
    dups.forEach(d => body(`• ${d.title} — ${d.similarity}% similarity`));
  } else {
    body('No significant duplicate matches found.');
  }
  rule();

  // AI Suggestions
  gap();
  heading('AI Suggestions', 13, [248, 250, 252]);
  (result.suggestions || []).forEach((s, i) => {
    body(`${i + 1}. [${s.priority.toUpperCase()}] ${s.text}`);
  });

  doc.save(`TrustLens_Report_${listingName.replace(/\s+/g, '_')}.pdf`);
}

// ── Highlighted description text ─────────────────────────────────────────
function HighlightedDescription({ description, suspiciousTerms }) {
  if (!description) return <span className="text-muted/50 italic">No description provided.</span>;
  const segments = highlightSuspiciousTerms(description, suspiciousTerms || []);
  return (
    <p className="text-xs text-white/70 leading-relaxed font-mono whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.highlight
          ? <mark key={i} className="bg-danger/25 text-danger px-0.5 rounded not-italic">{seg.text}</mark>
          : <span key={i}>{seg.text}</span>
      )}
    </p>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate();
  const { analysisResult, currentListing } = useApp();
  const r = analysisResult || DEMO;
  const listingName = r.listingName || currentListing?.productName || 'Your Listing';
  const missingCount = (r.missingFields || []).length;
  const suspiciousFound = (r.suspiciousTerms || []);

  const handlePDF = () => exportPDF(r, listingName);

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Trust Report"
        subtitle={listingName}
        action={
          <div className="flex gap-2">
            <button onClick={handlePDF} className="btn-ghost text-sm py-2">
              <Download size={14} /> Export PDF
            </button>
            <button onClick={() => navigate('/new-listing')} className="btn-primary text-sm py-2">
              <PlusCircle size={14} /> New Analysis
            </button>
          </div>
        }
      />

      {/* ── Row 1: Main gauge + breakdown ── */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="card gradient-border flex flex-col items-center py-8">
          <p className="section-label mb-4">Overall Trust Score</p>
          <TrustScoreGauge score={r.trustScore} size={180} />
          <div className="grid grid-cols-3 gap-4 mt-8 w-full">
            {[
              { label: 'Completeness', val: r.completeness },
              { label: 'Description',  val: r.descriptionQuality },
              { label: 'Dup. Risk',    val: r.duplicateRisk, suffix: '%', invert: true },
            ].map((item, i) => (
              <div key={i} className={`text-center ${i === 1 ? 'border-x border-white/5' : ''}`}>
                <div className="text-lg font-bold"
                  style={{ color: getScoreColor(item.invert ? 100 - item.val : item.val) }}>
                  {item.val}{item.suffix || ''}
                </div>
                <div className="text-xs text-muted mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="space-y-4">
          <div className="card">
            <p className="section-label mb-4">Score Breakdown</p>
            <div className="flex justify-around">
              <MiniGauge label="Completeness"   value={r.completeness} />
              <MiniGauge label="Description"    value={r.descriptionQuality} />
              <MiniGauge label="Dup. Safety"    value={Math.max(0, 100 - r.duplicateRisk)} />
              <MiniGauge label="Sus. Safety"    value={Math.max(0, 100 - r.suspiciousRisk)} />
            </div>
          </div>
          <QualityRadarChart data={r.radarData} />
        </div>
      </div>

      {/* ── Row 2: Missing Info + Suspicious ── */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Missing Information */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="card">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-primary" />
            <h3 className="font-semibold text-white">Missing Information</h3>
            <span className={`badge ml-auto ${missingCount > 0 ? 'bg-warning/15 text-warning border-warning/20' : 'bg-success/15 text-success border-success/20'}`}>
              {missingCount} fields
            </span>
          </div>
          {missingCount === 0 ? (
            <div className="flex items-center gap-2 text-success text-sm py-2">
              <CheckCircle2 size={15} /> All fields are complete!
            </div>
          ) : (
            <div className="space-y-2">
              {(r.missingFields || []).map(f => (
                <div key={f.field} className="py-2 border-b border-white/4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle size={13} className="text-danger flex-shrink-0" />
                      <span className="text-xs text-white/80">{f.field}</span>
                    </div>
                    <span className="text-xs text-muted">−{f.weight} pts</span>
                  </div>
                  {f.hint && <p className="text-xs text-muted/60 mt-1 ml-5">{f.hint}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Suspicious Content */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-warning" />
            <h3 className="font-semibold text-white">Suspicious Content</h3>
            <span className={`badge ml-auto ${suspiciousFound.length > 0 ? 'bg-danger/15 text-danger border-danger/20' : 'bg-success/15 text-success border-success/20'}`}>
              {suspiciousFound.length} found
            </span>
          </div>
          <div className="space-y-2 mb-4">
            {(r.allPatterns || []).map(p => (
              <div key={p.phrase} className="flex items-center justify-between py-1.5 border-b border-white/4">
                <div className="flex items-center gap-2">
                  {p.found
                    ? <XCircle size={12} className="text-danger flex-shrink-0" />
                    : <CheckCircle2 size={12} className="text-success/50 flex-shrink-0" />}
                  <span className={`text-xs font-mono ${p.found ? 'text-danger' : 'text-muted/50'}`}>
                    "{p.phrase}"
                  </span>
                </div>
                <span className={`badge text-xs border ${severityBadge(p.severity)}`}>{p.severity}</span>
              </div>
            ))}
          </div>
          {/* Highlighted description preview */}
          {currentListing?.description && suspiciousFound.length > 0 && (
            <div className="mt-3 p-3 rounded-xl bg-white/3 border border-white/6">
              <p className="text-xs font-semibold text-muted mb-2">Description preview (flagged terms highlighted):</p>
              <HighlightedDescription
                description={currentListing.description}
                suspiciousTerms={suspiciousFound}
              />
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Row 3: Duplicates + Suggestions ── */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Duplicate Matches */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="card">
          <div className="flex items-center gap-2 mb-4">
            <Copy size={16} className="text-accent" />
            <h3 className="font-semibold text-white">Duplicate Alerts</h3>
            <span className={`badge ml-auto text-xs border ${(r.duplicateMatches || []).length > 0 ? 'bg-warning/15 text-warning border-warning/20' : 'bg-success/15 text-success border-success/20'}`}>
              {(r.duplicateMatches || []).length} found
            </span>
          </div>
          {(r.duplicateMatches || []).length === 0 ? (
            <div className="flex items-center gap-2 text-success text-sm py-2">
              <CheckCircle2 size={15} /> No duplicate listings detected.
            </div>
          ) : (
            <div className="space-y-3">
              {(r.duplicateMatches || []).map(d => {
                const riskHigh = d.similarity >= 80;
                return (
                  <div key={d.id} className={`p-3 rounded-xl border ${riskHigh ? 'border-danger/20 bg-danger/5' : 'border-warning/20 bg-warning/5'}`}>
                    {/* Side-by-side comparison */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-xs text-muted mb-0.5">Your listing</p>
                        <p className="text-xs font-medium text-white/90 truncate">{listingName}</p>
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${riskHigh ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'}`}>
                        {d.similarity}%
                      </div>
                      <div className="flex-1 min-w-0 pl-2 text-right">
                        <p className="text-xs text-muted mb-0.5">Similar listing</p>
                        <p className="text-xs font-medium text-white/90 truncate">{d.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${d.similarity}%`, background: riskHigh ? '#EF4444' : '#F59E0B' }} />
                      </div>
                      {d.price && <span className="text-xs text-muted">${d.price}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* AI Suggestions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="card">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-secondary" />
            <h3 className="font-semibold text-white">AI Suggestions</h3>
            <span className="badge ml-auto bg-secondary/15 text-secondary border border-secondary/20 text-xs">
              {(r.suggestions || []).length}
            </span>
          </div>
          {(r.suggestions || []).length === 0 ? (
            <div className="flex items-center gap-2 text-success text-sm py-2">
              <CheckCircle2 size={15} /> Your listing looks great — no improvements needed!
            </div>
          ) : (
            <div className="space-y-3">
              {(r.suggestions || []).map((s, i) => (
                <motion.div key={s.id}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
                  className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                    s.priority === 'high'   ? 'bg-danger/15 text-danger'   :
                    s.priority === 'medium' ? 'bg-warning/15 text-warning' : 'bg-white/8 text-muted'
                  }`}>{i + 1}</div>
                  <div>
                    <p className="text-xs text-white/85 leading-relaxed">{s.text}</p>
                    <span className={`text-xs mt-0.5 inline-block font-medium ${
                      s.priority === 'high' ? 'text-danger' : s.priority === 'medium' ? 'text-warning' : 'text-muted'
                    }`}>{s.priority} priority</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Risk Assessment ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="card mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} className="text-primary" />
          <h3 className="font-semibold text-white">Risk Assessment Summary</h3>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Overall Risk',    score: 100 - r.trustScore,       desc: 'Based on composite trust score' },
            { label: 'Duplicate Risk',  score: r.duplicateRisk,          desc: 'Title similarity vs marketplace' },
            { label: 'Fraud Risk',      score: r.suspiciousRisk,         desc: 'Suspicious phrase detection' },
          ].map(item => {
            const { label: rLabel, color } = getRiskLabel(item.score);
            return (
              <div key={item.label} className="p-4 rounded-xl bg-white/3 border border-white/6 text-center">
                <div className="text-2xl font-bold mb-1" style={{ color }}>{item.score}%</div>
                <div className="text-sm font-medium text-white mb-0.5">{item.label}</div>
                <div className="text-xs text-muted mb-2">{item.desc}</div>
                <span className="badge text-xs" style={{ color, background: `${color}15`, border: `1px solid ${color}25` }}>
                  {rLabel} Risk
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* CTA */}
      <div className="flex justify-center gap-3 mt-2 mb-8">
        <button onClick={() => navigate('/new-listing')} className="btn-primary">
          Improve Listing <ArrowRight size={15} />
        </button>
        <button onClick={() => navigate('/trust-center')} className="btn-ghost">
          View Trust Center
        </button>
        <button onClick={handlePDF} className="btn-ghost">
          <FileText size={14} /> Download PDF
        </button>
      </div>
    </div>
  );
}

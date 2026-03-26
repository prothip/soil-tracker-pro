/**
 * QRCodeGenerator.jsx
 * Server-side: generates a QR code as base64 PNG for an activation token.
 */
import React, { useState } from 'react';
import { QrCode, Copy, Check, Loader2, Trash2, RefreshCw } from 'lucide-react';

export default function QRCodeGenerator({ apiUrl, token }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(null);

  async function loadCodes() {
    try {
      const res = await fetch(`${apiUrl}/api/offline/codes`);
      const data = await res.json();
      setCodes(data.codes || []);
    } catch (e) {
      setErr('Failed to load codes');
    }
  }

  async function generateCode() {
    setLoading(true);
    setErr('');
    try {
      const res = await fetch(`${apiUrl}/api/offline/generate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate');
      setCodes(prev => [data, ...prev]);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteCode(code) {
    if (!confirm(`Delete code ${code}?`)) return;
    try {
      await fetch(`${apiUrl}/api/offline/${encodeURIComponent(code)}`, { method: 'DELETE' });
      setCodes(prev => prev.filter(c => c.code !== code));
    } catch (e) {
      setErr('Failed to delete');
    }
  }

  async function copyCode(code) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch (_) {}
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">📱 Offline Activation Codes</h3>
          <p className="text-xs text-muted mt-0.5">Generate QR codes for customer app activation</p>
        </div>
        <button
          onClick={() => { generateCode(); loadCodes(); }}
          disabled={loading}
          className="h-9 px-4 bg-accent text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
          Generate Code
        </button>
      </div>

      {err && <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-2.5 rounded-lg">{err}</div>}

      {codes.length === 0 ? (
        <div className="text-center py-4 text-muted text-sm">
          No codes generated yet. Click "Generate Code" to create one.
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map(c => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-border">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono font-semibold text-text tracking-wider">{c.code}</div>
                <div className="text-xs text-muted mt-0.5">
                  {c.used
                    ? <span className="text-emerald-500">✓ Used{c.used_at ? ` at ${new Date(c.used_at).toLocaleString()}` : ''}</span>
                    : <span className="text-muted">Available</span>
                  }
                  {' · '}
                  Created {new Date(c.created_at).toLocaleString()}
                </div>
              </div>
              {!c.used && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => copyCode(c.code)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                    title="Copy code"
                  >
                    {copied === c.code ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => deleteCode(c.code)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete code"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
              {c.used && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-medium border border-emerald-200">Used</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * OfflineActivationScreen.jsx
 * First-run QR scan screen — customer app scans activation QR from admin dashboard.
 */
import React, { useState, useRef, Suspense } from 'react';
import { AlertCircle, Smartphone, Wifi, WifiOff, Loader2 } from 'lucide-react';

const QrScanner = React.lazy(() => import('./QrScanner'));

export default function OfflineActivationScreen({ onActivated, apiUrl }) {
  const [mode, setMode] = useState('choice'); // 'choice' | 'scan' | 'manual'
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState('');

  async function handleActivate(rawCode) {
    const activationCode = rawCode.startsWith('STP-ACT-') ? rawCode : `STP-ACT-${rawCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase()}`;
    if (activationCode.length < 12) {
      setErr('Invalid activation code format');
      return;
    }
    setErr(''); setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/offline/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activationCode }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Activation failed');

      // Store locally
      localStorage.setItem('stp_device_id', data.deviceId);
      localStorage.setItem('stp_activated', '1');
      localStorage.setItem('stp_activation_code', activationCode);

      setScanned(activationCode);
      setLoading(false);
      // Give a brief success moment, then notify parent
      setTimeout(() => onActivated({ deviceId: data.deviceId, activationCode }), 800);
    } catch (e) {
      setErr(e.message || 'Activation failed');
      setLoading(false);
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!code.trim()) { setErr('Enter an activation code'); return; }
    handleActivate(code.trim());
  }

  function handleQrScan(result) {
    if (!result) return;
    // QR might contain just the code or a URL with the code
    let extracted = result;
    try {
      const url = new URL(result);
      const pathParts = url.pathname.split('/');
      extracted = pathParts[pathParts.length - 1] || url.searchParams.get('code') || result;
    } catch (_) {
      // Not a URL, use as-is
    }
    handleActivate(extracted.trim());
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏗️</div>
          <div className="text-2xl font-bold text-text tracking-tight">
            Soil Tracker <span className="text-accent">Pro</span>
          </div>
          <p className="text-muted text-sm mt-2">
            Customer App — Works Offline
          </p>
        </div>

        {/* Choice cards */}
        {mode === 'choice' && (
          <div className="space-y-3">
            <div className="bg-surface rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <rect x="3" y="3" width="7" height="7" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Activate with QR Code</div>
                  <div className="text-xs text-muted">Scan the QR from your admin dashboard</div>
                </div>
              </div>
              <button
                onClick={() => setMode('scan')}
                className="w-full h-11 bg-accent text-white font-semibold rounded-xl hover:bg-accent/90 active:scale-[0.98] transition-all"
              >
                Scan QR Code
              </button>
            </div>

            <div className="bg-surface rounded-2xl border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Smartphone size={20} className="text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-text">Enter Code Manually</div>
                  <div className="text-xs text-muted">If QR scan isn't working</div>
                </div>
              </div>
              <button
                onClick={() => setMode('manual')}
                className="w-full h-11 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary/20 active:scale-[0.98] transition-all"
              >
                Enter Manually
              </button>
            </div>

            {/* Offline notice */}
            <div className="flex items-start gap-2 p-3 bg-muted/5 border border-border rounded-xl">
              <WifiOff size={14} className="text-muted flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted">
                This app works fully <strong className="text-text">offline</strong>. Once activated, you can log deliveries without internet. Data syncs automatically when you're back online.
              </p>
            </div>
          </div>
        )}

        {/* Scanner mode */}
        {mode === 'scan' && (
          <div className="bg-surface rounded-2xl border border-border p-5">
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl flex items-center gap-2 mb-4">
                <AlertCircle size={16} /><span>{err}</span>
              </div>
            )}
            {loading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 size={32} className="text-primary animate-spin" />
                <p className="text-sm text-muted">Activating...</p>
              </div>
            ) : (
              <>
                <Suspense fallback={<div className="text-center py-8 text-muted text-sm">Loading camera...</div>}>
                  <QrScanner open={true} onClose={() => setMode('choice')} onScan={handleQrScan} />
                </Suspense>
                <button onClick={() => { setErr(''); setMode('choice'); }}
                  className="w-full h-10 mt-3 text-muted text-sm hover:text-text transition-colors">
                  ← Back
                </button>
              </>
            )}
          </div>
        )}

        {/* Manual entry mode */}
        {mode === 'manual' && (
          <div className="bg-surface rounded-2xl border border-border p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold text-text mb-1">Activation Code</div>
              <div className="text-xs text-muted">Get this from your administrator</div>
            </div>
            {err && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl flex items-center gap-2 mb-4">
                <AlertCircle size={16} /><span>{err}</span>
              </div>
            )}
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '')); setErr('') }}
                placeholder="STP-ACT-XXXXXXXX"
                className="w-full h-12 px-3 rounded-xl border border-border bg-surface text-center text-base font-mono tracking-wider placeholder-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 uppercase"
                autoComplete="off"
                maxLength={20}
              />
              <button type="submit" disabled={loading || !code.trim()}
                className="w-full h-12 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? 'Activating...' : 'Activate'}
              </button>
            </form>
            <button onClick={() => { setErr(''); setMode('choice'); }}
              className="w-full h-10 mt-2 text-muted text-sm hover:text-text transition-colors">
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

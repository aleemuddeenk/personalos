import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, HelpCircle, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function SettingsPage() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [userName, setUserName] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        setWhatsappNumber(res.data.whatsapp_number || '');
        setUserName(res.data.user_name || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess(false);
      
      const payload = {
        whatsapp_number: whatsappNumber.replace('+', '').replace(/\s/g, '').trim(),
        user_name: userName.trim()
      };

      await api.post('/settings', payload);
      setSuccess(true);
      
      // Auto dismiss banner
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-semibold text-sm">Opening settings control panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <header>
        <h2 className="text-3xl font-extrabold tracking-tight text-white font-sans">
          System Control & Settings
        </h2>
        <p className="text-slate-400 font-medium mt-1">
          Configure user identities, WhatsApp destination targets, and view API metadata.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Profile Settings */}
        <div className="lg:col-span-1">
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-glow">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-6">
              <Settings size={20} className="text-indigo-400" />
              User Profile
            </h3>

            {success && (
              <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle size={14} className="shrink-0" />
                Settings saved successfully!
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-5">
              {/* User Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all font-sans"
                />
              </div>

              {/* WhatsApp number */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">WhatsApp Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15550199 (include country code)"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/80 transition-all font-mono"
                />
                <span className="block text-[10px] text-slate-500 mt-2 font-medium">
                  ⚠️ IMPORTANT: Numbers must only contain digits including country prefix. Remove symbols, spaces, or leading '+'. (e.g. 15550155555)
                </span>
              </div>

              {/* Save Trigger */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-glow hover:shadow-indigo-500/20 active:scale-98 transition-all duration-200 mt-2 cursor-pointer disabled:opacity-50"
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Info: WhatsApp Setup Instructions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cloud API Active State */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden flex items-start gap-4 shadow-glow">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-200">PersonalOS Webhook Engine is Listening</h4>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                FastAPI triggers are active. When scheduled routines fire, our system sends JSON packets to the WhatsApp Business API endpoint. Replies received by Meta are redirected directly back to our webhook parser.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 font-mono">
                <span className="bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg">VERIFY TOKEN: live in .env</span>
                <span className="bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg">STATUS: BOT LISTENING</span>
              </div>
            </div>
          </div>

          {/* Meta Setup Guide Accordion/Guide */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-glow space-y-4">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <HelpCircle size={18} className="text-indigo-400" />
              Meta WhatsApp API Integration Steps
            </h3>

            <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed font-semibold">
              <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl">
                <span className="block text-slate-200 font-bold uppercase tracking-wide">1. Fetch developer keys</span>
                <p className="mt-1">
                  Navigate to <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">Meta for Developers</a>. Register a Business App and select the WhatsApp product tool stack.
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl">
                <span className="block text-slate-200 font-bold uppercase tracking-wide">2. Establish Local Tunnels (Ngrok / Localtunnel)</span>
                <p className="mt-1">
                  Meta calls must ping a secure public URL. Forward local traffic in your terminal:
                  <code className="block bg-brand-dark border border-slate-800/80 p-2.5 rounded-xl text-[10px] text-indigo-400 mt-2 font-mono">
                    ngrok http 8000
                  </code>
                  Configure the generated public URL inside Meta App WhatsApp Configuration Webhook options:
                  <code className="block bg-brand-dark border border-slate-800/80 p-2.5 rounded-xl text-[10px] text-indigo-400 mt-2 font-mono">
                    https://[your-subdomain].ngrok-free.app/webhook/whatsapp
                  </code>
                </p>
              </div>

              <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-2xl">
                <span className="block text-slate-200 font-bold uppercase tracking-wide">3. Verify Token configuration</span>
                <p className="mt-1">
                  Input the custom verify token set in your backend `.env` file (e.g., `WHATSAPP_VERIFY_TOKEN=personalos_secret_123`) into the Meta verify input field to establish binding.
                </p>
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}

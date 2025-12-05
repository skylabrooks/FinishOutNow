import React, { useState } from 'react';
import { X, Building, User, Mail, Phone, Globe, Sparkles, Save } from 'lucide-react';
import { CompanyProfile, LeadCategory } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CompanyProfile;
  onSave: (profile: CompanyProfile) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, onSave }) => {
  const [formData, setFormData] = useState<CompanyProfile>(profile);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const categories = (Object.values(LeadCategory) as LeadCategory[]).filter(c => c !== LeadCategory.UNKNOWN && c !== LeadCategory.GENERAL);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Building size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Company Profile</h2>
                <p className="text-slate-400 text-sm">Configure your identity for AI personalization</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Name</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Acme Integrators LLC"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Primary Trade</label>
                    <select 
                        value={formData.industry}
                        onChange={e => setFormData({...formData, industry: e.target.value as LeadCategory})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact Name</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="text" 
                            value={formData.contactName}
                            onChange={e => setFormData({...formData, contactName: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Jane Doe"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                            type="email" 
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="jane@acme.com"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-400" />
                    Value Proposition / Secret Sauce
                </label>
                <textarea 
                    value={formData.valueProp}
                    onChange={e => setFormData({...formData, valueProp: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                    placeholder="e.g. We specialize in rapid 48-hour turnarounds for retail grand openings and offer 0% financing for 12 months."
                />
                <p className="text-xs text-slate-500">The AI will use this to customize the outreach pitch for every lead.</p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button 
                    type="button" 
                    onClick={onClose}
                    className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                >
                    Cancel
                </button>
                <button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all hover:scale-105"
                >
                    <Save size={16} />
                    Save Profile
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
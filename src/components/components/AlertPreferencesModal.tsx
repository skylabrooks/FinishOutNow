/**
 * Alert Preferences Modal
 * Configuration UI for user notification preferences
 */

import React, { useState } from 'react';
import { UserPreferences, LeadCategory, NotificationChannel, PermitType } from '../types';
import { Bell, X, Check, MapPin, DollarSign, BarChart3, Save } from 'lucide-react';

interface AlertPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences?: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

const AlertPreferencesModal: React.FC<AlertPreferencesModalProps> = ({
  isOpen,
  onClose,
  currentPreferences,
  onSave
}) => {
  const [enabled, setEnabled] = useState(currentPreferences?.enabled ?? true);
  const [channels, setChannels] = useState<NotificationChannel[]>(
    currentPreferences?.notificationChannels ?? ['email', 'in_app']
  );
  const [categories, setCategories] = useState<LeadCategory[]>(
    currentPreferences?.categories ?? []
  );
  const [permitTypes, setPermitTypes] = useState<PermitType[]>(
    currentPreferences?.permitTypes ?? []
  );
  const [minLeadScore, setMinLeadScore] = useState(
    currentPreferences?.scoringThresholds?.minLeadScore ?? 60
  );
  const [minValuation, setMinValuation] = useState(
    currentPreferences?.scoringThresholds?.minValuation ?? 0
  );
  const [maxValuation, setMaxValuation] = useState(
    currentPreferences?.scoringThresholds?.maxValuation ?? 10000000
  );
  const [cities, setCities] = useState<string[]>(
    currentPreferences?.geoFilters?.cities ?? []
  );
  const [radiusMiles, setRadiusMiles] = useState(
    currentPreferences?.geoFilters?.radiusMiles ?? 50
  );

  if (!isOpen) return null;

  const handleSave = () => {
    const preferences: UserPreferences = {
      userId: currentPreferences?.userId ?? 'current_user',
      enabled,
      notificationChannels: channels,
      categories: categories.length > 0 ? categories : undefined,
      permitTypes: permitTypes.length > 0 ? permitTypes : undefined,
      scoringThresholds: {
        minLeadScore,
        minValuation,
        maxValuation
      },
      geoFilters: {
        cities: cities.length > 0 ? cities : undefined,
        radiusMiles
      },
      createdAt: currentPreferences?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(preferences);
    onClose();
  };

  const toggleChannel = (channel: NotificationChannel) => {
    setChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const toggleCategory = (category: LeadCategory) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleCity = (city: string) => {
    setCities(prev =>
      prev.includes(city)
        ? prev.filter(c => c !== city)
        : [...prev, city]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20 text-indigo-400">
                <Bell size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white">Alert Preferences</h2>
                <p className="text-slate-400 text-sm">Configure how and when you get notified</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
          
          {/* Enable/Disable */}
          <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
            <div>
                <h3 className="text-white font-medium">Enable Alerts</h3>
                <p className="text-slate-400 text-sm">Pause all notifications temporarily</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Notification Channels */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Bell size={14} /> Notification Channels
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(['email', 'sms', 'push', 'in_app'] as NotificationChannel[]).map(channel => (
                <label key={channel} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    channels.includes(channel) 
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-white' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}>
                  <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      channels.includes(channel) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'
                  }`}>
                      {channels.includes(channel) && <Check size={12} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                  />
                  <span className="font-medium text-sm">{channel.replace('_', ' ').toUpperCase()}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Lead Categories */}
          <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <BarChart3 size={14} /> Lead Categories
                </h3>
                <span className="text-xs text-slate-500">Select specific or leave empty for all</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(LeadCategory).map(category => (
                <label key={category} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-sm ${
                    categories.includes(category) 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                    checked={categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          {/* Cities */}
          <div>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <MapPin size={14} /> Target Cities
                </h3>
                <span className="text-xs text-slate-500">Leave empty for all</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Dallas', 'Fort Worth', 'Plano', 'Frisco', 'Irving', 'Arlington'].map(city => (
                <label key={city} className={`px-3 py-1.5 rounded-full border text-sm font-medium cursor-pointer transition-all ${
                    cities.includes(city)
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={cities.includes(city)}
                    onChange={() => toggleCity(city)}
                  />
                  {city}
                </label>
              ))}
            </div>
          </div>

          {/* Scoring Thresholds */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <DollarSign size={14} /> Thresholds
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Min Lead Score (0-100)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={minLeadScore}
                        onChange={e => setMinLeadScore(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Min Valuation ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={minValuation}
                        onChange={e => setMinValuation(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-slate-400">Max Valuation ($)</label>
                    <input
                        type="number"
                        min="0"
                        step="1000"
                        value={maxValuation}
                        onChange={e => setMaxValuation(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
            </div>
          </div>

          {/* Geographic Radius */}
          <div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <MapPin size={14} /> Search Radius
            </h3>
            <div className="space-y-1">
                <label className="text-xs text-slate-400">Radius (miles)</label>
                <input
                    type="number"
                    min="1"
                    max="500"
                    value={radiusMiles}
                    onChange={e => setRadiusMiles(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900 shrink-0 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/20 border border-indigo-500/50 flex items-center gap-2 transition-all">
            <Save size={18} />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertPreferencesModal;

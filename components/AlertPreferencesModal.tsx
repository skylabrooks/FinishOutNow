/**
 * Alert Preferences Modal
 * Configuration UI for user notification preferences
 */

import React, { useState } from 'react';
import { UserPreferences, LeadCategory, NotificationChannel, PermitType } from '../types';

interface AlertPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences?: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

export const AlertPreferencesModal: React.FC<AlertPreferencesModalProps> = ({
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
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>Alert Preferences</h2>
          <button onClick={onClose} style={closeButtonStyle}>×</button>
        </div>

        <div style={bodyStyle}>
          {/* Enable/Disable */}
          <div style={sectionStyle}>
            <label style={labelStyle}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Enable Alerts
            </label>
          </div>

          {/* Notification Channels */}
          <div style={sectionStyle}>
            <h3 style={subheadingStyle}>Notification Channels</h3>
            <div style={checkboxGroupStyle}>
              {(['email', 'sms', 'push', 'in_app'] as NotificationChannel[]).map(channel => (
                <label key={channel} style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggleChannel(channel)}
                    style={{ marginRight: '8px' }}
                  />
                  {channel.replace('_', ' ').toUpperCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Lead Categories */}
          <div style={sectionStyle}>
            <h3 style={subheadingStyle}>Lead Categories</h3>
            <p style={hintStyle}>Leave empty to receive all categories</p>
            <div style={checkboxGroupStyle}>
              {Object.values(LeadCategory).map(category => (
                <label key={category} style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    style={{ marginRight: '8px' }}
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          {/* Cities */}
          <div style={sectionStyle}>
            <h3 style={subheadingStyle}>Cities</h3>
            <p style={hintStyle}>Leave empty to include all cities</p>
            <div style={checkboxGroupStyle}>
              {['Dallas', 'Fort Worth', 'Plano', 'Frisco', 'Irving', 'Arlington'].map(city => (
                <label key={city} style={checkboxLabelStyle}>
                  <input
                    type="checkbox"
                    checked={cities.includes(city)}
                    onChange={() => toggleCity(city)}
                    style={{ marginRight: '8px' }}
                  />
                  {city}
                </label>
              ))}
            </div>
          </div>

          {/* Scoring Thresholds */}
          <div style={sectionStyle}>
            <h3 style={subheadingStyle}>Scoring Thresholds</h3>
            
            <div style={inputGroupStyle}>
              <label style={inputLabelStyle}>
                Minimum Lead Score (0-100)
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minLeadScore}
                  onChange={e => setMinLeadScore(Number(e.target.value))}
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={inputGroupStyle}>
              <label style={inputLabelStyle}>
                Minimum Valuation ($)
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={minValuation}
                  onChange={e => setMinValuation(Number(e.target.value))}
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={inputGroupStyle}>
              <label style={inputLabelStyle}>
                Maximum Valuation ($)
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={maxValuation}
                  onChange={e => setMaxValuation(Number(e.target.value))}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>

          {/* Geographic Radius */}
          <div style={sectionStyle}>
            <h3 style={subheadingStyle}>Search Radius</h3>
            <div style={inputGroupStyle}>
              <label style={inputLabelStyle}>
                Radius (miles)
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={radiusMiles}
                  onChange={e => setRadiusMiles(Number(e.target.value))}
                  style={inputStyle}
                />
              </label>
            </div>
          </div>
        </div>

        <div style={footerStyle}>
          <button onClick={onClose} style={cancelButtonStyle}>
            Cancel
          </button>
          <button onClick={handleSave} style={saveButtonStyle}>
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

// Styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '600px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
};

const headerStyle: React.CSSProperties = {
  padding: '20px',
  borderBottom: '1px solid #dee2e6',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const closeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '32px',
  cursor: 'pointer',
  color: '#6c757d',
  padding: 0,
  lineHeight: 1
};

const bodyStyle: React.CSSProperties = {
  padding: '20px',
  overflowY: 'auto',
  flex: 1
};

const sectionStyle: React.CSSProperties = {
  marginBottom: '24px'
};

const subheadingStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '12px'
};

const hintStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#6c757d',
  marginBottom: '8px'
};

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  cursor: 'pointer'
};

const checkboxGroupStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '14px',
  cursor: 'pointer'
};

const inputGroupStyle: React.CSSProperties = {
  marginBottom: '16px'
};

const inputLabelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  fontSize: '14px',
  fontWeight: 500
};

const inputStyle: React.CSSProperties = {
  marginTop: '4px',
  padding: '8px',
  border: '1px solid #ced4da',
  borderRadius: '4px',
  fontSize: '14px'
};

const footerStyle: React.CSSProperties = {
  padding: '16px 20px',
  borderTop: '1px solid #dee2e6',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px'
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: '1px solid #ced4da',
  borderRadius: '4px',
  background: 'white',
  cursor: 'pointer',
  fontSize: '14px'
};

const saveButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  border: 'none',
  borderRadius: '4px',
  background: '#007bff',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 600
};

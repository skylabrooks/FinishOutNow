import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Calendar, Copy, Check, AlertCircle, Clock } from 'lucide-react';
import { EnrichedPermit, LeadClaim, CallAttempt, AppointmentDetails, CompanyProfile } from '../types';
import { generateFirstContactEmail, personalizeEmailTemplate } from '../services/emailTemplateService';
import { 
  addCallAttempt, 
  scheduleAppointment, 
  getAppointmentStats,
  canMakeCallAttempt 
} from '../services/appointmentSettingService';
import {
  saveEmailTemplate,
  markEmailAsSent,
  addCallAttemptToLead,
  scheduleAppointmentForLead,
  updateAppointmentSetting
} from '../services/firebaseLeads';

interface AppointmentSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: EnrichedPermit;
  claim: LeadClaim;
  onUpdate: (updatedClaim: LeadClaim) => void;
  companyProfile?: CompanyProfile;
}

export default function AppointmentSettingModal({
  isOpen,
  onClose,
  lead,
  claim,
  onUpdate,
  companyProfile
}: AppointmentSettingModalProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'calls' | 'appointment'>('email');
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [localClaim, setLocalClaim] = useState<LeadClaim>(claim);

  // Call attempt form
  const [callOutcome, setCallOutcome] = useState<CallAttempt['outcome']>('no-answer');
  const [callNotes, setCallNotes] = useState('');
  const [repName, setRepName] = useState(claim.assignedRepName || '');

  // Appointment form
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentType, setAppointmentType] = useState<'phone-call' | 'in-person' | 'video-call'>('phone-call');
  const [appointmentNotes, setAppointmentNotes] = useState('');

  const stats = getAppointmentStats(localClaim);

  useEffect(() => {
    setLocalClaim(claim);
  }, [claim]);

  useEffect(() => {
    // Load email template if already generated
    if (claim.emailTemplate) {
      const parts = claim.emailTemplate.split('\n\n');
      if (parts[0].startsWith('Subject:')) {
        setEmailSubject(parts[0].replace('Subject: ', ''));
        setEmailTemplate(parts.slice(1).join('\n\n'));
      } else {
        setEmailTemplate(claim.emailTemplate);
      }
    }
  }, [claim.emailTemplate]);

  const handleGenerateEmail = async () => {
    setIsGenerating(true);
    try {
      const template = await generateFirstContactEmail(lead, companyProfile);
      const personalized = personalizeEmailTemplate(template, companyProfile);
      
      setEmailSubject(personalized.subject);
      setEmailTemplate(personalized.body);

      // Save to Firebase
      const fullTemplate = `Subject: ${personalized.subject}\n\n${personalized.body}`;
      await saveEmailTemplate(claim.id, fullTemplate);
      
      const updated = { ...localClaim, emailTemplate: fullTemplate, appointmentStatus: 'email-generated' as const };
      setLocalClaim(updated);
      onUpdate(updated);
      
    } catch (error) {
      console.error('Failed to generate email:', error);
      alert('Failed to generate email template. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyEmail = () => {
    const fullEmail = `Subject: ${emailSubject}\n\n${emailTemplate}`;
    navigator.clipboard.writeText(fullEmail);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleMarkEmailSent = async () => {
    try {
      await markEmailAsSent(claim.id);
      const updated = { ...localClaim, emailSentAt: new Date().toISOString(), appointmentStatus: 'email-sent' as const };
      setLocalClaim(updated);
      onUpdate(updated);
      setActiveTab('calls');
    } catch (error) {
      console.error('Failed to mark email as sent:', error);
      alert('Failed to update status. Please try again.');
    }
  };

  const handleAddCallAttempt = async () => {
    const canCall = canMakeCallAttempt(localClaim);
    if (!canCall.canCall) {
      alert(canCall.reason);
      return;
    }

    try {
      const result = addCallAttempt(localClaim, callOutcome, callNotes, repName);
      
      if (result.error) {
        alert(result.error);
        return;
      }

      // Save to Firebase
      const newAttempt: CallAttempt = {
        attemptNumber: (localClaim.callAttempts?.length || 0) + 1,
        timestamp: new Date().toISOString(),
        outcome: callOutcome,
        notes: callNotes,
        repName
      };

      await addCallAttemptToLead(claim.id, newAttempt, result.updatedClaim.appointmentStatus!);
      
      setLocalClaim(result.updatedClaim);
      onUpdate(result.updatedClaim);
      
      // Reset form
      setCallNotes('');
      setCallOutcome('no-answer');

      // If appointment set, switch to appointment tab
      if (callOutcome === 'appointment-set') {
        setActiveTab('appointment');
      }
      
    } catch (error) {
      console.error('Failed to add call attempt:', error);
      alert('Failed to record call attempt. Please try again.');
    }
  };

  const handleScheduleAppointment = async () => {
    if (!appointmentDate || !appointmentTime) {
      alert('Please enter appointment date and time');
      return;
    }

    try {
      const appointmentDetails: AppointmentDetails = {
        scheduledDate: appointmentDate,
        scheduledTime: appointmentTime,
        appointmentType,
        notes: appointmentNotes,
        confirmedBy: repName
      };

      const updated = scheduleAppointment(localClaim, appointmentDetails);
      await scheduleAppointmentForLead(claim.id, appointmentDetails);
      
      setLocalClaim(updated);
      onUpdate(updated);
      
      alert('Appointment scheduled successfully!');
      
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
      alert('Failed to schedule appointment. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Appointment Setting</h2>
            <p className="text-sm text-slate-400 mt-1">
              {lead.applicant || 'Unknown Business'} • {lead.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Status Banner */}
        <div className="px-6 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-blue-400" />
                <span className="text-sm text-slate-300">
                  Attempts: <span className="font-semibold text-white">{stats.totalAttempts}/{stats.maxAttempts}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                <span className="text-sm text-slate-300">
                  Days Remaining: <span className="font-semibold text-white">{stats.daysRemaining}</span>
                </span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {stats.status.replace(/-/g, ' ').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 px-6">
          <button
            onClick={() => setActiveTab('email')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'email'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mail size={16} className="inline mr-2" />
            Email Template
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'calls'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Phone size={16} className="inline mr-2" />
            Call Tracking
          </button>
          <button
            onClick={() => setActiveTab('appointment')}
            className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'appointment'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={16} className="inline mr-2" />
            Appointment
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              {!emailTemplate ? (
                <div className="text-center py-12">
                  <Mail size={48} className="mx-auto text-slate-600 mb-4" />
                  <p className="text-slate-400 mb-6">
                    Generate a high-converting first contact email using AI
                  </p>
                  <button
                    onClick={handleGenerateEmail}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Email Template'}
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Subject</label>
                    <div className="bg-slate-900 p-3 rounded border border-slate-600 text-white">
                      {emailSubject}
                    </div>
                  </div>

                  <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Email Body</label>
                    <div className="bg-slate-900 p-4 rounded border border-slate-600 text-white whitespace-pre-wrap font-mono text-sm max-h-96 overflow-y-auto">
                      {emailTemplate}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCopyEmail}
                      className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isCopied ? (
                        <>
                          <Check size={20} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={20} />
                          Copy to Clipboard
                        </>
                      )}
                    </button>
                    
                    {!localClaim.emailSentAt && (
                      <button
                        onClick={handleMarkEmailSent}
                        className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                      >
                        Mark as Sent
                      </button>
                    )}
                  </div>

                  {localClaim.emailSentAt && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start gap-2">
                      <Check size={20} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-400">Email Sent</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Marked as sent on {new Date(localClaim.emailSentAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Calls Tab */}
          {activeTab === 'calls' && (
            <div className="space-y-6">
              {/* Add Call Attempt Form */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">Record Call Attempt</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Rep Name</label>
                    <input
                      type="text"
                      value={repName}
                      onChange={(e) => setRepName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      placeholder="E BookGov Rep Name"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Outcome</label>
                    <select
                      value={callOutcome}
                      onChange={(e) => setCallOutcome(e.target.value as CallAttempt['outcome'])}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                    >
                      <option value="no-answer">No Answer</option>
                      <option value="voicemail">Voicemail</option>
                      <option value="spoke-with-contact">Spoke with Contact</option>
                      <option value="wrong-number">Wrong Number</option>
                      <option value="callback-requested">Callback Requested</option>
                      <option value="appointment-set">Appointment Set</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Notes</label>
                    <textarea
                      value={callNotes}
                      onChange={(e) => setCallNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      placeholder="Call notes..."
                    />
                  </div>

                  <button
                    onClick={handleAddCallAttempt}
                    disabled={!stats.canMakeAttempt}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Record Call Attempt
                  </button>

                  {!stats.canMakeAttempt && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-amber-400">
                        {canMakeCallAttempt(localClaim).reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Call History */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Call History</h3>
                {localClaim.callAttempts && localClaim.callAttempts.length > 0 ? (
                  <div className="space-y-2">
                    {localClaim.callAttempts.map((attempt, index) => (
                      <div key={index} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-medium text-white">
                                Attempt #{attempt.attemptNumber}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                attempt.outcome === 'appointment-set' 
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : attempt.outcome === 'spoke-with-contact'
                                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                  : 'bg-slate-700 text-slate-300'
                              }`}>
                                {attempt.outcome.replace(/-/g, ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-1">
                              {new Date(attempt.timestamp).toLocaleString()}
                              {attempt.repName && ` • ${attempt.repName}`}
                            </p>
                            {attempt.notes && (
                              <p className="text-sm text-slate-300 mt-2">{attempt.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    No call attempts recorded yet
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appointment Tab */}
          {activeTab === 'appointment' && (
            <div className="space-y-6">
              {!localClaim.appointmentDetails ? (
                <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Schedule Appointment</h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Date</label>
                        <input
                          type="date"
                          value={appointmentDate}
                          onChange={(e) => setAppointmentDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">Time</label>
                        <input
                          type="time"
                          value={appointmentTime}
                          onChange={(e) => setAppointmentTime(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Type</label>
                      <select
                        value={appointmentType}
                        onChange={(e) => setAppointmentType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                      >
                        <option value="phone-call">Phone Call</option>
                        <option value="in-person">In-Person Meeting</option>
                        <option value="video-call">Video Call</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Notes</label>
                      <textarea
                        value={appointmentNotes}
                        onChange={(e) => setAppointmentNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white"
                        placeholder="Meeting agenda, location, etc..."
                      />
                    </div>

                    <button
                      onClick={handleScheduleAppointment}
                      className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Schedule Appointment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar size={24} className="text-green-400" />
                    <h3 className="text-lg font-semibold text-green-400">Appointment Scheduled</h3>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="text-white font-medium">{localClaim.appointmentDetails.scheduledDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time:</span>
                      <span className="text-white font-medium">{localClaim.appointmentDetails.scheduledTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Type:</span>
                      <span className="text-white font-medium capitalize">
                        {localClaim.appointmentDetails.appointmentType?.replace(/-/g, ' ')}
                      </span>
                    </div>
                    {localClaim.appointmentDetails.notes && (
                      <div>
                        <span className="text-slate-400 block mb-1">Notes:</span>
                        <p className="text-white">{localClaim.appointmentDetails.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

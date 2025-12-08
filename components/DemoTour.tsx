import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Building,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
  Map,
  Filter,
  Download,
  Mail,
  Calendar,
  Target
} from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  action: string;
  icon: React.ReactNode;
  highlight?: string;
}

interface PermitDemo {
  id: string;
  address: string;
  city: string;
  description: string;
  value: number;
  status: 'new' | 'qualified' | 'contacted';
  score: number;
  triggers: string[];
}

const DemoTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<PermitDemo | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const demoPermits: PermitDemo[] = [
    {
      id: '1',
      address: '4500 N Macarthur Blvd, Suite 300',
      city: 'Irving',
      description: 'Commercial Tenant Improvement - Suite 300 (15,000 sq ft). New lighting, HVAC, flooring, access control system installation',
      value: 385000,
      status: 'new',
      score: 94,
      triggers: ['Access Control', 'Tenant Improvement', 'Electrical Work', 'HVAC']
    },
    {
      id: '2',
      address: '2300 N Dallas Tollway, Suite 200',
      city: 'Dallas',
      description: 'New security system installation for financial services office. Phase 1: Cameras, access control, monitoring center',
      value: 250000,
      status: 'qualified',
      score: 88,
      triggers: ['Security System', 'Certificate of Occupancy', 'Access Control']
    },
    {
      id: '3',
      address: '8800 N Central Expwy, Floor 4',
      city: 'Dallas',
      description: 'Tech startup office build-out. Full interior renovation with IT infrastructure, signage, parking lot improvements',
      value: 520000,
      status: 'contacted',
      score: 91,
      triggers: ['New Construction', 'Interior Renovation', 'Certificate of Occupancy']
    },
    {
      id: '4',
      address: '1234 W 15th St, Building A',
      city: 'Fort Worth',
      description: 'Industrial warehouse renovation. Roof repair, electrical upgrade, new HVAC system, lighting retrofit',
      value: 425000,
      status: 'new',
      score: 82,
      triggers: ['Roof Work', 'Electrical Upgrade', 'HVAC', 'Industrial']
    }
  ];

  const steps: Step[] = [
    {
      id: 'overview',
      title: 'Welcome to FinishOutNow',
      description: 'The AI-powered commercial lead intelligence platform that identifies high-value construction opportunities in Dallas-Fort Worth',
      action: 'Automatically discovers permits from 5 cities in real-time',
      icon: <Target className="w-8 h-8" />,
      highlight: 'overview-card'
    },
    {
      id: 'data-collection',
      title: 'Real-Time Data Collection',
      description: 'The platform continuously monitors permit databases from Dallas, Fort Worth, Arlington, Plano, and Irving',
      action: 'New permits appear within minutes of filing',
      icon: <Zap className="w-8 h-8" />,
      highlight: 'data-collection'
    },
    {
      id: 'normalization',
      title: 'Intelligent Data Cleaning',
      description: 'Raw permit data is messy. We normalize addresses, standardize project types, and extract key details',
      action: 'Raw → Cleaned → Ready to analyze',
      icon: <Filter className="w-8 h-8" />,
      highlight: 'normalization'
    },
    {
      id: 'ai-analysis',
      title: 'AI-Powered Analysis',
      description: 'Gemini 2.5 analyzes each permit and scores opportunities based on your industry triggers',
      action: 'Each permit gets a commercial potential score (0-100)',
      icon: <AlertCircle className="w-8 h-8" />,
      highlight: 'ai-analysis'
    },
    {
      id: 'permits-list',
      title: 'Qualified Opportunities',
      description: 'See all qualified permits with AI analysis scores, commercial triggers, and project details',
      action: 'Click on any permit to see full analysis',
      icon: <Building className="w-8 h-8" />,
      highlight: 'permits-list'
    },
    {
      id: 'scoring',
      title: 'Smart Scoring System',
      description: 'Each opportunity is scored based on match to your company profile and industry triggers',
      action: '94/100: High-probability commercial opportunity',
      icon: <TrendingUp className="w-8 h-8" />,
      highlight: 'scoring-demo'
    },
    {
      id: 'map-view',
      title: 'Geographic Intelligence',
      description: 'See all leads on an interactive map with filtering by city, project type, and value',
      action: 'Click "View Map" to explore spatial distribution',
      icon: <Map className="w-8 h-8" />,
      highlight: 'map-button'
    },
    {
      id: 'analytics',
      title: 'Real-Time Analytics',
      description: 'Track opportunities by city, industry trigger, and project value with dynamic charts',
      action: 'Click "View Analytics" to see trends',
      icon: <BarChart3 className="w-8 h-8" />,
      highlight: 'analytics-button'
    },
    {
      id: 'claiming',
      title: 'Lead Management',
      description: 'Claim leads, track contact history, and manage your sales pipeline directly in the app',
      action: 'Never lose track of an opportunity again',
      icon: <CheckCircle className="w-8 h-8" />,
      highlight: 'claim-button'
    },
    {
      id: 'outreach',
      title: 'One-Click Outreach',
      description: 'Generate customized emails, calendar invites, and export leads to CSV for your CRM',
      action: 'Seamless integration with your sales workflow',
      icon: <Mail className="w-8 h-8" />,
      highlight: 'outreach-buttons'
    },
    {
      id: 'finish',
      title: 'Ready to Transform Your Lead Generation?',
      description: 'FinishOutNow turns public permit data into qualified sales opportunities with AI precision',
      action: 'Start discovering high-value leads today',
      icon: <Zap className="w-8 h-8" />,
      highlight: 'finish-card'
    }
  ];

  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setSelectedPermit(null);
    setShowMap(false);
    setShowAnalytics(false);
  };

  React.useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      handleNext();
    }, 4000);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const getHighlightClass = (id: string) => {
    if (currentStepData.highlight === id) {
      return 'ring-2 ring-blue-500 ring-offset-2 shadow-lg scale-105 transition-all';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-800/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">FinishOutNow</h1>
                <p className="text-sm text-slate-400">Interactive Product Demo</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-slate-600 rounded transition-colors text-slate-300 hover:text-white"
                title={isPlaying ? 'Pause demo' : 'Play demo'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-slate-600 rounded transition-colors text-slate-300 hover:text-white"
                title="Reset demo"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Step Info */}
          <div className="lg:col-span-1">
            <div className={`bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6 transition-all ${getHighlightClass('overview-card')}`}
              id="overview-card">
              <div className="flex items-start gap-4">
                <div className="text-blue-200">{currentStepData.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{currentStepData.title}</h2>
                  <p className="text-blue-100 text-sm mb-4">{currentStepData.description}</p>
                  <div className="bg-blue-500/30 border border-blue-400 rounded px-3 py-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      {currentStepData.action}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Progress */}
            <div className="bg-slate-700 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-300">Progress</span>
                <span className="text-sm text-slate-400">{currentStep + 1} of {steps.length}</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={currentStep === steps.length - 1}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Right: Demo Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Data Collection Demo */}
            {['overview', 'data-collection', 'normalization'].includes(currentStepData.id) && (
              <div
                className={`bg-slate-700 rounded-lg p-6 transition-all ${getHighlightClass('data-collection')}`}
                id="data-collection"
              >
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  Real-Time Data Sources
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Dallas Open Data', 'Fort Worth', 'Arlington', 'Plano', 'Irving', 'Custom APIs'].map((city) => (
                    <div key={city} className="bg-slate-600 rounded p-3 flex items-center gap-2 hover:bg-slate-500 transition-colors cursor-pointer">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-200">{city}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Normalization Demo */}
            {currentStepData.id === 'normalization' && (
              <div
                className={`bg-slate-700 rounded-lg p-6 transition-all ${getHighlightClass('normalization')}`}
                id="normalization"
              >
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-yellow-400" />
                  Data Normalization Example
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Before:</p>
                    <div className="bg-red-900/20 border border-red-700 rounded p-3 text-sm text-slate-300 font-mono">
                      "Comm TI suite 400 new HVAC paint flooring lighting"
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <div className="text-slate-400">↓</div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-2">After:</p>
                    <div className="bg-green-900/20 border border-green-700 rounded p-3 text-sm text-slate-300 font-mono space-y-1">
                      <div><span className="text-green-400">projectType:</span> "Tenant Improvement"</div>
                      <div><span className="text-green-400">description:</span> "Suite 400 - Full Interior"</div>
                      <div><span className="text-green-400">value:</span> 275000</div>
                      <div><span className="text-green-400">triggers:</span> ["HVAC", "Flooring", "Lighting"]</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Analysis Demo */}
            {currentStepData.id === 'ai-analysis' && (
              <div
                className={`bg-slate-700 rounded-lg p-6 transition-all ${getHighlightClass('ai-analysis')}`}
                id="ai-analysis"
              >
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-400" />
                  Gemini 2.5 AI Analysis
                </h3>
                <div className="bg-slate-600 rounded p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Commercial Trigger Detected:</span>
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs font-medium">
                      Access Control System
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Project Type:</span>
                    <span className="text-slate-200">Tenant Improvement</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Confidence Score:</span>
                    <span className="text-cyan-300 font-bold">94/100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Recommended Action:</span>
                    <span className="text-yellow-300">Contact within 48 hours</span>
                  </div>
                </div>
              </div>
            )}

            {/* Permits List */}
            {['permits-list', 'scoring', 'claiming', 'outreach'].includes(currentStepData.id) && (
              <div
                className={`bg-slate-700 rounded-lg p-6 transition-all ${getHighlightClass('permits-list')}`}
                id="permits-list"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Building className="w-5 h-5 text-cyan-400" />
                    Qualified Opportunities ({demoPermits.length})
                  </h3>
                </div>

                <div className="space-y-3">
                  {demoPermits.map((permit) => (
                    <div
                      key={permit.id}
                      onClick={() => setSelectedPermit(selectedPermit?.id === permit.id ? null : permit)}
                      className={`bg-slate-600 rounded-lg p-4 cursor-pointer hover:bg-slate-500 transition-all transform hover:scale-105 ${
                        selectedPermit?.id === permit.id ? 'ring-2 ring-blue-500' : ''
                      } ${getHighlightClass('permit-' + permit.id)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-semibold text-sm">{permit.address}</h4>
                          <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3" />
                            {permit.city}
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-bold ${
                          permit.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
                          permit.status === 'qualified' ? 'bg-green-500/20 text-green-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {permit.status === 'new' ? '🟦 New' : permit.status === 'qualified' ? '🟩 Qualified' : '✅ Contacted'}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mb-3">{permit.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1 text-slate-400">
                            <DollarSign className="w-3 h-3" />
                            ${(permit.value / 1000).toFixed(0)}K
                          </div>
                          <div className={`font-bold ${permit.score >= 90 ? 'text-green-400' : permit.score >= 80 ? 'text-yellow-400' : 'text-orange-400'}`}>
                            Score: {permit.score}/100
                          </div>
                        </div>
                      </div>

                      {selectedPermit?.id === permit.id && (
                        <div className="mt-4 pt-4 border-t border-slate-500 space-y-3">
                          <div>
                            <p className="text-xs text-slate-400 mb-2">Commercial Triggers:</p>
                            <div className="flex flex-wrap gap-2">
                              {permit.triggers.map((trigger) => (
                                <span key={trigger} className="bg-blue-500/30 text-blue-300 px-2 py-1 rounded text-xs">
                                  {trigger}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div
                            className={`flex gap-2 ${getHighlightClass('outreach-buttons')}`}
                            id="outreach-buttons"
                          >
                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs py-2 rounded transition-colors flex items-center justify-center gap-1 ${getHighlightClass('claim-button')}" id="claim-button">
                              <CheckCircle className="w-3 h-3" />
                              Claim Lead
                            </button>
                            <button className="flex-1 bg-slate-500 hover:bg-slate-400 text-white text-xs py-2 rounded transition-colors flex items-center justify-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </button>
                            <button className="flex-1 bg-slate-500 hover:bg-slate-400 text-white text-xs py-2 rounded transition-colors flex items-center justify-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Calendar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map & Analytics Buttons */}
            {['map-view', 'analytics'].includes(currentStepData.id) && (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`bg-slate-700 hover:bg-slate-600 text-white p-6 rounded-lg transition-all transform hover:scale-105 flex flex-col items-center justify-center gap-3 ${getHighlightClass('map-button')}`}
                  id="map-button"
                >
                  <Map className="w-8 h-8 text-cyan-400" />
                  <span className="font-semibold">View Map</span>
                  <span className="text-xs text-slate-400">See leads by location</span>
                </button>
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className={`bg-slate-700 hover:bg-slate-600 text-white p-6 rounded-lg transition-all transform hover:scale-105 flex flex-col items-center justify-center gap-3 ${getHighlightClass('analytics-button')}`}
                  id="analytics-button"
                >
                  <BarChart3 className="w-8 h-8 text-green-400" />
                  <span className="font-semibold">View Analytics</span>
                  <span className="text-xs text-slate-400">Analyze trends</span>
                </button>
              </div>
            )}

            {/* Map Demo */}
            {showMap && (
              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Map className="w-5 h-5 text-cyan-400" />
                  Geographic Distribution
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { city: 'Dallas', count: 12, color: 'from-blue-500 to-blue-600' },
                    { city: 'Fort Worth', count: 8, color: 'from-cyan-500 to-cyan-600' },
                    { city: 'Arlington', count: 5, color: 'from-green-500 to-green-600' },
                    { city: 'Irving', count: 9, color: 'from-purple-500 to-purple-600' }
                  ].map((item) => (
                    <div key={item.city} className={`bg-gradient-to-br ${item.color} rounded-lg p-4 text-white`}>
                      <p className="font-bold text-lg">{item.count}</p>
                      <p className="text-sm text-white/80">{item.city}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Demo */}
            {showAnalytics && (
              <div className="bg-slate-700 rounded-lg p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  Opportunity Analytics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300">Tenant Improvement</span>
                      <span className="text-slate-400">45%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300">Security Systems</span>
                      <span className="text-slate-400">32%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: '32%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-slate-300">HVAC & MEP</span>
                      <span className="text-slate-400">23%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '23%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Finish Screen */}
            {currentStepData.id === 'finish' && (
              <div
                className={`bg-gradient-to-br from-green-600 to-cyan-600 rounded-lg p-8 text-center text-white transition-all ${getHighlightClass('finish-card')}`}
                id="finish-card"
              >
                <CheckCircle className="w-16 h-16 mx-auto mb-4 animate-bounce" />
                <h3 className="text-2xl font-bold mb-3">Demo Complete!</h3>
                <p className="text-white/90 mb-6">
                  You've seen how FinishOutNow transforms public permit data into actionable sales intelligence.
                </p>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-white/80">Key Features:</p>
                  <ul className="text-sm text-white/80 space-y-2">
                    <li>✓ Real-time permit monitoring across 5 cities</li>
                    <li>✓ AI-powered opportunity scoring</li>
                    <li>✓ Interactive map and analytics</li>
                    <li>✓ One-click lead management</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 bg-slate-800/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-slate-400">
            <p>© 2025 FinishOutNow. AI-Powered Commercial Lead Intelligence.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-300 transition-colors">Docs</a>
              <a href="#" className="hover:text-slate-300 transition-colors">GitHub</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoTour;

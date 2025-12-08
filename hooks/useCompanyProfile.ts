import { useState, useEffect } from 'react';
import { CompanyProfile, LeadCategory } from '../types';

const DEFAULT_PROFILE: CompanyProfile = {
  name: "Apex Security Integrators",
  industry: LeadCategory.SECURITY,
  contactName: "Mike Ross",
  phone: "214-555-0199",
  website: "www.apexdfw.com",
  valueProp: "We specialize in rapid access control deployment for high-security commercial tenants."
};

const STORAGE_KEY_PROFILE = 'finishOutNow_profile_v1';

export function useCompanyProfile() {
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch (e) {
      return DEFAULT_PROFILE;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(companyProfile));
  }, [companyProfile]);

  return {
    companyProfile,
    setCompanyProfile,
  };
}

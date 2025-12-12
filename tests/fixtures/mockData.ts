
import { Permit } from '../types';

export const MOCK_PERMITS: Permit[] = [
  {
    id: '1',
    permitNumber: '2402-19482',
    permitType: 'Commercial Remodel',
    address: '1900 Pearl St, Dallas, TX 75201',
    city: 'Dallas',
    appliedDate: '2025-05-12',
    description: 'Tenant layout for "TechFlow Solutions" Suite 400. Demolition of existing partitions, new glass front entry, card reader installation at main suite door, and open office cabling.',
    applicant: 'Structure Tone SW',
    valuation: 450000,
    status: 'Issued',
    dataSource: 'Mock Data'
  },
  {
    id: '2',
    permitNumber: '2402-22911',
    permitType: 'Commercial Remodel',
    address: '5800 Granite Pkwy, Plano, TX 75024',
    city: 'Plano',
    appliedDate: '2025-05-11',
    description: 'Exterior facade modification and installation of illuminated channel letter signage for "Bistro 58".',
    applicant: 'Chandler Signs',
    valuation: 35000,
    status: 'Under Review',
    dataSource: 'Mock Data'
  },
  {
    id: '3',
    permitNumber: '2402-11022',
    permitType: 'Commercial Remodel',
    address: '200 Main St, Fort Worth, TX 76102',
    city: 'Fort Worth',
    appliedDate: '2025-05-10',
    description: 'Interior remodel for law firm expansion. New conference rooms with AV rough-in, sound masking system, and lobby renovation.',
    applicant: 'Balfour Beatty',
    valuation: 850000,
    status: 'Issued',
    dataSource: 'Mock Data'
  },
  {
    id: '4',
    permitNumber: '2402-33100',
    permitType: 'Certificate of Occupancy',
    address: '777 Pacific Ave, Dallas, TX 75201',
    city: 'Dallas',
    appliedDate: '2025-05-09',
    description: 'Change of use/CO for new retail tenant. Safety inspection, exit sign verification, and fire extinguisher check.',
    applicant: 'TDIndustries',
    valuation: 0,
    status: 'Issued',
    dataSource: 'Mock Data'
  },
  {
    id: '5',
    permitNumber: '2402-44201',
    permitType: 'Commercial Remodel',
    address: '3000 Internet Blvd, Frisco, TX 75034',
    city: 'Frisco',
    appliedDate: '2025-05-08',
    description: 'Data center server room expansion. Installation of new server racks, underfloor power distribution, and biometric access control upgrade.',
    applicant: 'DPR Construction',
    valuation: 1200000,
    status: 'Pending Inspection',
    dataSource: 'Mock Data'
  }
];
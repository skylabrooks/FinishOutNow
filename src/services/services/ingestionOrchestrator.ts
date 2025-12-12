// Ingestion orchestrator: fetches and combines all city and signal sources
import { Permit } from '../types';
import { fetchDallasPermits } from './ingestion/dallas';
import { fetchFortWorthPermits } from './ingestion/fortWorth';
import { fetchArlingtonPermits } from './ingestion/arlington';
import { fetchPlanoPermits } from './ingestion/plano';
import { fetchIrvingPermits } from './ingestion/irving';
import { fetchUtilityConnections } from './ingestion/utilityConnections';
import { fetchZoningCases } from './ingestion/zoningCases';
import { fetchLegalVacancySignals } from './ingestion/legalVacancy';
import { fetchLicensingSignals } from './ingestion/licensingSignals';
import { fetchIncentiveSignals } from './ingestion/incentiveSignals';
import { fetchTABCLicenses } from './ingestion/tabc';

export async function fetchAllPermitsAndSignals(): Promise<Permit[]> {
  // Fetch all city permits in parallel
  const [dallas, fortWorth, arlington, plano, irving] = await Promise.all([
    fetchDallasPermits(),
    fetchFortWorthPermits(),
    fetchArlingtonPermits(),
    fetchPlanoPermits(),
    fetchIrvingPermits()
  ]);

  // Fetch all creative signals in parallel
  const [utility, zoning, vacancy, licensing, incentives, tabc] = await Promise.all([
    fetchUtilityConnections(),
    fetchZoningCases(),
    fetchLegalVacancySignals(),
    fetchLicensingSignals(),
    fetchIncentiveSignals(),
    fetchTABCLicenses()
  ]);

  // Combine all sources
  return [
    ...dallas,
    ...fortWorth,
    ...arlington,
    ...plano,
    ...irving,
    ...utility,
    ...zoning,
    ...vacancy,
    ...licensing,
    ...incentives,
    ...tabc
  ];
}

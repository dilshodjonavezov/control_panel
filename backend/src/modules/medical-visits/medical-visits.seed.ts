export const MEDICAL_VISIT_SEED = [
  {
    peopleId: 3,
    username: 'clinic',
    doctor: 'Sidorova A.V.',
    visitDate: '2026-01-24',
    diagnosis: 'ARVI',
    notes: 'Outpatient treatment',
    status: 'FINAL',
  },
  {
    peopleId: 3,
    username: 'clinic',
    doctor: 'Rakhimova N.S.',
    visitDate: '2026-01-12',
    diagnosis: 'Pain complaints',
    notes: 'Further examination prescribed',
    status: 'DRAFT',
  },
] as const;

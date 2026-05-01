export const MEDICAL_RECORD_SEED = Array.from({ length: 10 }, (_, index) => ({
  peopleId: 21 + index,
  username: 'clinic',
  clinic: index % 2 === 0 ? 'City Polyclinic No. 1, Dushanbe' : 'District Polyclinic, Khujand',
  decision: ['FIT', 'FIT_WITH_LIMITATIONS', 'TEMPORARY_DEFERMENT'][index % 3],
  reason: ['Routine examination', 'Respiratory follow-up', 'Orthopedic observation'][index % 3],
  defermentReason: index % 3 === 2 ? 'Medical observation' : null,
  createdAtRecord: `2026-${String((index % 4) + 1).padStart(2, '0')}-0${(index % 8) + 1}`,
  notes: `Medical record ${index + 1} for test scenario`,
}));

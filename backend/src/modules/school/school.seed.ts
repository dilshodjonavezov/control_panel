export const SCHOOL_RECORD_SEED = Array.from({ length: 10 }, (_, index) => ({
  peopleId: 21 + index,
  institutionId: 1 + (index % 5),
  classNumber: 7 + (index % 5),
  admissionDate: `2024-${String((index % 9) + 1).padStart(2, '0')}-01T08:00:00.000Z`,
  graduationDate: index > 6 ? `2026-05-${String(10 + index).padStart(2, '0')}T08:00:00.000Z` : null,
  expulsionDate: index === 5 ? '2025-11-12T08:00:00.000Z' : null,
  comment: `School test record ${index + 1} for Tajik dataset`,
}));

export const VVK_RESULT_SEED = Array.from({ length: 10 }, (_, index) => ({
  peopleId: 21 + index,
  username: 'vvk',
  examDate: `2026-${String((index % 4) + 1).padStart(2, '0')}-${String(5 + index).padStart(2, '0')}`,
  category: ['A', 'B', 'C', 'D_UNFIT'][index % 4],
  queueStatus: ['DONE', 'IN_REVIEW', 'PENDING'][index % 3],
  fitnessCategory: ['FIT', 'FIT_WITH_LIMITATIONS', 'TEMPORARILY_UNFIT', 'UNFIT'][index % 4],
  finalDecision: ['FIT', 'DEFER', 'FIT', 'UNFIT'][index % 4],
  reason: ['Healthy', 'Needs follow-up', 'Recovering after illness', 'Medical contraindications'][index % 4],
  notes: `VVK test result ${index + 1}`,
  nextReviewDate: index % 4 === 1 ? `2026-09-${String(10 + index).padStart(2, '0')}` : null,
}));

export const EDUCATION_RECORD_SEED = Array.from({ length: 10 }, (_, index) => ({
  peopleId: 21 + index,
  institutionId: 6 + (index % 5),
  studyForm: index % 2 === 0 ? 'Full-time' : 'Part-time',
  faculty: ['Information Technology', 'Economics', 'Law', 'Pedagogy', 'Construction'][index % 5],
  specialty: ['Software Engineering', 'Finance', 'Civil Law', 'Primary Education', 'Architecture'][index % 5],
  admissionDate: `2023-${String((index % 9) + 1).padStart(2, '0')}-01`,
  expulsionDate: index === 7 ? '2025-12-01' : null,
  graduationDate: index === 9 ? '2026-06-20' : null,
  isDeferralActive: index < 8,
  username: 'university',
}));

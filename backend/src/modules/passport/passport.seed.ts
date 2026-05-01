export const PASSPORT_RECORD_SEED = Array.from({ length: 10 }, (_, index) => ({
  peopleId: 21 + index,
  userId: 6,
  passportNumber: `TJ0${index + 1}45${index + 7}8`,
  dateOfIssue: `2024-${String((index % 9) + 1).padStart(2, '0')}-12`,
  placeOfIssue: index % 2 === 0 ? 'Dushanbe' : 'Khujand',
  dateBirth: `20${String(index).padStart(2, '0')}-${String(((index + 2) % 12) + 1).padStart(2, '0')}-15`,
}));

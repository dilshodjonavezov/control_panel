export const ADDRESS_SEED = Array.from({ length: 10 }, (_, index) => ({
  citizenId: index + 1,
  type: 'REGISTRATION',
  region: 'Tajikistan',
  district: ['Sino', 'Firdavsi', 'Shohmansur', 'Ismoili Somoni', 'Bofanda'][index % 5],
  city: ['Dushanbe', 'Khujand', 'Bokhtar', 'Kulob', 'Hisor'][index % 5],
  street: ['Rudaki Avenue', 'Somoni Street', 'Bofanda Street', 'Ismoili Somoni Street', 'Navruz Street'][index % 5],
  house: `${10 + index}`,
  apartment: `${index + 1}`,
  postalCode: `7340${index}`,
  startDate: `2024-${String((index % 9) + 1).padStart(2, '0')}-01`,
  isActive: true,
  notes: `Test registration address ${index + 1}`,
}));

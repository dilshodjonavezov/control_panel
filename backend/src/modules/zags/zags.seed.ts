import { TAJIK_FAMILY_FIXTURES } from '../test-data/tajik-test-data';

const marriageActs = TAJIK_FAMILY_FIXTURES.map((family, index) => ({
  actNumber: `MARRIAGE-2026-${String(index + 1).padStart(4, '0')}`,
  actType: 'MARRIAGE',
  status: 'REGISTERED',
  registrationDate: `2026-${String((index % 4) + 1).padStart(2, '0')}-10`,
  placeOfRegistration: `${family.location.city}, ${family.location.district}`,
  userId: 4,
  marriageDetails: {
    spouseOneFullName: `${family.father.lastName} ${family.father.firstName} ${family.father.middleName}`,
    spouseTwoFullName: `${family.mother.lastName} ${family.mother.firstName} ${family.mother.middleName}`,
    marriageDate: `2018-${String((index % 9) + 1).padStart(2, '0')}-15`,
    marriagePlace: `${family.location.city}, ${family.location.district}`,
  },
}));

const birthActs = TAJIK_FAMILY_FIXTURES.map((family, index) => ({
  actNumber: `BIRTH-2026-${String(index + 1).padStart(4, '0')}`,
  actType: 'BIRTH',
  status: 'REGISTERED',
  registrationDate: `2026-${String((index % 4) + 1).padStart(2, '0')}-25`,
  placeOfRegistration: `${family.location.city}, ${family.location.district}`,
  userId: 4,
  maternityRecordId: index + 1,
  birthDetails: {
    childCitizenId: null,
    birthCaseType: 'STANDARD_MARRIAGE',
    childFullName: family.child.fullName,
    birthDate: family.child.birthDateTime.split('T')[0],
    birthPlace: family.location.place,
    motherCitizenId: null,
    motherFullName: `${family.mother.lastName} ${family.mother.firstName} ${family.mother.middleName}`,
    fatherCitizenId: null,
    fatherFullName: `${family.father.lastName} ${family.father.firstName} ${family.father.middleName}`,
  },
}));

export const ZAGS_ACT_SEED = [...marriageActs, ...birthActs] as const;

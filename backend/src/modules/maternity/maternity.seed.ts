import { TAJIK_FAMILY_FIXTURES } from '../test-data/tajik-test-data';

export const MATERNITY_RECORD_SEED = TAJIK_FAMILY_FIXTURES.map((family) => ({
  userId: 3,
  birthDateTime: family.child.birthDateTime,
  placeOfBirth: family.location.place,
  gender: family.child.gender,
  childFullName: family.child.fullName,
  fatherFullName: `${family.father.lastName} ${family.father.firstName} ${family.father.middleName}`,
  motherFullName: `${family.mother.lastName} ${family.mother.firstName} ${family.mother.middleName}`,
  birthWeight: family.child.weight,
  status: 'SUBMITTED_TO_ZAGS',
  comment: `Birth registration prepared for ${family.location.city}`,
}));

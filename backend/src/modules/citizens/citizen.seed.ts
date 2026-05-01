import { TAJIK_FAMILY_FIXTURES, TAJIK_STUDENT_FIXTURES } from '../test-data/tajik-test-data';

const familyCitizens = TAJIK_FAMILY_FIXTURES.flatMap((family, index) => [
  {
    iin: `11${String(index + 1).padStart(2, '0')}0101123456`,
    firstName: family.father.firstName,
    lastName: family.father.lastName,
    middleName: family.father.middleName,
    birthDate: family.father.birthDate,
    gender: 'MALE',
    citizenship: 'Tajikistan',
    lifeStatus: 'ACTIVE',
    motherFullName: null,
    fatherFullName: null,
  },
  {
    iin: `22${String(index + 1).padStart(2, '0')}0202123456`,
    firstName: family.mother.firstName,
    lastName: family.mother.lastName,
    middleName: family.mother.middleName,
    birthDate: family.mother.birthDate,
    gender: 'FEMALE',
    citizenship: 'Tajikistan',
    lifeStatus: 'ACTIVE',
    motherFullName: null,
    fatherFullName: null,
  },
]);

const studentCitizens = TAJIK_STUDENT_FIXTURES.map((student, index) => ({
  iin: `33${String(index + 1).padStart(2, '0')}0303123456`,
  firstName: student.firstName,
  lastName: student.lastName,
  middleName: student.middleName,
  birthDate: student.birthDate,
  gender: student.gender,
  citizenship: 'Tajikistan',
  lifeStatus: 'ACTIVE',
  motherFullName: null,
  fatherFullName: null,
}));

export const CITIZEN_SEED = [...familyCitizens, ...studentCitizens] as const;

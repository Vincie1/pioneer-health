// Central service definitions — shared meaning across seed + API.
// Prefix drives the ticket code (C-061, M-024, R-018, V-009).
export const SERVICES = {
  consultation: {
    key: 'consultation',
    name: 'Medical Consultation',
    subtitle: 'See a doctor or nurse',
    prefix: 'C',
    estimatedWait: 24,
  },
  medication: {
    key: 'medication',
    name: 'Medication Collection',
    subtitle: 'Chronic & repeat prescriptions',
    prefix: 'M',
    estimatedWait: 12,
  },
  records: {
    key: 'records',
    name: 'Medical Records',
    subtitle: 'Request or collect your records',
    prefix: 'R',
    estimatedWait: 9,
  },
  virtual: {
    key: 'virtual',
    name: 'Virtual Consultation',
    subtitle: 'Speak to a clinician online',
    prefix: 'V',
    estimatedWait: 6,
  },
};

export const EMERGENCY_TYPES = {
  cardiac: { key: 'cardiac', label: 'Chest pain / cardiac', priority: 1 },
  stroke: { key: 'stroke', label: 'Suspected stroke', priority: 1 },
  bleeding: { key: 'bleeding', label: 'Severe bleeding', priority: 1 },
  trauma: { key: 'trauma', label: 'Trauma / accident', priority: 2 },
  breathing: { key: 'breathing', label: 'Difficulty breathing', priority: 2 },
  other: { key: 'other', label: 'Other emergency', priority: 3 },
};

export const isValidService = (s) => Object.prototype.hasOwnProperty.call(SERVICES, s);
export const isValidEmergency = (t) => Object.prototype.hasOwnProperty.call(EMERGENCY_TYPES, t);

// Mocked logged-in mobile patient (no real auth in this training demo).
export const MOCK_PATIENT = {
  fullName: 'Thandi Mokoena',
  firstName: 'Thandi',
  idNumber: '9001015800083',
  mobile: '082 123 4567',
  bloodType: 'O+',
  allergies: ['Penicillin'],
  chronic: ['Hypertension'],
};

// Client-side mirror of the server's service metadata (labels, icons, colours).
export const SERVICES = [
  {
    key: 'consultation',
    name: 'Medical Consultation',
    subtitle: 'See a doctor or nurse',
    icon: 'stethoscope',
    wait: 24,
  },
  {
    key: 'medication',
    name: 'Medication Collection',
    subtitle: 'Chronic & repeat prescriptions',
    icon: 'pill',
    wait: 12,
  },
  {
    key: 'records',
    name: 'Medical Records',
    subtitle: 'Request or collect your records',
    icon: 'folder',
    wait: 9,
  },
  {
    key: 'virtual',
    name: 'Virtual Consultation',
    subtitle: 'Speak to a clinician online',
    icon: 'video',
    wait: 6,
  },
];

export const SERVICE_MAP = Object.fromEntries(SERVICES.map((s) => [s.key, s]));

export const EMERGENCY_TYPES = [
  { key: 'cardiac', label: 'Chest pain / cardiac' },
  { key: 'stroke', label: 'Suspected stroke' },
  { key: 'bleeding', label: 'Severe bleeding' },
  { key: 'trauma', label: 'Trauma / accident' },
  { key: 'breathing', label: 'Difficulty breathing' },
  { key: 'other', label: 'Other emergency' },
];

export const STATUS_LABEL = {
  waiting: 'Waiting',
  called: 'Called',
  in_room: 'In room',
  done: 'Done',
};

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

export const EMERGENCY_LABEL = Object.fromEntries(EMERGENCY_TYPES.map((t) => [t.key, t.label]));

// Paramedic dispatch lifecycle for the /ambulance page. Ordered: a crew accepts
// (en_route), reaches the patient (on_scene), transports, then arrives at the clinic.
export const DISPATCH_STAGES = [
  { key: 'unassigned', label: 'Unassigned', next: 'en_route', action: 'Accept & respond' },
  { key: 'en_route', label: 'En route to patient', next: 'on_scene', action: 'Mark on scene' },
  { key: 'on_scene', label: 'On scene', next: 'transporting', action: 'Start transport' },
  { key: 'transporting', label: 'Transporting to clinic', next: 'arrived', action: 'Mark arrived' },
  { key: 'arrived', label: 'Arrived at clinic', next: null, action: null },
];

export const DISPATCH_MAP = Object.fromEntries(DISPATCH_STAGES.map((s) => [s.key, s]));

export const DISPATCH_STYLE = {
  unassigned: 'bg-slate-100 text-slate-600',
  en_route: 'bg-amber-100 text-amber-700',
  on_scene: 'bg-blue-100 text-blue-700',
  transporting: 'bg-indigo-100 text-indigo-700',
  arrived: 'bg-green-100 text-green-700',
};

export const STATUS_LABEL = {
  waiting: 'Waiting',
  called: 'Called',
  in_room: 'In room',
  done: 'Done',
};

// Triage acuity — staff-assigned. Queue sorts critical → medium → low.
export const PRIORITIES = [
  { key: 'critical', label: 'Critical' },
  { key: 'medium', label: 'Medium' },
  { key: 'low', label: 'Low' },
];

export const PRIORITY_STYLE = {
  critical: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

export const PRIORITY_LABEL = {
  critical: 'Critical',
  medium: 'Medium',
  low: 'Low',
};

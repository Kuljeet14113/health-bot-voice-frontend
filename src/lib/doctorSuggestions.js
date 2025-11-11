import { getAllVerifiedDoctors } from '../api/doctor';

// Basic symptom keywords to specialty mapping
const SPECIALTY_KEYWORDS = [
  { specialty: 'Family Medicine', keywords: ['cough', 'cold', 'fever', 'sore throat', 'runny nose', 'flu', 'body ache'] },
  { specialty: 'Pediatrics', keywords: ['child', 'kid', 'infant', 'baby', 'pediatric'] },
  { specialty: 'Dermatology', keywords: ['skin', 'rash', 'acne', 'eczema', 'psoriasis', 'itch', 'dandruff', 'scalp', 'scalp itching', 'scalp irritation', 'seborrheic dermatitis'] },
  { specialty: 'Cardiology', keywords: ['chest pain', 'palpitation', 'heart', 'bp', 'hypertension'] },
  { specialty: 'Orthopedics', keywords: ['bone', 'joint', 'fracture', 'sprain', 'back pain', 'knee pain'] },
  { specialty: 'Neurology', keywords: ['headache', 'migraine', 'seizure', 'numbness', 'weakness', 'dizziness'] },
  { specialty: 'Psychiatry', keywords: ['depression', 'anxiety', 'stress', 'sleep', 'insomnia'] },
  { specialty: 'Oncology', keywords: ['tumor', 'cancer', 'lump'] },
  { specialty: 'Internal Medicine', keywords: ['diabetes', 'thyroid', 'metabolic'] },
];

export const mapSymptomsToSpecialty = (text) => {
  if (!text) return null;
  const q = text.toLowerCase();
  for (const m of SPECIALTY_KEYWORDS) {
    if (m.keywords.some(k => q.includes(k))) {
      return m.specialty;
    }
  }
  return null;
};

const SPECIALTY_SYNONYMS = {
  'orthopedics': ['orthopedic', 'orthopaedics', 'orthopaedic', 'bones', 'joints'],
  'dermatology': ['dermatologist', 'skin'],
  'family medicine': ['general practice', 'general practitioner', 'gp', 'primary care'],
  'internal medicine': ['physician', 'general physician'],
};

export const fetchDoctorsBySpecialty = async (specialty) => {
  if (!specialty) return [];
  try {
    const data = await getAllVerifiedDoctors();
    const doctors = Array.isArray(data?.doctors) ? data.doctors : (Array.isArray(data) ? data : []);
    const target = specialty.toLowerCase();
    const synonyms = SPECIALTY_SYNONYMS[target] || [];
    const filtered = doctors.filter(d => {
      const spec = (d.specialization || '').toLowerCase();
      if (!spec) return false;
      return spec === target || spec.includes(target) || synonyms.some(s => spec.includes(s));
    });
    return filtered.map(d => ({
      id: d._id || d.id,
      name: d.name,
      specialization: d.specialization,
      location: d.location,
      hospital: d.hospital,
      phone: d.phone,
      email: d.email,
      experience: d.experience,
      avatar: d.avatar || ''
    }));
  } catch (e) {
    console.error('Failed to fetch doctors by specialty:', e);
    return [];
  }
};

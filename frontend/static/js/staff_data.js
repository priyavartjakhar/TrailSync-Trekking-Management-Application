// ============================================================
//  staff_data.js — Initial state and mock data for staff panel
// ============================================================

const STAFF_INITIAL_NAME = 'Ravi Kumar';

const STAFF_ASSIGNED_TREKS = [
  {
    id: 1, name: 'Kedarkantha', location: 'Uttarakhand', difficulty: 'Moderate',
    duration: 6, startDate: '2026-06-20', endDate: '2026-06-26',
    slots: 20, registered: 14, status: 'Open',
    description: 'One of the best winter treks in India with panoramic views.'
  },
  {
    id: 2, name: 'Pin Parvati Pass', location: 'Himachal Pradesh', difficulty: 'Hard',
    duration: 12, startDate: '2026-08-01', endDate: '2026-08-12',
    slots: 10, registered: 6, status: 'Pending',
    description: 'A challenging high-altitude trek crossing Pin Parvati Pass at 5319m.'
  },
  {
    id: 3, name: 'Hampta Pass', location: 'Himachal Pradesh', difficulty: 'Moderate',
    duration: 7, startDate: '2026-09-10', endDate: '2026-09-16',
    slots: 18, registered: 4, status: 'Approved',
    description: 'Dramatic crossover trek from lush Kullu valley to barren Lahaul.'
  },
];

const STAFF_PARTICIPANTS = [
  // Trek 1 — Kedarkantha
  { id: 1, trekId: 1, name: 'Aryan Mehta', email: 'aryan@mail.com', phone: '+91 9876543210', bookedOn: '2026-05-10', status: 'Booked', attendance: false, emergencyContact: 'Suresh Mehta', emergencyPhone: '+91 9011223344', bloodGroup: 'B+' },
  { id: 2, trekId: 1, name: 'Sneha Rao', email: 'sneha@mail.com', phone: '+91 9123456780', bookedOn: '2026-05-12', status: 'Booked', attendance: true, emergencyContact: 'Priya Rao', emergencyPhone: '+91 9022334455', bloodGroup: 'O+' },
  { id: 3, trekId: 1, name: 'Dev Nair', email: 'dev@mail.com', phone: '+91 9234567890', bookedOn: '2026-05-13', status: 'Cancelled', attendance: false, emergencyContact: 'Anita Nair', emergencyPhone: '+91 9033445566', bloodGroup: 'A+' },
  { id: 4, trekId: 1, name: 'Riya Joshi', email: 'riya@mail.com', phone: '+91 9345678901', bookedOn: '2026-05-14', status: 'Booked', attendance: false, emergencyContact: 'Mohan Joshi', emergencyPhone: '+91 9044556677', bloodGroup: 'AB+' },
  { id: 5, trekId: 1, name: 'Kabir Shah', email: 'kabir@mail.com', phone: '+91 9456789012', bookedOn: '2026-05-15', status: 'Booked', attendance: true, emergencyContact: 'Zara Shah', emergencyPhone: '+91 9055667788', bloodGroup: 'A-' },
  { id: 6, trekId: 1, name: 'Priya Kapoor', email: 'priya.k@mail.com', phone: '+91 9567890123', bookedOn: '2026-05-16', status: 'Booked', attendance: false, emergencyContact: 'Rahul Kapoor', emergencyPhone: '+91 9066778899', bloodGroup: 'O-' },
  { id: 7, trekId: 1, name: 'Aditya Sharma', email: 'aditya@mail.com', phone: '+91 9678901234', bookedOn: '2026-05-18', status: 'Completed', attendance: true, emergencyContact: 'Geeta Sharma', emergencyPhone: '+91 9077889900', bloodGroup: 'B-' },
  // Trek 2 — Pin Parvati
  { id: 8, trekId: 2, name: 'Meera Patel', email: 'meera@mail.com', phone: '+91 9789012345', bookedOn: '2026-05-18', status: 'Booked', attendance: false, emergencyContact: 'Hemant Patel', emergencyPhone: '+91 9088990011', bloodGroup: 'O+' },
  { id: 9, trekId: 2, name: 'Rohan Desai', email: 'rohan@mail.com', phone: '+91 9890123456', bookedOn: '2026-05-19', status: 'Booked', attendance: false, emergencyContact: 'Suneeta Desai', emergencyPhone: '+91 9099001122', bloodGroup: 'A+' },
  { id: 10, trekId: 2, name: 'Ananya Singh', email: 'ananya@mail.com', phone: '+91 9901234567', bookedOn: '2026-05-20', status: 'Booked', attendance: false, emergencyContact: 'Vijay Singh', emergencyPhone: '+91 9010112233', bloodGroup: 'B+' },
  // Trek 3 — Hampta Pass
  { id: 11, trekId: 3, name: 'Vishal Gupta', email: 'vishal@mail.com', phone: '+91 9011223344', bookedOn: '2026-05-22', status: 'Booked', attendance: false, emergencyContact: 'Kavita Gupta', emergencyPhone: '+91 9021334455', bloodGroup: 'AB-' },
  { id: 12, trekId: 3, name: 'Nisha Tiwari', email: 'nisha@mail.com', phone: '+91 9122334455', bookedOn: '2026-05-23', status: 'Booked', attendance: false, emergencyContact: 'Sanjay Tiwari', emergencyPhone: '+91 9031445566', bloodGroup: 'O+' },
];

const STAFF_ACTIVITY_LOG = [
  { id: 1, text: 'Updated <strong>Kedarkantha</strong> slots from 16 to 20', type: 'update', time: '2h ago' },
  { id: 2, text: '<strong>Aryan Mehta</strong> booked Kedarkantha', type: 'booking', time: '3h ago' },
  { id: 3, text: 'Changed <strong>Hampta Pass</strong> status to Approved', type: 'status', time: '5h ago' },
  { id: 4, text: '<strong>Dev Nair</strong> cancelled their booking', type: 'cancel', time: '6h ago' },
  { id: 5, text: 'Exported participant list for <strong>Kedarkantha</strong>', type: 'export', time: '1d ago' },
  { id: 6, text: 'Marked <strong>Riya Joshi</strong> attendance as present', type: 'attendance', time: '1d ago' },
];

const STAFF_NOTIFICATIONS = [
  { id: 1, title: 'Trek starts in 10 days', desc: 'Kedarkantha trek begins on 2026-06-20. Confirm participant list.', type: 'warning', time: '1h ago', unread: true },
  { id: 2, title: '14 participants registered', desc: 'Kedarkantha now has 14/20 slots filled (70% capacity).', type: 'info', time: '3h ago', unread: true },
  { id: 3, title: 'Admin assigned new trek', desc: 'Hampta Pass has been assigned to you by Admin.', type: 'info', time: '5h ago', unread: true },
  { id: 4, title: 'Booking cancelled', desc: 'Dev Nair cancelled their booking for Kedarkantha.', type: 'cancel', time: '6h ago', unread: false },
  { id: 5, title: 'Slots running low', desc: 'Pin Parvati Pass has only 4 slots remaining.', type: 'warning', time: '1d ago', unread: false },
  { id: 6, title: 'Trek completion reminder', desc: 'Please update completion status after trek ends.', type: 'info', time: '2d ago', unread: false },
];

const STAFF_PROFILE_INITIAL = {
  name: 'Ravi Kumar',
  email: 'ravi.kumar@trailsync.in',
  phone: '+91 9876500001',
  city: 'Rishikesh',
  certifications: 'IMF Basic Mountaineering, Wilderness First Aid',
  bio: 'Professional trek guide with 8+ years of Himalayan experience. Specialised in high-altitude routes above 4000m.'
};

const CHECKLIST_DEFAULTS = [
  'Trekking boots (ankle support)',
  'Warm jacket & thermals',
  'Rain poncho / windproof jacket',
  'Sun cream SPF 50+',
  'Personal first aid kit',
  'Water bottle (2L minimum)',
  'Energy bars / dry fruits',
  'Trekking poles (recommended)',
  'Head torch with extra batteries',
  'Government-issued photo ID',
];

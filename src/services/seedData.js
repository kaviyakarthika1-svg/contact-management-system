import { uid } from '../utils/id';
import { DAY_MS, timestampInDays, dateInDays, timestampHoursAgo } from '../utils/dateUtils';
import { load, KEYS } from './storage';

/**
 * Realistic FICTIONAL demo data so the app looks complete on first launch.
 * Dates are computed relative to "now" so birthdays, reminders and the
 * dashboard charts always look alive, no matter when the app is opened.
 *
 * Demo mode can be turned off (Settings → Clear all data); after that the
 * app starts with empty collections instead of demo data.
 */

// --------------------------------------------------------------------------
// Small builders
// --------------------------------------------------------------------------

const isoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** A birthday `days` from today, in the given birth year. */
const birthdayInDays = (days, year = 1993) => {
  const d = new Date(Date.now() + days * DAY_MS);
  return `${year}-${isoDate(d).slice(5)}`;
};

const ago = (days) => timestampInDays(-days);

const note = (text, daysAgo) => {
  const at = ago(daysAgo);
  return { id: uid('n'), text, createdAt: at, updatedAt: at };
};

const baseContact = {
  altPhone: '',
  address: '',
  city: '',
  website: '',
  avatar: null,
  tags: [],
  notes: [],
  relationship: 'Other',
  favorite: false,
  important: false,
  lastContactedAt: null,
};

const contact = (data) => ({ ...baseContact, ...data });

/** Demo data is only used until the user explicitly starts from scratch. */
function demoEnabled() {
  const settings = load(KEYS.settings, null);
  return !settings || settings.demo !== false;
}

// --------------------------------------------------------------------------
// Groups
// --------------------------------------------------------------------------

const SEED_GROUPS = [
  { id: 'g1', name: 'Family', color: '#ec4899', createdAt: ago(200) },
  { id: 'g2', name: 'Friends', color: '#0ea5e9', createdAt: ago(200) },
  { id: 'g3', name: 'College', color: '#8b5cf6', createdAt: ago(200) },
  { id: 'g4', name: 'Work', color: '#6366f1', createdAt: ago(200) },
  { id: 'g5', name: 'Clients', color: '#10b981', createdAt: ago(200) },
  { id: 'g6', name: 'Important', color: '#ef4444', createdAt: ago(200) },
];

export function seedGroups() {
  return demoEnabled() ? SEED_GROUPS.map((g) => ({ ...g })) : [];
}

// --------------------------------------------------------------------------
// Contacts (15 fictional people across all groups)
// --------------------------------------------------------------------------

const SEED_CONTACTS = [
  contact({
    id: 'c1', firstName: 'Aarav', lastName: 'Sharma',
    phone: '+91 98765 43210', altPhone: '+91 98111 20099',
    email: 'aarav.sharma@example.com',
    jobTitle: 'Software Engineer', company: 'TechNova Solutions',
    groupId: 'g1', tags: ['Personal', 'VIP'], relationship: 'Family',
    favorite: true, birthday: birthdayInDays(3, 1996),
    address: '221B Rosewood Apartments, MG Road', city: 'Bengaluru',
    website: 'https://aaravsharma.example.com',
    notes: [note('Planning the Goa trip for December — collect details next call.', 4)],
    lastContactedAt: ago(1), createdAt: ago(120), updatedAt: ago(1),
  }),
  contact({
    id: 'c2', firstName: 'Meera', lastName: 'Sharma',
    phone: '+91 98230 11223', email: 'meera.sharma@example.com',
    jobTitle: 'Graphic Designer', company: 'Creative Minds Studio',
    groupId: 'g1', tags: ['Personal'], relationship: 'Family',
    birthday: birthdayInDays(0, 1994),
    city: 'Pune',
    notes: [note('Loves baking — asked for ideas to digitise her recipe book.', 6)],
    lastContactedAt: ago(6), createdAt: ago(150), updatedAt: ago(6),
  }),
  contact({
    id: 'c3', firstName: 'Kavita', lastName: 'Sharma',
    phone: '+91 99201 45678', email: 'kavita.sharma@example.com',
    groupId: 'g1', tags: ['Personal'], relationship: 'Family',
    birthday: birthdayInDays(-40, 1961),
    city: 'Jaipur',
    notes: [note('Prefers calls over messages, usually in the evening.', 20)],
    lastContactedAt: ago(30), createdAt: ago(160), updatedAt: ago(20),
  }),
  contact({
    id: 'c4', firstName: 'Rahul', lastName: 'Verma',
    phone: '+91 98711 66554', email: 'rahul.verma@example.com',
    jobTitle: 'Financial Analyst', company: 'FinEdge Capital',
    groupId: 'g2', tags: ['Personal'], relationship: 'Friend',
    birthday: birthdayInDays(25, 1993),
    city: 'Delhi',
    notes: [note("Met at Rahul's housewarming — catch up over chai sometime.", 12)],
    lastContactedAt: ago(9), createdAt: ago(140), updatedAt: ago(12),
  }),
  contact({
    id: 'c5', firstName: 'Priya', lastName: 'Nair',
    phone: '+91 94470 88123', email: 'priya.nair@example.com',
    jobTitle: 'Content Strategist', company: 'Nova Media House',
    groupId: 'g2', tags: ['Personal', 'VIP'], relationship: 'Friend',
    favorite: true, birthday: birthdayInDays(-15, 1995),
    city: 'Kochi',
    notes: [
      note('Best friend since school.', 90),
      note('Allergic to peanuts — always check menus before dinners.', 30),
    ],
    lastContactedAt: ago(2), createdAt: ago(130), updatedAt: ago(30),
  }),
  contact({
    id: 'c6', firstName: 'Sneha', lastName: 'Kapoor',
    phone: '+91 98330 77410', email: 'sneha.kapoor@example.com',
    jobTitle: 'Owner', company: "Sneha's Bakehouse",
    groupId: 'g2', tags: ['Personal'], relationship: 'Friend',
    birthday: birthdayInDays(60, 1990),
    city: 'Mumbai',
    notes: [note('Runs a small home bakery — order the chocolate truffle cake for Diwali.', 15)],
    createdAt: ago(100), updatedAt: ago(15),
  }),
  contact({
    id: 'c7', firstName: 'Vikram', lastName: 'Singh',
    phone: '+91 90123 45678', email: 'vikram.singh@example.com',
    jobTitle: 'Research Assistant', company: 'Delhi University Robotics Lab',
    groupId: 'g3', tags: ['College'], relationship: 'Classmate',
    birthday: birthdayInDays(-75, 1994),
    city: 'Delhi',
    notes: [
      note('Still owes me the Data Structures book from final year.', 45),
      note('Preparing for GATE — asked for study group recommendations.', 45),
    ],
    lastContactedAt: ago(45), createdAt: ago(90), updatedAt: ago(45),
  }),
  contact({
    id: 'c8', firstName: 'Ananya', lastName: 'Iyer',
    phone: '+91 90045 67123', email: 'ananya.iyer@example.com',
    jobTitle: 'Student', company: 'NIT Trichy',
    groupId: 'g3', tags: ['College', 'Project'], relationship: 'Classmate',
    birthday: birthdayInDays(12, 1997),
    city: 'Tiruchirappalli',
    notes: [note('Interested in an internship at TechNova. Discussed her final year project on ML.', 14)],
    lastContactedAt: ago(14), createdAt: ago(85), updatedAt: ago(14),
  }),
  contact({
    id: 'c9', firstName: 'Neha', lastName: 'Gupta',
    phone: '+91 98123 90912', email: 'neha.gupta@example.com',
    jobTitle: 'Product Manager', company: 'TechNova Solutions',
    groupId: 'g4', tags: ['Work', 'VIP'], relationship: 'Colleague',
    favorite: true, important: true, birthday: birthdayInDays(-100, 1991),
    city: 'Bengaluru',
    notes: [
      note("Goes by 'Neha G' to avoid confusion with the designer.", 70),
      note('Owns the mobile app release planning.', 10),
    ],
    lastContactedAt: ago(1), createdAt: ago(75), updatedAt: ago(10),
  }),
  contact({
    id: 'c10', firstName: 'Arjun', lastName: 'Rao',
    phone: '+91 96400 51234', email: 'arjun.rao@example.com',
    jobTitle: 'Design Lead', company: 'TechNova Solutions',
    groupId: 'g4', tags: ['Work'], relationship: 'Colleague',
    birthday: birthdayInDays(200, 1992),
    city: 'Hyderabad',
    notes: [note('Prefers Slack over email. Design lead for the dashboard redesign.', 8)],
    lastContactedAt: ago(4), createdAt: ago(60), updatedAt: ago(8),
  }),
  contact({
    id: 'c11', firstName: 'Divya', lastName: 'Menon',
    phone: '+91 94001 23876', email: 'divya.menon@example.com',
    jobTitle: 'QA Engineer', company: 'TechNova Solutions',
    groupId: 'g4', tags: ['Work'], relationship: 'Colleague',
    birthday: birthdayInDays(90, 1996),
    city: 'Kochi',
    notes: [],
    lastContactedAt: ago(20), createdAt: ago(35), updatedAt: ago(35),
  }),
  contact({
    id: 'c12', firstName: 'Rohan', lastName: 'Mehta',
    phone: '+91 98200 34567', email: 'rohan.mehta@example.com',
    jobTitle: 'Sales Executive', company: 'AutoGear Motors',
    groupId: 'g3', tags: ['College'], relationship: 'Classmate',
    birthday: birthdayInDays(18, 1993),
    city: 'Pune',
    notes: [note('Lost touch after graduation — worth reconnecting.', 10)],
    createdAt: ago(25), updatedAt: ago(10),
  }),
  contact({
    id: 'c13', firstName: 'Michael', lastName: 'Chen',
    phone: '+65 8123 4567', email: 'michael.chen@example.com',
    jobTitle: 'Operations Director', company: 'Pacific Retail Group',
    groupId: 'g5', tags: ['Client', 'VIP'], relationship: 'Client',
    favorite: true, important: true, birthday: birthdayInDays(48, 1985),
    address: '8 Bayfront Avenue', city: 'Singapore',
    website: 'https://pacificretail.example.com',
    notes: [note('Prefers email over calls. Q4 contract renewal in discussion.', 3)],
    lastContactedAt: ago(3), createdAt: ago(16), updatedAt: ago(3),
  }),
  contact({
    id: 'c14', firstName: 'Sarah', lastName: 'Williams',
    phone: '+44 7700 900123', email: 'sarah.williams@example.com',
    jobTitle: 'Founder', company: 'Williams & Co Consulting',
    groupId: 'g5', tags: ['Client', 'Urgent'], relationship: 'Client',
    birthday: birthdayInDays(-10, 1988),
    address: "12 King's Court, Baker Street", city: 'London',
    website: 'https://williamsco.example.com',
    notes: [note('New client — needs an onboarding call this week.', 2)],
    createdAt: ago(2), updatedAt: ago(2),
  }),
  contact({
    id: 'c15', firstName: 'Rajesh', lastName: 'Kumar',
    phone: '+91 99100 22334', email: 'rajesh.kumar@example.com',
    jobTitle: 'Physician', company: 'Sunrise Clinic',
    groupId: 'g6', tags: ['VIP'], relationship: 'Other',
    important: true, birthday: birthdayInDays(-120, 1970),
    address: '45 Sunrise Enclave, Karol Bagh', city: 'Delhi',
    notes: [
      note('Family physician since 2010.', 100),
      note('Clinic is closed on Sundays.', 100),
    ],
    lastContactedAt: ago(60), createdAt: ago(200), updatedAt: ago(100),
  }),
];

export function seedContacts() {
  return demoEnabled() ? SEED_CONTACTS.map((c) => ({ ...c, notes: [...c.notes] })) : [];
}

// --------------------------------------------------------------------------
// Reminders
// --------------------------------------------------------------------------

const SEED_REMINDERS = [
  {
    id: 'r1', contactId: 'c1', title: 'Call Aarav about the Goa trip plan',
    date: dateInDays(0), time: '18:30', priority: 'high', notes: '',
    completed: false, createdAt: ago(2),
  },
  {
    id: 'r2', contactId: 'c13', title: 'Send Q4 contract draft to Michael',
    date: dateInDays(1), time: '11:00', priority: 'high', notes: 'Attach the revised pricing sheet.',
    completed: false, createdAt: ago(3),
  },
  {
    id: 'r3', contactId: 'c2', title: 'Wish Meera on her birthday',
    date: dateInDays(0), time: '09:00', priority: 'medium', notes: '',
    completed: false, createdAt: ago(7),
  },
  {
    id: 'r4', contactId: 'c14', title: 'Onboarding call with Sarah Williams',
    date: dateInDays(2), time: '15:00', priority: 'high', notes: 'Prepare the onboarding checklist.',
    completed: false, createdAt: ago(1),
  },
  {
    id: 'r5', contactId: 'c8', title: 'Discuss internship opportunity with Ananya',
    date: dateInDays(5), time: '16:00', priority: 'medium', notes: '',
    completed: false, createdAt: ago(4),
  },
  {
    id: 'r6', contactId: 'c9', title: 'Share mobile app release update with Neha',
    date: dateInDays(9), time: '10:00', priority: 'low', notes: '',
    completed: false, createdAt: ago(2),
  },
  {
    id: 'r7', contactId: 'c7', title: 'Return the Data Structures book to Vikram',
    date: dateInDays(-2), time: '12:00', priority: 'low', notes: '',
    completed: true, createdAt: ago(6), completedAt: ago(1),
  },
  {
    id: 'r8', contactId: 'c5', title: 'Book the badminton court with Priya',
    date: dateInDays(-1), time: '19:00', priority: 'medium', notes: '',
    completed: false, createdAt: ago(8),
  },
];

export function seedReminders() {
  return demoEnabled() ? SEED_REMINDERS.map((r) => ({ ...r })) : [];
}

// --------------------------------------------------------------------------
// Activity log
// --------------------------------------------------------------------------

const nameOf = (c) => `${c.firstName} ${c.lastName}`;

function buildSeedActivities() {
  const items = [];
  const push = (type, message, contactRef, timestamp) => {
    items.push({
      id: uid('a'),
      type,
      message,
      contactId: contactRef ? contactRef.id : null,
      contactName: contactRef ? nameOf(contactRef) : '',
      timestamp,
    });
  };

  // One "contact added" per contact, at the time it was created.
  SEED_CONTACTS.forEach((c) => push('added', `Added ${nameOf(c)} to contacts`, c, c.createdAt));

  // A sprinkle of realistic past activity.
  push('favorite', 'Marked Priya Nair as a favorite', SEED_CONTACTS[4], ago(60));
  push('called', 'Clicked call for Aarav Sharma', SEED_CONTACTS[0], ago(1));
  push('emailed', 'Clicked email for Michael Chen', SEED_CONTACTS[12], ago(3));
  push('whatsapp', 'Opened WhatsApp chat with Priya Nair', SEED_CONTACTS[4], ago(2));
  push('note-added', 'Added a note about Ananya Iyer', SEED_CONTACTS[7], ago(14));
  push('note-added', 'Added a note about Sarah Williams', SEED_CONTACTS[13], ago(2));
  SEED_REMINDERS.forEach((r) => {
    const c = SEED_CONTACTS.find((x) => x.id === r.contactId);
    push('reminder-created', `Reminder: ${r.title}`, c, r.createdAt);
  });
  push('reminder-completed', 'Completed: Return the Data Structures book to Vikram', SEED_CONTACTS[6], ago(1));

  return items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function seedActivities() {
  return demoEnabled() ? buildSeedActivities() : [];
}

// --------------------------------------------------------------------------
// Recently viewed + settings
// --------------------------------------------------------------------------

export function seedRecentlyViewed() {
  return demoEnabled()
    ? [
        { contactId: 'c9', at: timestampHoursAgo(-2) },
        { contactId: 'c1', at: timestampHoursAgo(-5) },
        { contactId: 'c13', at: timestampHoursAgo(-26) },
        { contactId: 'c5', at: timestampHoursAgo(-30) },
      ]
    : [];
}

export function seedSettings() {
  return { theme: 'light', demo: true };
}

// --------------------------------------------------------------------------
// Interactions
// --------------------------------------------------------------------------

export function seedInteractions() {
  if (!demoEnabled()) return [];

  return [
    {
      id: 'i1',
      contactId: 'c1',
      type: 'call',
      description: 'Discussed project timeline and deliverables',
      timestamp: timestampHoursAgo(-2),
    },
    {
      id: 'i2',
      contactId: 'c9',
      type: 'email',
      description: 'Sent weekly progress report',
      timestamp: timestampHoursAgo(-5),
    },
    {
      id: 'i3',
      contactId: 'c13',
      type: 'meeting',
      description: 'Q4 contract renewal discussion',
      timestamp: timestampHoursAgo(-26),
    },
    {
      id: 'i4',
      contactId: 'c5',
      type: 'message',
      description: 'Catch up over coffee next week',
      timestamp: timestampHoursAgo(-30),
    },
    {
      id: 'i5',
      contactId: 'c7',
      type: 'whatsapp',
      description: 'Shared study group notes',
      timestamp: timestampHoursAgo(-14),
    },
    {
      id: 'i6',
      contactId: 'c3',
      type: 'call',
      description: 'Family dinner arrangements',
      timestamp: timestampHoursAgo(-72),
    },
    {
      id: 'i7',
      contactId: 'c11',
      type: 'email',
      description: 'QA sprint review feedback',
      timestamp: timestampHoursAgo(-48),
    },
    {
      id: 'i8',
      contactId: 'c2',
      type: 'message',
      description: 'Recipe book design ideas',
      timestamp: timestampHoursAgo(-96),
    },
  ];
}

// --------------------------------------------------------------------------
// Events (birthdays, anniversaries, meetings, custom)
// --------------------------------------------------------------------------

export function seedEvents() {
  if (!demoEnabled()) return [];

  const contacts = SEED_CONTACTS;
  return [
    {
      id: 'e1',
      contactId: 'c1',
      type: 'birthday',
      title: "Aarav's Birthday",
      date: contacts[0].birthday,
      notes: 'Family birthday celebration',
    },
    {
      id: 'e2',
      contactId: 'c2',
      type: 'birthday',
      title: "Meera's Birthday",
      date: contacts[1].birthday,
      notes: 'Family birthday',
    },
    {
      id: 'e3',
      contactId: 'c3',
      type: 'birthday',
      title: "Kavita's Birthday",
      date: contacts[2].birthday,
      notes: 'Family birthday',
    },
    {
      id: 'e4',
      contactId: 'c5',
      type: 'birthday',
      title: "Priya's Birthday",
      date: contacts[4].birthday,
      notes: 'Close friend birthday',
    },
    {
      id: 'e5',
      contactId: 'c9',
      type: 'meeting',
      title: 'Mobile App Review Meeting',
      date: dateInDays(3),
      notes: 'Review the new mobile app features',
    },
    {
      id: 'e6',
      contactId: 'c13',
      type: 'meeting',
      title: 'Pacific Retail Q4 Meeting',
      date: dateInDays(7),
      notes: 'Contract renewal discussion',
    },
    {
      id: 'e7',
      contactId: 'c14',
      type: 'anniversary',
      title: 'Williams & Co Client Anniversary',
      date: dateInDays(14),
      notes: '1 year client anniversary',
    },
    {
      id: 'e8',
      contactId: '',
      type: 'custom',
      title: 'Team Building Event',
      date: dateInDays(10),
      notes: 'Company-wide team building',
    },
  ];
}




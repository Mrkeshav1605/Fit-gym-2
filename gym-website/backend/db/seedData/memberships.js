/** Default membership plans (catalogue). Prices & features are fully configurable in Admin → Memberships. */
export const memberships = [
  {
    name: 'BASIC', price: 999, currency: '₹', durationMonths: 1, popular: false, active: true, order: 1,
    description: 'Everything you need to start training with confidence.',
    features: ['Gym access', 'Full workout library', 'Machine guides', 'Weekly schedule', 'Basic progress tracking'],
  },
  {
    name: 'PRO', price: 1999, currency: '₹', durationMonths: 1, popular: true, active: true, order: 2,
    description: 'The complete smart-training experience for serious members.',
    features: ['All BASIC features', 'Personalised workout plan', 'Smart workout recommendations', 'Advanced progress analytics', 'Attendance & QR check-in', 'Nutrition education'],
  },
  {
    name: 'PREMIUM', price: 2999, currency: '₹', durationMonths: 1, popular: false, active: true, order: 3,
    description: 'Everything in PRO, plus premium support and trainer time.',
    features: ['All PRO features', 'Priority support', 'Trainer consultation option', 'Quarterly trainer check-in', 'Guest passes (2 / month)'],
  },
];

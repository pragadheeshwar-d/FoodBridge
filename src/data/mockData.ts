export const howItWorks = [
  { step: 1, title: 'Donate Food', description: 'Restaurants, hotels & households across Tamil Nadu list surplus food', icon: 'UtensilsCrossed' },
  { step: 2, title: 'Smart Matching', description: 'Smart algorithm matches food with nearby NGOs in your district instantly', icon: 'Brain' },
  { step: 3, title: 'Pickup Request', description: 'Volunteers or NGOs request pickup with one tap', icon: 'Truck' },
  { step: 4, title: 'QR Verification', description: 'Secure QR codes verify pickup and delivery across TN', icon: 'QrCode' },
  { step: 5, title: 'Distribution', description: 'Food reaches shelters & communities — impact tracked live statewide', icon: 'Heart' },
]

export const faqs = [
  {
    q: 'How does Food Bridge work?',
    a: 'Donors list surplus food, nearby NGOs request what they need, volunteers pick up and deliver with QR verification — all tracked in real-time.',
  },
  {
    q: 'Which cities does Food Bridge cover?',
    a: 'We operate across major partner cities and districts with active volunteer networks and continuous community expansion.',
  },
  {
    q: 'Is there a cost to use the platform?',
    a: 'Food Bridge is free for verified NGOs and registered donors committed to reducing food waste and supporting local hunger relief.',
  },
  {
    q: 'How is food safety ensured?',
    a: 'Every donation requires a photo, time of preparation, and hygienic food-grade packaging. Pickups are QR verified at both ends.',
  },
  {
    q: 'Can households or event hosts donate food?',
    a: 'Yes — any surplus from weddings, catering events, or family celebrations can be listed for matching with local NGOs.',
  },
]

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}
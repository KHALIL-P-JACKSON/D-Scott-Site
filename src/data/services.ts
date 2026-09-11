import type { ServiceItem } from '../types'

export const SERVICES: ServiceItem[] = [
  // Hair Services
  {
    id: 'hair-cut',
    category: 'hair',
    title: 'Signature Haircut & Blowout',
    price: '$65+',
    duration: '60 min',
    desc: 'Consultation, scalp massage, precision cut, and salon-grade blowout styling.',
  },
  {
    id: 'hair-balayage',
    category: 'hair',
    title: 'Custom Balayage & Gloss',
    price: '$175+',
    duration: '2.5 hrs',
    desc: 'Hand-painted sun-kissed dimension paired with toner gloss and bond-builder treatment.',
  },
  {
    id: 'hair-silk-press',
    category: 'hair',
    title: 'Hydrating Silk Press',
    price: '$85+',
    duration: '75 min',
    desc: 'Deep steam conditioning, blowout, and silky smooth thermal press with zero heat damage.',
  },
  {
    id: 'hair-keratin',
    category: 'hair',
    title: 'Keratin Smoothing Therapy',
    price: '$195+',
    duration: '2 hrs',
    desc: 'Eliminates frizz, restores shine, and reduces styling time for up to 4 months.',
  },

  // Nail Services
  {
    id: 'nail-gel',
    category: 'nails',
    title: 'Deluxe Gel Manicure',
    price: '$45',
    duration: '45 min',
    desc: 'Detailed cuticle care, shaping, long-lasting vegan gel polish, and hydrating hand massage.',
  },
  {
    id: 'nail-biab',
    category: 'nails',
    title: 'BIAB Builder Gel Overlay',
    price: '$65',
    duration: '60 min',
    desc: 'Strengthens natural nails with flexible builder gel. Perfect for healthy nail growth.',
  },
  {
    id: 'nail-acrylic-art',
    category: 'nails',
    title: 'Full Set Acrylics & Custom Art',
    price: '$75+',
    duration: '90 min',
    desc: 'Sculpted extensions with your choice of shape, chrome, French tips, or custom 3D art.',
  },
  {
    id: 'nail-pedi',
    category: 'nails',
    title: 'Aromatherapy Spa Pedicure',
    price: '$55',
    duration: '50 min',
    desc: 'Exfoliating sea salt scrub, hot stone foot massage, callus smoothing, and hot towel wrap.',
  },

  // Combo Packages
  {
    id: 'pkg-glow-up',
    category: 'packages',
    title: 'The "Glow Up" Luxury Day',
    price: '$220',
    duration: '3.5 hrs',
    desc: 'Haircut & blowout, gloss refresh, deluxe gel manicure, and soothing spa pedicure.',
  },
  {
    id: 'pkg-express',
    category: 'packages',
    title: 'Weekly Glam Express',
    price: '$95',
    duration: '75 min',
    desc: 'Express blowout with volume curls + express gel polish refresh for your hands.',
  },
]

/**
 * Mock Data for Appointment Booking System
 * Contains demo users, diagnostic centers, and time slots
 */

export const DEMO_USERS = [
  { id: 1, name: 'Amit' },
  { id: 2, name: 'Neha' },
  { id: 3, name: 'Rahul' },
  { id: 4, name: 'Sneha' },
  { id: 5, name: 'Vikram' }
];

export const DIAGNOSTIC_CENTERS = [
  {
    id: 1,
    name: 'HealthCare Diagnostic Center',
    address: '123 Medical Plaza, Downtown',
    distance: '5 km',
    isFar: true // Slightly far from typical location
  },
  {
    id: 2,
    name: 'City Lab Diagnostics',
    address: '456 Health Street, Midtown',
    distance: '2 km',
    isFar: false
  },
  {
    id: 3,
    name: 'MedPlus Lab',
    address: '789 Wellness Avenue, Uptown',
    distance: '1.5 km',
    isFar: false
  }
];

export const TIME_SLOTS = ['7:00 AM', '8:00 AM', '9:00 AM'];

export const FLOW_TYPES = {
  HOME: 'home',
  CENTER: 'center'
};

export const STEPS = {
  ENTRY: 'entry',
  FLOW_SELECTION: 'flow_selection',
  CENTER_SELECTION: 'center_selection',
  DISTANCE_CONFIRMATION: 'distance_confirmation',
  TIME_SELECTION: 'time_selection',
  CONFIRMATION: 'confirmation',
  COMPLETED: 'completed'
};

/**
 * Mock availability checker
 * Rule: All time slots are available
 */
export function checkSlotAvailability(time, flowType) {
  return true; // All slots are now available
}

/**
 * Get available slots for a time slot list
 */
export function getAvailableSlots(slots, flowType) {
  return slots.filter(slot => checkSlotAvailability(slot, flowType));
}

/**
 * Get user by ID
 */
export function getUserById(userId) {
  return DEMO_USERS.find(user => user.id === parseInt(userId));
}

/**
 * Get center by ID
 */
export function getCenterById(centerId) {
  return DIAGNOSTIC_CENTERS.find(center => center.id === parseInt(centerId));
}

/**
 * Validate user exists
 */
export function isValidUser(userId) {
  return DEMO_USERS.some(user => user.id === parseInt(userId));
}

/**
 * Booking State Machine - Valid Status Transitions
 * Prevents invalid state changes that could corrupt booking data
 */
export const VALID_TRANSITIONS = {
  // pending: Initial state when client creates booking
  pending: ['negotiating', 'declined', 'cancelled'],
  
  // negotiating: Vendor sent proposal or is preparing one
  // Can advance to payment if proposal accepted, revert to pending if dismissed,
  // or vendor can decline it
  negotiating: ['payment_pending', 'pending', 'cancelled', 'declined'],
  
  // payment_pending: Proposal accepted, awaiting client payment
  // Can complete payment → confirmed, or cancel
  payment_pending: ['confirmed', 'cancelled'],
  
  // confirmed: Payment received, fully booked
  confirmed: ['in_progress', 'cancelled'],
  
  // in_progress: Service being delivered
  in_progress: ['completed', 'cancelled'],
  
  // Terminal states (no transitions out)
  completed: [],
  cancelled: [],
  declined: [], // Terminal: vendor declined, no re-engagement
};

export function validateTransition(currentStatus, newStatus) {
  if (!VALID_TRANSITIONS[currentStatus]) {
    throw new Error(`Invalid current status: ${currentStatus}`);
  }
  
  if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
    throw new Error(
      `Invalid transition from ${currentStatus} to ${newStatus}. ` +
      `Valid transitions: ${VALID_TRANSITIONS[currentStatus].join(', ')}`
    );
  }
  
  return true;
}

export function isTerminalStatus(status) {
  return VALID_TRANSITIONS[status] && VALID_TRANSITIONS[status].length === 0;
}
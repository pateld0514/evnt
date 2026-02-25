/**
 * Booking State Machine - Valid Status Transitions
 * Prevents invalid state changes that could corrupt booking data
 */
export const VALID_TRANSITIONS = {
  pending: ['negotiating', 'declined', 'cancelled'],
  negotiating: ['payment_pending', 'cancelled', 'declined'],
  payment_pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
  declined: [], // Terminal state
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
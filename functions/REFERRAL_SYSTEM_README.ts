===== EVNT REFERRAL AUTOMATION SYSTEM =====

OVERVIEW
The referral system automatically rewards both referrers and referred users with one-time-use discounts.

REFERRAL TYPES & REWARDS
---
Vendor → Vendor: Both get 0% EVNT fee (1x use each)
Vendor → Client: Vendor gets $25, Client gets $25 (1x use each)
Client → Vendor: Client gets $25, Vendor gets 0% fee (1x use each)
Client → Client: Both get $25 (1x use each)

WORKFLOW
---
1. REFERRAL CREATED (pending)
   - Tracked in ReferralReward entity
   - referral_type and reward_type immutable

2. FIRST BOOKING COMPLETED (processReferral automation)
   - Referred person completes paid booking
   - Status: pending → earned
   - Notifications sent to both parties

3. NEXT BOOKING CHECKOUT (calculateProposal function)
   - Checks for earned referral rewards
   - Verifies referral_discount_used flag (one-time)
   - Applies $25 or 0% fee discount
   - Both parties see discount in proposal breakdown

4. PAYMENT CAPTURED (capturePayment function)
   - Marks referral as used
   - Sets referral_discount_used = true on User
   - Discount locked (cannot reuse)

SECURITY
---
✓ Entity-level one-time lock (referral_discount_used flag)
✓ Immutable reward types (set at creation)
✓ Audit trail (discount_applied_booking_id, discount_applied_date)
✓ Backend validation (server-side enforcement)
✓ UI transparency (both parties see benefits)

KEY FUNCTIONS
---
calculateProposal: Applies earned referral discounts
capturePayment: Locks in one-time use
processReferral: Marks referrals as earned on first booking

DATABASE CHANGES
---
User entity: Added referral_discount_used, referral_discount_booking_id
ReferralReward: Added referral_type, reward_type, discount_applied_date, discount_applied_booking_id, updated status enum

UI CHANGES
---
PaymentNegotiation: Shows "✨ Referral Credit Applied (One-time Use)" and "🎁 Vendor Referral Bonus Applied"
Both client and vendor see exact discount impact during checkout

ONE-TIME ENFORCEMENT
---
After payment capture, referral_discount_used is set to true
Next proposal check fails (returns no discount)
Cannot be bypassed via API (backend validation)
Audit trail proves which booking applied discount
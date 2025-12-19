import React from "react";
import { format } from "date-fns";

export default function ProfessionalContract({ booking, vendor }) {
  const contractNumber = `EVNT-SA-${new Date().getFullYear()}-${booking.id?.slice(0, 8).toUpperCase()}`;
  const effectiveDate = booking.contract_signed_date || new Date().toISOString();

  return (
    <div className="bg-white p-16 max-w-5xl mx-auto print:p-12 text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Professional Header */}
      <div className="text-center mb-12 pb-8 border-b-4 border-black">
        <div className="inline-block bg-black text-white px-8 py-4 rounded-lg mb-4">
          <h1 className="text-4xl font-black tracking-tight">EVNT</h1>
          <p className="text-xs tracking-wider opacity-90 mt-1">EVENT SERVICES PLATFORM</p>
        </div>
        <h2 className="text-3xl font-bold mb-4 text-gray-800">SERVICE AGREEMENT</h2>
        <div className="inline-block bg-gray-100 px-6 py-3 rounded-lg">
          <p className="text-sm font-bold">Contract No: {contractNumber}</p>
          <p className="text-xs text-gray-600 mt-1">Date: {format(new Date(effectiveDate), "MMMM dd, yyyy")}</p>
        </div>
      </div>

      {/* Parties */}
      <div className="mb-8">
        <p className="mb-4">
          This Event Services Agreement (the "Agreement") is entered into as of {format(new Date(effectiveDate), "MMMM dd, yyyy")}, 
          by and between:
        </p>
        
        <div className="ml-8 mb-4">
          <p className="font-bold">{booking.vendor_name}</p>
          <p className="text-gray-700 italic">("Service Provider" or "Vendor")</p>
          <p className="text-sm text-gray-600 mt-1">Verified through EVNT Platform (ID: {vendor?.id?.slice(0, 8) || "VERIFIED"})</p>
        </div>

        <p className="mb-2">and</p>

        <div className="ml-8 mb-4">
          <p className="font-bold">{booking.client_name}</p>
          <p className="text-gray-700 italic">("Client" or "Host")</p>
          <p className="text-sm text-gray-600 mt-1">{booking.location}</p>
        </div>

        <p>
          (collectively referred to as the "Parties")
        </p>
      </div>

      {/* Important Notice */}
      <div className="mb-8 bg-yellow-50 border-2 border-yellow-400 p-6 rounded-lg">
        <h2 className="text-lg font-bold mb-3 text-yellow-900">⚠️ IMPORTANT MARKETPLACE NOTICE</h2>
        <p className="text-sm mb-2 font-bold">
          Evnt, Inc. is a technology marketplace platform and does NOT provide event services.
        </p>
        <p className="text-sm mb-2">
          Service Provider ({booking.vendor_name}) is an independent contractor, not an employee or agent of EVNT. 
          This agreement is between Client and Service Provider only. EVNT facilitates the connection and payment but is not 
          responsible for service performance, quality, delays, or disputes.
        </p>
        <p className="text-sm">
          By proceeding with this booking, both parties acknowledge they have read and agree to the EVNT Vendor Marketplace Agreement 
          and Client Terms outlined in this document.
        </p>
      </div>

      {/* Recitals */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4 uppercase border-b-2 border-black pb-2">Recitals & Background</h2>
        <p className="mb-3">
          <strong>WHEREAS,</strong> Service Provider is an independent contractor engaged in the business of providing 
          {vendor?.category?.replace(/_/g, ' ') || "event"} services through the EVNT marketplace platform;
        </p>
        <p className="mb-3">
          <strong>WHEREAS,</strong> Client desires to engage Service Provider to provide such services for an event (the "Event");
        </p>
        <p className="mb-3">
          <strong>WHEREAS,</strong> EVNT, Inc. operates a technology platform that facilitates connections between clients and 
          independent service providers but does not provide services directly;
        </p>
        <p>
          <strong>NOW, THEREFORE,</strong> in consideration of the mutual covenants and agreements herein contained, and for other good and 
          valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:
        </p>
      </div>

      {/* Article 1: Event Details */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">ARTICLE 1: EVENT DETAILS</h2>
        <div className="ml-6 space-y-3">
          <p><span className="font-semibold">1.1 Event Type:</span> {booking.event_type}</p>
          <p><span className="font-semibold">1.2 Event Date:</span> {format(new Date(booking.event_date), "EEEE, MMMM dd, yyyy")}</p>
          <p><span className="font-semibold">1.3 Event Location:</span> {booking.location}</p>
          {booking.guest_count && (
            <p><span className="font-semibold">1.4 Expected Attendance:</span> Approximately {booking.guest_count} guests</p>
          )}
        </div>
      </div>

      {/* Article 2: Services */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">ARTICLE 2: SERVICES TO BE PROVIDED</h2>
        <div className="ml-6 space-y-3">
          <p>
            <span className="font-semibold">2.1 Scope of Services:</span> Service Provider agrees to provide the following services:
          </p>
          <div className="ml-6 bg-gray-50 p-4 rounded border border-gray-200">
            <p>{booking.service_description}</p>
          </div>
          <p>
            <span className="font-semibold">2.2 Professional Standards:</span> Service Provider warrants that all services shall be performed 
            in a professional, workmanlike manner consistent with industry standards and practices.
          </p>
          <p>
            <span className="font-semibold">2.3 Equipment:</span> Service Provider shall provide all necessary equipment, materials, 
            and supplies required to perform the services, unless otherwise specified in writing.
          </p>
        </div>
      </div>

      {/* Article 3: Compensation */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">ARTICLE 3: COMPENSATION AND PAYMENT</h2>
        <div className="ml-6 space-y-3">
          <p>
            <span className="font-semibold">3.1 Total Fee:</span> Client agrees to pay Service Provider a total fee of 
            ${booking.agreed_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
            for the services described herein.
          </p>
          
          {booking.additional_fees && booking.additional_fees.length > 0 && (
            <div>
              <p className="font-semibold">3.2 Additional Fees:</p>
              <div className="ml-6">
                {booking.additional_fees.map((fee, idx) => (
                  <p key={idx}>• {fee.name}: ${fee.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                ))}
              </div>
            </div>
          )}

          <p>
            <span className="font-semibold">3.3 Platform Fee:</span> In addition to the service fee, Client shall pay a platform 
            and processing fee of ${booking.platform_fee_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
            ({booking.platform_fee_percent}% of total services) to EVNT Platform Services LLC.
          </p>

          <p>
            <span className="font-semibold">3.4 Total Amount Due:</span> The total amount payable by Client is 
            ${booking.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
          </p>

          <p>
            <span className="font-semibold">3.5 Payment Terms:</span> Payment shall be processed through the EVNT Platform 
            prior to the Event date. Funds shall be held in escrow by EVNT and released to Service Provider 24 hours after 
            the Event, subject to the dispute resolution provisions of this Agreement.
          </p>
        </div>
      </div>

      {/* Article 4: Cancellation */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">ARTICLE 4: CANCELLATION AND TERMINATION</h2>
        <div className="ml-6 space-y-3">
          <p>
            <span className="font-semibold">4.1 Client Cancellation:</span> Client may cancel this Agreement subject to the following terms:
          </p>
          <div className="ml-6">
            <p>a) Cancellation more than 60 days before Event: Full refund minus 5% processing fee</p>
            <p>b) Cancellation 30-60 days before Event: 50% refund</p>
            <p>c) Cancellation less than 30 days before Event: No refund</p>
          </div>
          <p>
            <span className="font-semibold">4.2 Service Provider Cancellation:</span> If Service Provider cancels within 30 days of the Event 
            without cause, Service Provider shall forfeit any deposits and Client shall receive a full refund plus 10% of the 
            service fee as compensation.
          </p>
          <p>
            <span className="font-semibold">4.3 Force Majeure:</span> Neither party shall be liable for failure to perform due to causes 
            beyond reasonable control, including but not limited to acts of God, war, strikes, or government restrictions.
          </p>
        </div>
      </div>

      {/* Article 5: Liability and Insurance */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">ARTICLE 5: LIABILITY AND INSURANCE</h2>
        <div className="ml-6 space-y-3">
          <p>
            <span className="font-semibold">5.1 Insurance:</span> Service Provider represents that they maintain appropriate liability 
            insurance coverage for the services to be provided.
          </p>
          <p>
            <span className="font-semibold">5.2 Limitation of Liability:</span> Service Provider's total liability under this Agreement 
            shall not exceed the total compensation paid by Client.
          </p>
          <p>
            <span className="font-semibold">5.3 Indemnification:</span> Each party agrees to indemnify and hold harmless the other party 
            from any claims arising from their own negligence or willful misconduct.
          </p>
        </div>
      </div>

      {/* Article 6: Dispute Resolution */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">ARTICLE 6: DISPUTE RESOLUTION</h2>
        <div className="ml-6 space-y-3">
          <p>
            <span className="font-semibold">6.1 Good Faith Negotiation:</span> In the event of any dispute, the Parties agree to first 
            attempt resolution through good faith negotiation.
          </p>
          <p>
            <span className="font-semibold">6.2 EVNT Mediation:</span> If direct negotiation fails, the Parties agree to submit the 
            dispute to mediation through EVNT Platform Services LLC before pursuing legal action.
          </p>
          <p>
            <span className="font-semibold">6.3 Governing Law:</span> This Agreement shall be governed by the laws of the District of Columbia, 
            without regard to conflict of law principles.
          </p>
        </div>
      </div>

      {/* Article 7: General Provisions */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">ARTICLE 7: GENERAL PROVISIONS</h2>
        <div className="ml-6 space-y-3">
          <p>
            <span className="font-semibold">7.1 Entire Agreement:</span> This Agreement, together with the EVNT Vendor Marketplace Agreement 
            and Client Terms, constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, or agreements.
          </p>
          <p>
            <span className="font-semibold">7.2 Amendments:</span> This Agreement may only be amended in writing signed by both Parties.
          </p>
          <p>
            <span className="font-semibold">7.3 Severability:</span> If any provision of this Agreement is found to be unenforceable, 
            the remaining provisions shall remain in full force and effect.
          </p>
          <p>
            <span className="font-semibold">7.4 Digital Signatures:</span> The Parties agree that digital signatures executed through 
            the EVNT Platform shall have the same legal effect as handwritten signatures under the ESIGN Act and applicable state law.
          </p>
          <p>
            <span className="font-semibold">7.5 Independent Contractors:</span> Service Provider is an independent contractor and not an 
            employee, agent, or representative of EVNT or Client. Service Provider is solely responsible for all taxes, insurance, licenses, 
            permits, and equipment.
          </p>
        </div>
      </div>

      {/* EVNT Marketplace Terms */}
      <div className="mb-12 page-break-before">
        <div className="bg-gray-100 p-8 rounded-lg border-2 border-gray-300">
          <h2 className="text-xl font-black mb-6 text-center uppercase">EVNT VENDOR MARKETPLACE AGREEMENT</h2>
          
          <div className="space-y-4 text-xs leading-relaxed">
            <p className="font-bold">
              By registering for, accessing, or providing services through the EVNT platform, Vendor ({booking.vendor_name}) 
              agrees to be bound by these terms.
            </p>

            <div>
              <p className="font-bold text-sm mb-2">PLATFORM ROLE AND PURPOSE</p>
              <p>
                EVNT operates a technology-based marketplace that connects event clients with independent event service providers. 
                EVNT does not provide event services, does not control Vendor operations, and is not a party to any agreement between 
                Vendor and Client beyond payment facilitation.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">INDEPENDENT CONTRACTOR STATUS</p>
              <p>
                Vendor is an independent contractor and not an employee, agent, partner, or representative of EVNT. Vendor has no 
                authority to bind EVNT. Vendor is solely responsible for all taxes, withholdings, insurance, permits, licenses, 
                certifications, equipment, personnel, and expenses related to services.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">PAYMENTS, FEES, AND PAYOUTS</p>
              <p>
                Clients remit payment through the EVNT platform. EVNT charges Vendor a platform service fee (currently {booking.platform_fee_percent}%) 
                for marketplace access, payment processing, dispute resolution, and support services. EVNT will remit Vendor payouts within 24-48 hours 
                following successful completion of services, subject to dispute resolution, refunds, chargebacks, or violations of this Agreement.
              </p>
              <p className="mt-2">
                EVNT reserves the right to withhold, delay, or reverse payouts in cases of suspected fraud, non-performance, misconduct, or Client disputes.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">QUALITY STANDARDS AND CONDUCT</p>
              <p>
                Vendor agrees to maintain high standards of professionalism, responsiveness, accuracy, and reliability. Vendor shall not engage in 
                misleading representations, discriminatory behavior, harassment, illegal activity, or conduct that harms Clients, EVNT, or the 
                platform's reputation. Violation may result in immediate account suspension or termination.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">INSURANCE AND LIABILITY</p>
              <p>
                Vendor is solely responsible for maintaining appropriate insurance coverage, including general liability and any industry-specific insurance. 
                EVNT does not provide insurance coverage for Vendor or Vendor's services. Vendor assumes all risk arising from performance of services.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">INDEMNIFICATION</p>
              <p>
                Vendor agrees to indemnify, defend, and hold harmless EVNT and its officers, directors, employees, and affiliates from any claims, damages, 
                losses, liabilities, costs, or expenses arising out of or related to Vendor's services, actions, omissions, breaches of this Agreement, 
                or interactions with Clients.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">LIMITATION OF LIABILITY</p>
              <p>
                To the maximum extent permitted by law, EVNT shall not be liable for indirect, incidental, consequential, special, or punitive damages. 
                EVNT's total liability shall not exceed the platform fees paid by Vendor to EVNT during the six (6) months preceding the claim.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">NON-CIRCUMVENTION</p>
              <p>
                Vendor agrees not to bypass the EVNT platform to transact directly with Clients introduced through EVNT for a period of twelve (12) months 
                following initial contact. Violation may result in liability for unpaid platform fees and account termination.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">TERMINATION</p>
              <p>
                Either party may terminate this Agreement at any time. EVNT may immediately suspend or terminate Vendor access for violations, misconduct, 
                or harm to platform integrity. Termination does not relieve Vendor of obligations incurred prior to termination.
              </p>
            </div>

            <div>
              <p className="font-bold text-sm mb-2">GOVERNING LAW</p>
              <p>
                This Agreement shall be governed by the laws of the District of Columbia, without regard to conflict of law principles. 
                Any disputes shall be resolved through binding arbitration in Washington, DC, except where prohibited by law.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-4 border-black pt-10 bg-gradient-to-b from-white to-gray-50 -mx-16 px-16 -mb-16 pb-16 print:-mx-12 print:px-12 print:-mb-12 print:pb-12">
        <p className="mb-10 text-center font-bold text-lg text-gray-700">
          IN WITNESS WHEREOF, the Parties have executed this Agreement electronically
        </p>

        <div className="grid grid-cols-2 gap-12 mb-10">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Client / Host</p>
            <p className="text-3xl mb-4 text-gray-800" style={{ fontFamily: 'cursive' }}>{booking.client_name}</p>
            <div className="border-t-2 border-black pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Digital Signature</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">✓ SIGNED</span>
              </div>
              <p className="text-xs text-gray-600">Authenticated via EVNT Platform</p>
              <p className="text-xs text-gray-600 mt-2 font-bold">
                Date: {booking.contract_signed_date ? format(new Date(booking.contract_signed_date), "MMM dd, yyyy") : "Pending"}
              </p>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Service Provider</p>
            <p className="text-3xl mb-4 text-gray-800" style={{ fontFamily: 'cursive' }}>{booking.vendor_name}</p>
            <div className="border-t-2 border-black pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">Digital Signature</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold">✓ SIGNED</span>
              </div>
              <p className="text-xs text-gray-600">Authenticated via EVNT Platform</p>
              <p className="text-xs text-gray-600 mt-2 font-bold">
                Date: {booking.contract_signed_date ? format(new Date(booking.contract_signed_date), "MMM dd, yyyy") : "Pending"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-black text-white p-6 rounded-lg mt-8 text-xs text-center">
          <p className="font-bold text-sm mb-2">This agreement is facilitated through Evnt, Inc.</p>
          <p>1200 K Street NW, Suite 400, Washington, DC 20005</p>
          <p className="mt-1">support@evnt.com | (202) 555-EVNT</p>
          <p className="mt-3 opacity-75">Contract ID: {contractNumber}</p>
          <p className="mt-1 opacity-75">This is a legally binding agreement. Both parties should retain a copy for their records.</p>
        </div>
      </div>
    </div>
  );
}
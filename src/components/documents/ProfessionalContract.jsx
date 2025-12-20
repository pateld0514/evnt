import React from "react";
import { format } from "date-fns";

export default function ProfessionalContract({ booking, vendor }) {
  const contractNumber = `EVNT-SA-${new Date().getFullYear()}-${booking.id?.slice(0, 8).toUpperCase()}`;
  const effectiveDate = booking.contract_signed_date || new Date().toISOString();

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto" style={{ fontFamily: 'Times New Roman, serif', fontSize: '11pt', lineHeight: '1.8' }}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">EVENT SERVICES AGREEMENT</h1>
        <p><strong>Contract No:</strong> {contractNumber}</p>
        <p><strong>Effective Date:</strong> {format(new Date(effectiveDate), "MMMM dd, yyyy")}</p>
      </div>

      {/* Parties */}
      <div className="mb-6">
        <p className="mb-4">
          This Event Services Agreement (the "Agreement") is entered into as of {format(new Date(effectiveDate), "MMMM dd, yyyy")}, 
          by and between:
        </p>
        
        <div className="ml-8 mb-4">
          <p className="font-bold">{booking.vendor_name}</p>
          <p className="italic">("Service Provider" or "Vendor")</p>
        </div>

        <p className="mb-2">and</p>

        <div className="ml-8 mb-4">
          <p className="font-bold">{booking.client_name}</p>
          <p className="italic">("Client" or "Host")</p>
          <p className="text-sm">{booking.client_email}</p>
        </div>

        <p>(collectively referred to as the "Parties")</p>
      </div>

      {/* Important Notice */}
      <div className="mb-6 p-4 border-2 border-black">
        <p className="font-bold text-center mb-2">⚠️ IMPORTANT MARKETPLACE NOTICE</p>
        <p className="text-sm mb-2">
          <strong>Evnt, Inc.</strong> is a technology marketplace platform and does NOT provide event services. 
          Service Provider is an independent contractor, not an employee or agent of Evnt.
        </p>
        <p className="text-sm">
          This agreement is between Client and Service Provider only. Evnt facilitates the connection and payment 
          but is not responsible for service performance, quality, delays, or disputes.
        </p>
      </div>

      {/* Event Details */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3 uppercase border-b border-black pb-1">1. Event Details</h2>
        <div className="ml-6">
          <p><strong>Event Type:</strong> {booking.event_type}</p>
          <p><strong>Event Date:</strong> {format(new Date(booking.event_date), "EEEE, MMMM dd, yyyy")}</p>
          <p><strong>Event Location:</strong> {booking.location}</p>
          {booking.guest_count && <p><strong>Expected Attendance:</strong> Approximately {booking.guest_count} guests</p>}
        </div>
      </div>

      {/* Services */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3 uppercase border-b border-black pb-1">2. Services to be Provided</h2>
        <div className="ml-6">
          <p className="mb-2"><strong>Scope of Services:</strong></p>
          <div className="ml-4 p-3 bg-gray-100 border border-gray-300">
            <p>{booking.service_description || `Professional ${booking.event_type} services as described in vendor profile`}</p>
          </div>
          <p className="mt-3">
            Service Provider warrants that all services shall be performed in a professional, workmanlike manner 
            consistent with industry standards.
          </p>
        </div>
      </div>

      {/* Compensation */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3 uppercase border-b border-black pb-1">3. Compensation and Payment</h2>
        <div className="ml-6">
          <p className="mb-2">
            <strong>Service Fee:</strong> Client agrees to pay Service Provider ${booking.agreed_price?.toFixed(2)} 
            for the services described herein.
          </p>
          
          {booking.additional_fees && booking.additional_fees.length > 0 && (
            <div className="mb-2">
              <p className="font-bold">Additional Fees:</p>
              <ul className="ml-6 list-disc">
                {booking.additional_fees.map((fee, idx) => (
                  <li key={idx}>{fee.name}: ${parseFloat(fee.amount)?.toFixed(2)}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="mb-2">
            <strong>Platform Fee:</strong> Client shall pay ${booking.platform_fee_amount?.toFixed(2)} 
            ({booking.platform_fee_percent}%) to Evnt, Inc. for platform services.
          </p>

          <p className="mb-2">
            <strong>Total Amount Due:</strong> ${booking.total_amount?.toFixed(2)}
          </p>

          <p>
            <strong>Payment Terms:</strong> Payment processed through Evnt Platform. Funds held in escrow and released 
            to Service Provider 24-48 hours after Event completion, subject to dispute resolution.
          </p>
        </div>
      </div>

      <div className="page-break-after"></div>

      {/* Cancellation */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3 uppercase border-b border-black pb-1">4. Cancellation and Termination</h2>
        <div className="ml-6 text-sm">
          <p className="mb-2"><strong>Client Cancellation:</strong></p>
          <ul className="ml-6 list-disc mb-3">
            <li>More than 60 days before Event: Full refund minus 5% processing fee</li>
            <li>30-60 days before Event: 50% refund</li>
            <li>Less than 30 days before Event: No refund</li>
          </ul>
          <p className="mb-2">
            <strong>Service Provider Cancellation:</strong> If Service Provider cancels within 30 days without cause, 
            Service Provider forfeits deposits and Client receives full refund plus 10% compensation.
          </p>
          <p>
            <strong>Force Majeure:</strong> Neither party liable for failure to perform due to causes beyond reasonable control.
          </p>
        </div>
      </div>

      {/* Liability */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3 uppercase border-b border-black pb-1">5. Liability and Insurance</h2>
        <div className="ml-6 text-sm">
          <p className="mb-2">
            Service Provider maintains appropriate liability insurance. Service Provider's total liability shall not 
            exceed total compensation paid by Client.
          </p>
          <p>
            Each party indemnifies the other from claims arising from their own negligence or willful misconduct.
          </p>
        </div>
      </div>

      {/* Dispute Resolution */}
      <div className="mb-6">
        <h2 className="font-bold text-lg mb-3 uppercase border-b border-black pb-1">6. Dispute Resolution</h2>
        <div className="ml-6 text-sm">
          <p className="mb-2">
            Parties agree to first attempt resolution through good faith negotiation. If unsuccessful, disputes may be 
            submitted to mediation through Evnt Platform Services.
          </p>
          <p>
            This Agreement governed by laws of District of Columbia. Digital signatures via Evnt Platform have same 
            legal effect as handwritten signatures.
          </p>
        </div>
      </div>

      {/* Vendor Marketplace Agreement */}
      <div className="mt-8 pt-8 border-t-2 border-black">
        <h2 className="font-bold text-center text-xl mb-6 uppercase">EVNT VENDOR MARKETPLACE AGREEMENT</h2>
        
        <div className="text-xs space-y-4">
          <p>
            This Vendor Marketplace Agreement is entered into by and between Evnt, Inc. ("Evnt," "Company," or "Platform") 
            and {booking.vendor_name} ("Vendor").
          </p>

          <div>
            <p className="font-bold mb-1">PLATFORM ROLE AND PURPOSE</p>
            <p>
              Evnt operates a technology-based marketplace connecting event clients with independent service providers. 
              Evnt does not provide event services, does not control Vendor operations, and is not a party to any agreement 
              between Vendor and Client.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">INDEPENDENT CONTRACTOR STATUS</p>
            <p>
              Vendor is an independent contractor and not an employee, agent, partner, or representative of Evnt. 
              Vendor is solely responsible for all taxes, withholdings, insurance, permits, licenses, certifications, 
              equipment, personnel, and expenses related to services.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">SERVICES AND BOOKINGS</p>
            <p>
              Vendor agrees to provide event-related services as described in Vendor's profile and individual bookings. 
              All service details, pricing, timelines, deliverables, and cancellation terms must be clearly disclosed 
              to Clients prior to booking. Vendor is solely responsible for performing services in a professional, 
              lawful, and timely manner.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">PAYMENTS, FEES, AND PAYOUTS</p>
            <p>
              Clients remit payment through Evnt platform. Evnt charges Vendor a platform service fee ({booking.platform_fee_percent}%) 
              for marketplace access, payment processing, dispute resolution, and support. Evnt remits Vendor payouts within 24-48 hours 
              following successful service completion, subject to dispute resolution, refunds, or violations.
            </p>
            <p className="mt-2">
              Evnt reserves the right to withhold, delay, or reverse payouts in cases of suspected fraud, non-performance, 
              misconduct, or Client disputes.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">CANCELLATIONS, REFUNDS, AND DISPUTES</p>
            <p>
              Vendor must clearly define and honor cancellation and refund policies. Failure to appear, last-minute 
              cancellations without cause, or material deviation from agreed services may result in mandatory refunds, 
              penalties, account suspension, or termination. Evnt may assist with dispute resolution. Evnt's determination 
              regarding platform-related disputes is final.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">QUALITY STANDARDS AND CONDUCT</p>
            <p>
              Vendor maintains high standards of professionalism, responsiveness, accuracy, and reliability. Vendor shall not 
              engage in misleading representations, discriminatory behavior, harassment, illegal activity, or conduct that 
              harms Clients, Evnt, or platform reputation.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">INSURANCE AND LIABILITY</p>
            <p>
              Vendor is solely responsible for maintaining appropriate insurance coverage, including general liability and 
              industry-specific insurance. Evnt does not provide insurance coverage for Vendor. Vendor assumes all risk 
              arising from performance of services.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">INDEMNIFICATION</p>
            <p>
              Vendor indemnifies, defends, and holds harmless Evnt and its officers, directors, employees, and affiliates 
              from any claims, damages, losses, liabilities, costs, or expenses arising from Vendor's services, actions, 
              omissions, breaches, or Client interactions.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">LIMITATION OF LIABILITY</p>
            <p>
              To maximum extent permitted by law, Evnt not liable for indirect, incidental, consequential, special, or 
              punitive damages. Evnt's total liability shall not exceed platform fees paid by Vendor during six (6) months 
              preceding the claim.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">INTELLECTUAL PROPERTY</p>
            <p>
              Vendor retains ownership of Vendor intellectual property. Vendor grants Evnt a non-exclusive, worldwide, 
              royalty-free license to use Vendor's name, trademarks, images, service descriptions, and content for platform 
              operations, marketing, and promotion.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">DATA AND COMMUNICATIONS</p>
            <p>
              Evnt may collect, store, and use platform data to operate and improve services. Vendor shall not misuse 
              Client data or communicate outside platform to circumvent fees.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">NON-CIRCUMVENTION</p>
            <p>
              Vendor agrees not to bypass Evnt platform to transact directly with Clients introduced through Evnt for 
              twelve (12) months following initial contact.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">TERMINATION</p>
            <p>
              Either party may terminate this Agreement at any time. Evnt may immediately suspend or terminate Vendor 
              access for violations, misconduct, or harm to platform integrity. Termination does not relieve Vendor of 
              obligations incurred prior to termination.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">FORCE MAJEURE</p>
            <p>
              Neither party liable for delays or failure to perform due to events beyond reasonable control, including 
              natural disasters, government actions, labor disputes, or acts of God.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">GOVERNING LAW AND DISPUTE RESOLUTION</p>
            <p>
              This Agreement governed by laws of District of Columbia. Disputes resolved through binding arbitration, 
              except where prohibited by law.
            </p>
          </div>

          <div>
            <p className="font-bold mb-1">ENTIRE AGREEMENT</p>
            <p>
              This Agreement constitutes entire agreement between parties and supersedes prior agreements. Evnt may 
              modify this Agreement with notice through platform.
            </p>
          </div>
        </div>
      </div>

      {/* Signatures */}
      <div className="mt-8 pt-8 border-t-2 border-black">
        <p className="text-center font-bold mb-6">
          IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date first written above.
        </p>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-2xl mb-8" style={{ fontFamily: 'cursive' }}>{booking.client_name}</p>
            <div className="border-t-2 border-black pt-2">
              <p className="font-bold">Client Signature</p>
              <p className="text-xs">Digitally signed via Evnt Platform</p>
              <p className="text-xs mt-1">
                Date: {booking.contract_signed_date ? format(new Date(booking.contract_signed_date), "MMMM dd, yyyy") : "________________"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-2xl mb-8" style={{ fontFamily: 'cursive' }}>{booking.vendor_name}</p>
            <div className="border-t-2 border-black pt-2">
              <p className="font-bold">Service Provider Signature</p>
              <p className="text-xs">Digitally signed via Evnt Platform</p>
              <p className="text-xs mt-1">
                Date: {booking.contract_signed_date ? format(new Date(booking.contract_signed_date), "MMMM dd, yyyy") : "________________"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-400 text-center text-xs">
        <p className="font-bold">Evnt, Inc.</p>
        <p>1200 K Street NW, Suite 400, Washington, DC 20005</p>
        <p className="mt-1">support@evnt.com | (202) 555-EVNT</p>
        <p className="mt-2">Contract ID: {contractNumber}</p>
      </div>
    </div>
  );
}
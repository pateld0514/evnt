import React from "react";
import { format } from "date-fns";

export default function ProfessionalInvoice({ booking }) {
  const invoiceNumber = booking.invoice_number || `INV-${new Date().getFullYear()}-${booking.id?.slice(0, 8).toUpperCase()}`;
  const issueDate = booking.contract_signed_date || new Date().toISOString();
  const dueDate = booking.event_date;

  return (
    <div className="bg-white p-16 max-w-5xl mx-auto print:p-12" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Company Letterhead */}
      <div className="border-b-4 border-black pb-8 mb-8 bg-gradient-to-r from-black to-gray-800 text-white p-6 -m-16 mb-8 print:-m-12 print:mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-6xl font-black tracking-tight mb-3">EVNT</h1>
            <p className="text-sm opacity-90">Premium Event Services Platform</p>
            <p className="text-sm opacity-90 mt-3">1200 K Street NW, Suite 400</p>
            <p className="text-sm opacity-90">Washington, DC 20005</p>
            <p className="text-sm opacity-90">support@evnt.com | (202) 555-EVNT</p>
          </div>
          <div className="text-right">
            <div className="bg-white text-black p-4 rounded-lg">
              <h2 className="text-3xl font-black mb-2">INVOICE</h2>
              <p className="text-sm font-bold">#{invoiceNumber}</p>
              <p className="text-xs text-gray-600 mt-2">Issued: {format(new Date(issueDate), "MMM dd, yyyy")}</p>
              <p className="text-xs text-gray-600">Due: {format(new Date(dueDate), "MMM dd, yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To / From */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-600">
          <p className="text-xs font-black text-blue-600 uppercase tracking-wide mb-3">BILL TO</p>
          <p className="text-xl font-black mb-2">{booking.client_name}</p>
          <p className="text-sm text-gray-700">{booking.client_email || "Client"}</p>
          <p className="text-sm text-gray-600 mt-2">{booking.location || "Event Location"}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-600">
          <p className="text-xs font-black text-green-600 uppercase tracking-wide mb-3">SERVICE PROVIDER</p>
          <p className="text-xl font-black mb-2">{booking.vendor_name}</p>
          <p className="text-sm text-gray-700">Via EVNT Platform</p>
          <p className="text-sm text-gray-600 mt-2">Verified Vendor</p>
        </div>
      </div>

      {/* Event Details */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-8 rounded-xl mb-8 border-2 border-purple-200 shadow-sm">
        <h3 className="text-lg font-black uppercase tracking-wide mb-6 text-purple-800 flex items-center gap-2">
          <span className="bg-purple-800 text-white px-3 py-1 rounded">📅</span>
          Event Details
        </h3>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <span className="text-gray-500 text-xs font-bold uppercase block mb-1">Event Type</span>
            <span className="font-bold text-lg">{booking.event_type}</span>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <span className="text-gray-500 text-xs font-bold uppercase block mb-1">Event Date</span>
            <span className="font-bold text-lg">{format(new Date(booking.event_date), "MMM dd, yyyy")}</span>
          </div>
          <div className="col-span-2 bg-white p-4 rounded-lg shadow-sm">
            <span className="text-gray-500 text-xs font-bold uppercase block mb-1">Venue</span>
            <span className="font-bold">{booking.location}</span>
          </div>
          {booking.guest_count && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <span className="text-gray-500 text-xs font-bold uppercase block mb-1">Attendees</span>
              <span className="font-bold text-lg">{booking.guest_count} Guests</span>
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-4 text-xs font-bold text-gray-600 uppercase tracking-wide">Description</th>
            <th className="text-right py-4 text-xs font-bold text-gray-600 uppercase tracking-wide">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-200">
            <td className="py-4">
              <p className="font-bold text-base mb-1">{booking.service_description || "Event Services"}</p>
              <p className="text-sm text-gray-600">Professional {booking.event_type} services</p>
            </td>
            <td className="text-right font-bold text-base">${booking.agreed_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>

          {booking.additional_fees && booking.additional_fees.map((fee, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="py-4">
                <p className="font-bold text-base mb-1">{fee.name}</p>
                {fee.description && <p className="text-sm text-gray-600">{fee.description}</p>}
              </td>
              <td className="text-right font-bold text-base">${fee.amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          ))}

          <tr className="border-b border-gray-200">
            <td className="py-4">
              <p className="font-bold text-base mb-1">Platform & Processing Fee</p>
              <p className="text-sm text-gray-600">
                Includes secure payment processing, escrow protection, and customer support ({booking.platform_fee_percent}%)
              </p>
            </td>
            <td className="text-right font-bold text-base">${booking.platform_fee_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      {/* Total */}
      <div className="flex justify-end mb-12">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white p-8 rounded-xl shadow-2xl">
            <p className="text-sm font-bold uppercase tracking-wide mb-2 opacity-90">Total Amount Due</p>
            <div className="flex items-baseline justify-between">
              <span className="text-5xl font-black">${booking.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-sm font-bold bg-white text-green-700 px-3 py-1 rounded-full">USD</span>
            </div>
            <p className="text-xs mt-3 opacity-75">Payment processed securely via Stripe</p>
          </div>
        </div>
      </div>

      {/* Legal Terms & Payment Information */}
      <div className="border-t-2 border-gray-200 pt-8 space-y-8">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide mb-4 text-gray-800">PAYMENT TERMS & PROCESSING</h3>
          <div className="space-y-3 text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Payment Processing:</strong> All payments are processed securely through Stripe Connect. Payment is due upon receipt unless otherwise stated. 
              Funds are held in EVNT's secure escrow account pending successful service completion.
            </p>
            <p>
              <strong>Escrow Release:</strong> Vendor payment will be released within 24-48 hours after the event date ({format(new Date(booking.event_date), "MMMM dd, yyyy")}), 
              subject to dispute resolution period and compliance with platform policies.
            </p>
            <p>
              <strong>Platform Fee:</strong> The EVNT platform fee covers secure payment processing, dispute resolution services, customer support, 
              marketplace access, and platform maintenance.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide mb-4 text-gray-800">CANCELLATION & REFUND POLICY</h3>
          <div className="space-y-3 text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
            <p><strong>Client Cancellation:</strong></p>
            <ul className="list-disc ml-5 space-y-1">
              <li>More than 60 days before event: Full refund minus 5% processing fee</li>
              <li>30-60 days before event: 50% refund</li>
              <li>Less than 30 days before event: No refund, except as required by law or agreed in service contract</li>
            </ul>
            <p className="mt-3">
              <strong>Vendor Cancellation:</strong> If Vendor cancels within 30 days of the event without cause, Client shall receive a full refund 
              plus 10% of the service fee as compensation. Vendor may forfeit platform privileges.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide mb-4 text-gray-800">EVNT CLIENT MARKETPLACE TERMS</h3>
          <div className="text-xs text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
            <p className="font-bold mb-2">IMPORTANT NOTICE:</p>
            <p className="mb-2">
              <strong>Evnt, Inc.</strong> operates a technology marketplace platform that connects event clients with independent service providers. 
              EVNT does not provide event services directly and is not a party to any agreement between Client and Vendor.
            </p>
            <p className="mb-2">
              <strong>Independent Contractors:</strong> All vendors are independent contractors and not employees or agents of EVNT. 
              Vendors are solely responsible for service performance, quality, equipment, insurance, permits, and all aspects of service delivery.
            </p>
            <p className="mb-2">
              <strong>Service Agreements:</strong> Any agreements for services are solely between Client and Vendor. The service provider 
              ({booking.vendor_name}) is responsible for fulfilling all commitments made in the booking.
            </p>
            <p>
              <strong>Liability Limitation:</strong> EVNT is not responsible for Vendor performance, service quality, delays, cancellations, 
              damages, or disputes arising from services. EVNT's role is limited to facilitating discovery, booking, and payment processing.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black uppercase tracking-wide mb-4 text-gray-800">DISPUTE RESOLUTION</h3>
          <div className="space-y-2 text-xs text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
            <p>
              <strong>Reporting Period:</strong> Clients must report service issues within 24 hours of the event date for dispute review.
            </p>
            <p>
              <strong>Resolution Process:</strong> EVNT may, but is not obligated to, assist with dispute mediation. EVNT's determination 
              regarding platform-related payment disputes is final and binding.
            </p>
            <p>
              <strong>Chargebacks:</strong> Unauthorized chargebacks may result in account suspension and legal action. 
              All disputes must first be addressed through EVNT's resolution process.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t-2 border-gray-800 text-center text-xs text-gray-600">
        <p className="font-bold text-sm mb-2">Evnt, Inc.</p>
        <p>1200 K Street NW, Suite 400, Washington, DC 20005</p>
        <p className="mt-1">support@evnt.com | (202) 555-EVNT</p>
        <p className="mt-3 text-gray-500">Invoice generated on {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
        <p className="mt-2 text-gray-500">This invoice is subject to EVNT's Marketplace Terms and Conditions</p>
      </div>
    </div>
  );
}
import React from "react";
import { format } from "date-fns";

export default function ProfessionalInvoice({ booking }) {
  const invoiceNumber = booking.invoice_number || `EVNT-${new Date().getFullYear()}-${booking.id?.slice(0, 8).toUpperCase()}`;
  const issueDate = booking.contract_signed_date || new Date().toISOString();
  const dueDate = booking.event_date;
  
  const subtotal = (booking.agreed_price || 0) + (booking.additional_fees || []).reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: '1.6' }}>
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-black">
        <h1 className="text-4xl font-bold mb-2">Evnt, Inc.</h1>
        <p className="text-sm">1200 K Street NW, Suite 400</p>
        <p className="text-sm">Washington, DC 20005</p>
        <p className="text-sm">support@evnt.com | (202) 555-EVNT</p>
      </div>

      {/* Invoice Title */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">INVOICE</h2>
        <p className="text-sm"><strong>Invoice Number:</strong> {invoiceNumber}</p>
        <p className="text-sm"><strong>Invoice Date:</strong> {format(new Date(issueDate), "MMMM dd, yyyy")}</p>
        <p className="text-sm"><strong>Due Date:</strong> {format(new Date(dueDate), "MMMM dd, yyyy")}</p>
      </div>

      {/* Bill To */}
      <div className="mb-8">
        <h3 className="font-bold text-sm mb-2 uppercase">Billed To:</h3>
        <p><strong>{booking.client_name}</strong></p>
        <p>{booking.client_email}</p>
        <p>Event Date: {format(new Date(booking.event_date), "MMMM dd, yyyy")}</p>
        <p>Event Location: {booking.location}</p>
      </div>

      {/* Description of Charges */}
      <div className="mb-8">
        <h3 className="font-bold text-sm mb-3 uppercase">Description of Charges:</h3>
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 text-sm">Description</th>
              <th className="text-right py-2 text-sm">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="py-3">
                <p className="font-bold">Event Service Provided by Vendor: {booking.vendor_name}</p>
                <p className="text-xs text-gray-600">{booking.service_description || `${booking.event_type} services`}</p>
              </td>
              <td className="text-right">${booking.agreed_price?.toFixed(2)}</td>
            </tr>
            
            {booking.additional_fees && booking.additional_fees.map((fee, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="py-3">
                  <p className="font-bold">{fee.name}</p>
                  {fee.description && <p className="text-xs text-gray-600">{fee.description}</p>}
                </td>
                <td className="text-right">${parseFloat(fee.amount)?.toFixed(2)}</td>
              </tr>
            ))}

            <tr className="border-b border-gray-300">
              <td className="py-3">
                <p className="font-bold">Service Fee - Evnt Platform</p>
                <p className="text-xs text-gray-600">Platform access, payment processing, and support ({booking.platform_fee_percent}%)</p>
              </td>
              <td className="text-right">${booking.platform_fee_amount?.toFixed(2)}</td>
            </tr>

            <tr className="border-t-2 border-black">
              <td className="py-3 text-right font-bold">Subtotal:</td>
              <td className="text-right font-bold">${subtotal.toFixed(2)}</td>
            </tr>
            
            <tr>
              <td className="py-1 text-right text-sm">Applicable taxes:</td>
              <td className="text-right text-sm">$0.00</td>
            </tr>
            
            <tr className="border-t-2 border-black">
              <td className="py-3 text-right text-xl font-bold">Total Amount Due:</td>
              <td className="text-right text-xl font-bold">${booking.total_amount?.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Method */}
      <div className="mb-8">
        <p><strong>Payment Method:</strong> Credit card, ACH, or in-app payment</p>
        <p><strong>Payment Terms:</strong> Payment is due upon receipt unless otherwise stated.</p>
      </div>

      <div className="page-break-after"></div>

      {/* Legal Terms */}
      <div className="mt-8 pt-8 border-t-2 border-black text-xs space-y-6">
        <div>
          <h3 className="font-bold text-sm mb-3 uppercase">EVNT CLIENT MARKETPLACE TERMS</h3>
          <p className="mb-2">
            Evnt is a marketplace platform and does not provide event services. Vendors are independent contractors. 
            Evnt is not responsible for Vendor performance, service quality, delays, cancellations, damages, or disputes 
            arising from services.
          </p>
          <p>
            Clients agree that any agreements for services are solely between Client and Vendor. Evnt's role is limited 
            to facilitating discovery, booking, and payment processing.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm mb-3 uppercase">PAYMENT TERMS & ESCROW PROTECTION</h3>
          <p className="mb-2">
            <strong>Payment Processing:</strong> All payments are processed securely through Stripe Connect and held in 
            Evnt's escrow account pending successful service completion.
          </p>
          <p className="mb-2">
            <strong>Escrow Release:</strong> Vendor payment will be released within 24-48 hours after the event date, 
            subject to dispute resolution and compliance with platform policies.
          </p>
          <p>
            <strong>Buyer Protection:</strong> If services are not rendered as agreed, clients may file a dispute within 
            24 hours of the event for review and potential refund.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm mb-3 uppercase">CANCELLATION & REFUND POLICY</h3>
          <p className="mb-2"><strong>Client Cancellation:</strong></p>
          <ul className="list-disc ml-5 mb-2 space-y-1">
            <li>More than 60 days before event: Full refund minus 5% processing fee</li>
            <li>30-60 days before event: 50% refund</li>
            <li>Less than 30 days before event: No refund</li>
          </ul>
          <p>
            <strong>Vendor Cancellation:</strong> If Vendor cancels within 30 days without cause, Client receives full refund 
            plus 10% compensation.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-sm mb-3 uppercase">DISPUTE RESOLUTION</h3>
          <p className="mb-2">
            Clients must report service issues within 24 hours of the event date. Evnt may assist with dispute mediation. 
            Evnt's determination regarding platform-related disputes is final.
          </p>
          <p>
            Unauthorized chargebacks may result in account suspension. All disputes must be addressed through Evnt's 
            resolution process first.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-400 text-center text-xs text-gray-600">
        <p className="font-bold">Evnt, Inc.</p>
        <p>1200 K Street NW, Suite 400, Washington, DC 20005</p>
        <p className="mt-1">support@evnt.com | (202) 555-EVNT</p>
        <p className="mt-2">Invoice generated on {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
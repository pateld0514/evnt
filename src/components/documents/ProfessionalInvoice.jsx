import React from "react";
import { format } from "date-fns";

export default function ProfessionalInvoice({ booking }) {
  const invoiceNumber = booking.invoice_number || `INV-${new Date().getFullYear()}-${booking.id?.slice(0, 8).toUpperCase()}`;
  const issueDate = booking.contract_signed_date || new Date().toISOString();
  const dueDate = booking.event_date;

  return (
    <div className="bg-white p-16 max-w-5xl mx-auto print:p-12" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Letterhead */}
      <div className="border-b-4 border-black pb-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-5xl font-black tracking-tight mb-2">EVNT</h1>
            <p className="text-sm text-gray-600">Event Services Marketplace</p>
            <p className="text-sm text-gray-600">Washington, DC 20001</p>
            <p className="text-sm text-gray-600">support@evnt.com</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-bold mb-2">INVOICE</h2>
            <p className="text-sm font-medium">Invoice #: {invoiceNumber}</p>
            <p className="text-sm text-gray-600">Date Issued: {format(new Date(issueDate), "MMMM dd, yyyy")}</p>
            <p className="text-sm text-gray-600">Payment Due: {format(new Date(dueDate), "MMMM dd, yyyy")}</p>
          </div>
        </div>
      </div>

      {/* Bill To / From */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Bill To</p>
          <p className="text-lg font-bold mb-1">{booking.client_name}</p>
          <p className="text-sm text-gray-600">{booking.location || "Event Location"}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Service Provider</p>
          <p className="text-lg font-bold mb-1">{booking.vendor_name}</p>
          <p className="text-sm text-gray-600">Via EVNT Platform</p>
        </div>
      </div>

      {/* Event Details */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-sm font-bold uppercase tracking-wide mb-3">Event Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Event Type:</span>
            <span className="font-medium ml-2">{booking.event_type}</span>
          </div>
          <div>
            <span className="text-gray-600">Event Date:</span>
            <span className="font-medium ml-2">{format(new Date(booking.event_date), "MMMM dd, yyyy")}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium ml-2">{booking.location}</span>
          </div>
          {booking.guest_count && (
            <div>
              <span className="text-gray-600">Guest Count:</span>
              <span className="font-medium ml-2">{booking.guest_count}</span>
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
        <div className="w-80">
          <div className="bg-black text-white p-6 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">TOTAL DUE</span>
              <span className="text-3xl font-black">${booking.total_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="border-t-2 border-gray-200 pt-8">
        <h3 className="text-sm font-bold uppercase tracking-wide mb-4">Payment Terms & Escrow Protection</h3>
        <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
          <p>
            <strong>Payment Processing:</strong> All payments are processed securely through Stripe Connect and are held in EVNT's escrow account.
          </p>
          <p>
            <strong>Escrow Release:</strong> Funds will be released to the service provider 24 hours after the event date ({format(new Date(booking.event_date), "MMMM dd, yyyy")}), 
            allowing time for any disputes or issues to be reported.
          </p>
          <p>
            <strong>Buyer Protection:</strong> If services are not rendered as agreed, clients may file a dispute within 24 hours of the event for review and potential refund.
          </p>
          <p>
            <strong>Cancellation Policy:</strong> Cancellations made more than 30 days before the event receive a full refund minus processing fees. 
            Cancellations within 30 days may result in forfeiture of deposit per the service agreement.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>EVNT Platform Services LLC | Washington, DC</p>
        <p className="mt-1">For questions regarding this invoice, contact support@evnt.com</p>
        <p className="mt-1">Invoice generated on {format(new Date(), "MMMM dd, yyyy 'at' h:mm a")}</p>
      </div>
    </div>
  );
}
import React from "react";
import { format } from "date-fns";

export default function Invoice({ booking }) {
  const baseAmount = booking.agreed_price || booking.budget || 0;
  const additionalFeesTotal = booking.additional_fees ? booking.additional_fees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0) : 0;
  const platformFee = booking.platform_fee_amount || 0;
  const salesTax = booking.sales_tax_amount || 0;
  const stripeFee = booking.stripe_fee_amount || 0;
  const totalAmount = booking.total_amount_charged || (baseAmount + additionalFeesTotal + platformFee + salesTax + stripeFee);
  const invoiceNumber = booking.invoice_number || `INV-${booking.id?.slice(0, 8)}`;
  const status = booking.payment_status === "paid" ? "PAID" : booking.status === "completed" ? "COMPLETED" : "PENDING";

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto print:p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-6xl font-black mb-2">INVOICE</h1>
          <p className="text-gray-600 text-lg">#{invoiceNumber}</p>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-black mb-2">EVNT</h2>
          <p className="text-gray-500">Marketplace Facilitator</p>
        </div>
      </div>

      {/* Client Info & Date */}
      <div className="flex justify-between mb-12">
        <div>
          <h3 className="text-sm font-bold text-gray-500 mb-2">Bill To</h3>
          <p className="text-xl font-bold">{booking.client_name}</p>
          <p className="text-gray-600">Ref: {booking.event_type}</p>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-bold text-gray-500 mb-2">Date Issued</h3>
          <p className="text-xl font-bold">{format(new Date(), "MMM dd, yyyy")}</p>
          <div className="mt-4">
            <h3 className="text-sm font-bold text-gray-500 mb-2">Status</h3>
            <p className="text-xl font-bold">{status}</p>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-3 font-bold text-gray-500">Description</th>
              <th className="text-right py-3 font-bold text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Service Amount */}
            <tr className="border-b border-gray-200">
              <td className="py-4">
                <p className="font-bold text-lg mb-1">{booking.service_description || `${booking.event_type} Service`}</p>
                <p className="text-gray-500 text-sm">Base service amount</p>
              </td>
              <td className="text-right font-bold text-lg">${baseAmount.toFixed(2)}</td>
            </tr>

            {/* Additional Fees */}
            {booking.additional_fees && booking.additional_fees.map((fee, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="py-4">
                  <p className="font-bold text-lg mb-1">{fee.name}</p>
                  {fee.description && <p className="text-gray-500 text-sm">{fee.description}</p>}
                </td>
                <td className="text-right font-bold text-lg">${parseFloat(fee.amount).toFixed(2)}</td>
              </tr>
            ))}

            {/* Platform Fee */}
            <tr className="border-b border-gray-200">
              <td className="py-4">
                <p className="font-bold text-lg mb-1">Platform Fee</p>
                <p className="text-gray-500 text-sm">{booking.platform_fee_percent}% + Payment Processing</p>
              </td>
              <td className="text-right font-bold text-lg">${platformFee.toFixed(2)}</td>
            </tr>

            {/* Sales Tax */}
            {salesTax > 0 && (
              <tr className="border-b border-gray-200">
                <td className="py-4">
                  <p className="font-bold text-lg mb-1">Sales Tax</p>
                  <p className="text-gray-500 text-sm">{(booking.sales_tax_rate * 100).toFixed(1)}%</p>
                </td>
                <td className="text-right font-bold text-lg">${salesTax.toFixed(2)}</td>
              </tr>
            )}

            {/* Stripe Processing Fee */}
            {stripeFee > 0 && (
              <tr className="border-b-2 border-gray-800">
                <td className="py-4">
                  <p className="font-bold text-lg mb-1">Payment Processing</p>
                  <p className="text-gray-500 text-sm">Card processing fee (2.9% + $0.30)</p>
                </td>
                <td className="text-right font-bold text-lg">${stripeFee.toFixed(2)}</td>
              </tr>
            )}

            {/* Total */}
            <tr>
              <td className="py-4 text-xl font-bold">Total Amount Due</td>
              <td className="text-right text-2xl font-black">${totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Info */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-bold text-lg mb-3">Payment & Escrow Information:</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          Payment is secured via Stripe and held in escrow by EVNT until 24 hours after the event date ({format(new Date(booking.event_date), "MMM dd, yyyy")}). Once the event is marked as complete, payment is automatically released to the vendor.
        </p>
        {booking.vendor_payout > 0 && (
          <p className="text-gray-700 leading-relaxed">
            <strong>Vendor receives:</strong> ${booking.vendor_payout.toFixed(2)} (after platform fees and taxes)
          </p>
        )}
      </div>
    </div>
  );
}
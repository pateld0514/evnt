import React from "react";
import { format } from "date-fns";

export default function Invoice({ booking }) {
  const performanceAmount = booking.service_amount || booking.budget || 1000;
  const overtimeAmount = 100;
  const platformFee = Math.round((performanceAmount + overtimeAmount) * 0.10);
  const totalAmount = performanceAmount + overtimeAmount + platformFee;
  const invoiceNumber = booking.invoice_number || `${booking.id?.slice(0, 4)}-${Math.floor(Math.random() * 9999)}`;
  const status = booking.status === "accepted" || booking.status === "completed" ? "PAID IN FULL" : "PENDING";

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
            {/* Performance Package */}
            <tr className="border-b border-gray-200">
              <td className="py-4">
                <p className="font-bold text-lg mb-1">Performance Package (4 Hours)</p>
                <p className="text-gray-500 text-sm">Includes Sound & Lighting setup</p>
              </td>
              <td className="text-right font-bold text-lg">${performanceAmount.toLocaleString()}.00</td>
            </tr>

            {/* Overtime Protection */}
            <tr className="border-b border-gray-200">
              <td className="py-4">
                <p className="font-bold text-lg mb-1">Overtime Protection (1 Hour)</p>
                <p className="text-gray-500 text-sm">Contingency hold</p>
              </td>
              <td className="text-right font-bold text-lg">${overtimeAmount.toLocaleString()}.00</td>
            </tr>

            {/* Platform Fee */}
            <tr className="border-b-2 border-gray-800">
              <td className="py-4">
                <p className="font-bold text-lg mb-1">Platform & Trust Fee</p>
                <p className="text-gray-500 text-sm">Includes Payment Processing & Escrow (10%)</p>
              </td>
              <td className="text-right font-bold text-lg">${platformFee.toLocaleString()}.00</td>
            </tr>

            {/* Total */}
            <tr>
              <td className="py-4 text-xl font-bold">Total</td>
              <td className="text-right text-2xl font-black">${totalAmount.toLocaleString()}.00</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Info */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="font-bold text-lg mb-3">Payment Information:</h3>
        <p className="text-gray-700 leading-relaxed">
          Payment secured via Stripe Connect. Funds are held in escrow by EVNT Platform until 24 hours after the event completion date ({format(new Date(booking.event_date), "MMM dd, yyyy")}).
        </p>
      </div>
    </div>
  );
}
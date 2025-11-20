import React from "react";
import { format } from "date-fns";

export default function ServiceAgreement({ booking, vendor }) {
  const serviceAmount = booking.service_amount || booking.budget || 1000;
  const platformFee = Math.round(serviceAmount * 0.10);
  const totalAmount = serviceAmount + platformFee;

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto print:p-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black mb-2">EVENT SERVICES AGREEMENT</h1>
        <p className="text-gray-500 italic text-lg">Powered by EVNT Trust Infrastructure</p>
      </div>

      <div className="border-t-2 border-b-2 border-black py-8 mb-8">
        {/* Parties */}
        <div className="flex justify-between mb-8">
          <div>
            <h3 className="text-sm font-bold text-gray-500 mb-2">CLIENT (THE "HOST")</h3>
            <p className="text-xl font-bold">{booking.client_name}</p>
            <p className="text-gray-600">{booking.client_email}</p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-gray-500 mb-2">VENDOR (THE "TALENT")</h3>
            <p className="text-xl font-bold">{booking.vendor_name}</p>
            <p className="text-gray-600">Verified ID: #{vendor?.id?.slice(0, 6)}</p>
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-gray-50 p-6 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="font-medium text-gray-600">Event Date:</span>
            <span className="font-bold text-right">{format(new Date(booking.event_date), "MMMM dd, yyyy")}</span>
          </div>
          {booking.guest_count && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Guest Count:</span>
              <span className="font-bold text-right">{booking.guest_count} guests</span>
            </div>
          )}
          {booking.location && (
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Location:</span>
              <span className="font-bold text-right">{booking.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-8 mb-12">
        {/* Services */}
        <div>
          <h2 className="text-xl font-bold mb-3">1. SERVICES</h2>
          <p className="text-gray-700">
            Vendor agrees to provide {vendor?.category?.replace(/_/g, ' ')} services
            {booking.notes ? ` including ${booking.notes.toLowerCase()}` : ''} for the event specified above.
          </p>
        </div>

        {/* Compensation */}
        <div>
          <h2 className="text-xl font-bold mb-3">2. COMPENSATION</h2>
          <p className="text-gray-700">
            Client agrees to pay a total of <span className="font-bold">${totalAmount.toLocaleString()}.00</span> via the EVNT Platform. 
            Funds are held in escrow until 24 hours post-event.
          </p>
        </div>

        {/* Cancellation */}
        <div>
          <h2 className="text-xl font-bold mb-3">3. CANCELLATION POLICY (STRICT)</h2>
          <p className="text-gray-700">
            This booking is subject to EVNT's "Strict" policy. Cancellations made within 30 days of the event result in a
            forfeiture of the 50% deposit. No-shows by Vendor result in a full refund + 10% credit to Client.
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="border-t-2 border-gray-300 pt-12">
        <div className="flex justify-between items-end">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 mb-4" style={{ fontFamily: 'Brush Script MT, cursive' }}>
              {booking.client_name}
            </p>
            <div className="border-t-2 border-black pt-2">
              <p className="font-bold">CLIENT SIGNATURE</p>
              <p className="text-sm text-gray-500">Digitally signed via EVNT</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600 mb-4" style={{ fontFamily: 'Brush Script MT, cursive' }}>
              {booking.vendor_name.split(' ')[0]}
            </p>
            <div className="border-t-2 border-black pt-2">
              <p className="font-bold">VENDOR SIGNATURE</p>
              <p className="text-sm text-gray-500">Digitally signed via EVNT</p>
              <p className="text-xs text-gray-400">ID: {booking.id?.slice(0, 12)} • Generated via EVNT Platform</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
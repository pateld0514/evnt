import React from "react";
import { format } from "date-fns";

export default function ServiceAgreement({ booking, vendor }) {
  const serviceAmount = booking.service_amount || booking.budget || 1000;

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto print:p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black mb-2">Event Services Agreement</h1>
        <p className="text-gray-500 text-sm">Powered by EVNT Trust Infrastructure</p>
      </div>

      {/* Parties */}
      <div className="mb-8 space-y-4">
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">Client (The "Host")</p>
          <p className="text-lg font-bold">{booking.client_name}</p>
          <p className="text-gray-600">{booking.location || "Event Location"}</p>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-600 mb-1">Vendor (The "Talent")</p>
          <p className="text-lg font-bold">{booking.vendor_name}</p>
          <p className="text-gray-600">Verified ID: #{vendor?.id?.slice(0, 6) || "882910"}</p>
        </div>
      </div>

      {/* Event Details */}
      <div className="mb-8 space-y-2">
        <div>
          <span className="font-bold">Event Date:</span>
          <p>{format(new Date(booking.event_date), "MMMM dd, yyyy")}</p>
        </div>
        <div>
          <span className="font-bold">Duration:</span>
          <p>6:00 PM - 10:00 PM (4 Hours)</p>
        </div>
        <div>
          <span className="font-bold">Location:</span>
          <p>{booking.location || "Event Venue"}</p>
        </div>
      </div>

      {/* Terms */}
      <div className="space-y-6 mb-12">
        {/* Services */}
        <div>
          <h2 className="text-lg font-bold mb-2">1. Services</h2>
          <p className="text-gray-700">
            Vendor agrees to provide {vendor?.category?.replace(/_/g, ' ') || "DJ"} services including sound equipment, lighting package, and MC duties for the duration specified above.
          </p>
        </div>

        {/* Compensation */}
        <div>
          <h2 className="text-lg font-bold mb-2">2. Compensation</h2>
          <p className="text-gray-700">
            Client agrees to pay a total of ${serviceAmount.toLocaleString()}.00 via the EVNT Platform. Funds are held in escrow until 24 hours post-event.
          </p>
        </div>

        {/* Cancellation */}
        <div>
          <h2 className="text-lg font-bold mb-2">3. Cancellation Policy (Strict)</h2>
          <p className="text-gray-700">
            This booking is subject to EVNT's "Strict" policy. Cancellations made within 30 days of the event result in a forfeiture of the 50% deposit. No-shows by Vendor result in a full refund + 10% credit to Client.
          </p>
        </div>
      </div>

      {/* Signatures */}
      <div className="grid grid-cols-2 gap-8 pt-8 border-t-2 border-gray-300 mb-12">
        <div>
          <p className="text-2xl mb-2" style={{ fontFamily: 'cursive' }}>{booking.client_name}</p>
          <div className="border-t border-black pt-2">
            <p className="text-sm font-bold">Client Signature</p>
            <p className="text-xs text-gray-500">Digitally signed via EVNT</p>
          </div>
        </div>
        <div>
          <p className="text-2xl mb-2" style={{ fontFamily: 'cursive' }}>{booking.vendor_name.split(' ')[0] || "Vendor"}</p>
          <div className="border-t border-black pt-2">
            <p className="text-sm font-bold">Vendor Signature</p>
            <p className="text-xs text-gray-500">Digitally signed via EVNT</p>
          </div>
        </div>
      </div>

      {/* Legal Compliance Footer */}
      <div className="text-center border-t-2 border-gray-300 pt-6 text-xs text-gray-600">
        <p style={{ margin: '8px 0' }}>© {new Date().getFullYear()} EVNT, Inc. All rights reserved.</p>
        <p style={{ margin: '4px 0' }}>
          <a href="https://evnt.com/privacy" style={{ color: '#0066cc', textDecoration: 'none' }}>Privacy Policy</a> | 
          <a href="https://evnt.com/terms" style={{ color: '#0066cc', textDecoration: 'none', marginLeft: '8px' }}>Terms of Service</a> | 
          <a href="https://evnt.com/contact" style={{ color: '#0066cc', textDecoration: 'none', marginLeft: '8px' }}>Contact Us</a>
        </p>
      </div>
    </div>
  );
}
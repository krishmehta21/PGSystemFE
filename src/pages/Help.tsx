import React from 'react';
import { Phone, Mail, MessageCircle } from 'lucide-react';

const Help: React.FC = () => {
  const whatsappNumber = "9910816929";
  const emailAddress = "21mehtak@gmail.com";

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto pb-24 animate-fade-up">
      <header className="mb-8">
        <h1 className="font-serif text-[28px] text-main-text">Customer Care</h1>
        <p className="text-text-secondary text-sm mt-1">We're here to help you</p>
      </header>

      <div className="space-y-4">
        <a 
          href={`https://wa.me/91${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center p-5 card hover:shadow-md transition-shadow hover:border-green-300 group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mr-4 group-hover:scale-110 transition-transform">
            <MessageCircle size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-main-text">WhatsApp Us</h2>
            <p className="text-sm text-text-secondary">+91 {whatsappNumber}</p>
          </div>
        </a>

        <a 
          href={`tel:+91${whatsappNumber}`}
          className="flex items-center p-5 card hover:shadow-md transition-shadow hover:border-blue-300 group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mr-4 group-hover:scale-110 transition-transform">
            <Phone size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-main-text">Call Us</h2>
            <p className="text-sm text-text-secondary">+91 {whatsappNumber}</p>
          </div>
        </a>

        <a 
          href={`mailto:${emailAddress}`}
          className="flex items-center p-5 card hover:shadow-md transition-shadow hover:border-amber-300 group"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mr-4 group-hover:scale-110 transition-transform">
            <Mail size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-main-text">Email Us</h2>
            <p className="text-sm text-text-secondary">{emailAddress}</p>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Help;

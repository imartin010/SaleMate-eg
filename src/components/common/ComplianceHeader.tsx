import { Link } from 'react-router-dom';

const links = [
  { label: 'Contact Us', to: '/public/contact' },
  { label: 'Privacy Policy', to: '/public/privacy-policy' },
  { label: 'Delivery & Shipping Policy', to: '/public/delivery-and-shipping-policy' },
  { label: 'Refund & Cancellation Policy', to: '/public/refund-policy' },
];

export function ComplianceHeader() {
  return (
    <div className="w-full bg-white/80 px-4 py-2 text-xs font-medium text-slate-600 backdrop-blur border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 sm:justify-end">
          {links.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-slate-100 px-3 py-1 text-xs transition hover:bg-slate-200 hover:text-slate-900"
            >
              {label}
            </Link>
          ))}
      </div>
    </div>
  );
}


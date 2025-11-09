import { Link } from 'react-router-dom';

const navItems = [
  { label: 'Contact Us', to: '/public/contact' },
  { label: 'Privacy Policy', to: '/public/privacy-policy' },
  { label: 'Delivery & Shipping Policy', to: '/public/delivery-and-shipping-policy' },
  { label: 'Refund & cancellation policy', to: '/public/refund-policy' },
];

export function PublicHeader() {
  return (
    <header className="bg-white border-b shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/marketing" className="text-lg font-semibold text-slate-900">
          SaleMate
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-2 py-1 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}


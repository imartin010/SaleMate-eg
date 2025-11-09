import { Mail, MapPin, Phone, MessageCircle } from 'lucide-react';
import { PublicPageLayout } from '../../components/public/PublicPageLayout';

const contactChannels = [
  {
    icon: MapPin,
    title: 'Address',
    value: 'Mokattam City, Cairo',
  },
  {
    icon: Phone,
    title: 'Phone',
    value: '+201070020058',
  },
  {
    icon: Mail,
    title: 'Email',
    value: 'info@Salemate-eg.com',
  },
  {
    icon: MessageCircle,
    title: 'Support',
    value: 'Sign in to your SaleMate account to chat with support or submit a ticket.',
  },
];

export function ContactUs() {
  return (
    <PublicPageLayout title="Contact Us">
      <div className="space-y-10">
        <p className="text-base leading-relaxed text-slate-700">
          SaleMate provides instant delivery of qualified real estate leads directly to your SaleMate dashboard
          and the email address linked to your account. If you have questions about orders, billing, or technical
          support, you can reach us through any of the channels below.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {contactChannels.map(({ icon: Icon, title, value }) => (
            <div key={title} className="flex items-start gap-4 rounded-xl border border-slate-200 p-5">
              <div className="rounded-full bg-blue-50 p-3 text-blue-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
                <p className="mt-1 text-base text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-blue-50 p-6 text-blue-900">
          <h3 className="text-lg font-semibold">How to reach us</h3>
          <p className="mt-2 text-sm leading-relaxed">
            For order cancellations, refunds, or delivery questions, submit a request through your SaleMate account or
            email us at <strong>info@Salemate-eg.com</strong>. Please include your order ID so we can assist you quickly.
          </p>
        </div>
      </div>
    </PublicPageLayout>
  );
}


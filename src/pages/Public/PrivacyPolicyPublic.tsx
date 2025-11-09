import { PublicPageLayout } from '../../components/public/PublicPageLayout';

export function PrivacyPolicyPublic() {
  return (
    <PublicPageLayout title="Privacy Policy">
      <div className="space-y-8 text-slate-700">
        <section>
          <h2 className="text-xl font-semibold text-slate-900">Our Commitment</h2>
          <p className="mt-2 leading-relaxed">
            SaleMate respects the privacy of every real estate professional who uses our platform. We collect only the
            information needed to deliver purchased leads instantly to your SaleMate dashboard and to the email linked
            to your account, process payments securely, and provide timely support.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-900">Information We Collect</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Account details such as your name, email, phone number, and company information.</li>
            <li>Order records, payment status, and leads delivered to your account.</li>
            <li>Usage analytics that help us protect the platform and improve performance.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-900">How We Use Your Data</h3>
          <ul className="mt-2 list-disc space-y-2 pl-6">
            <li>Deliver purchased leads to your account and email immediately after payment.</li>
            <li>Send receipts, refund updates, and service announcements.</li>
            <li>Respond to support requests and verify ownership of accounts.</li>
            <li>Protect the platform against fraud and unauthorized access.</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-900">Data Protection</h3>
          <p className="mt-2 leading-relaxed">
            We secure all data using industry-standard encryption, role-based access controls, and continuous monitoring
            powered by Supabase infrastructure. Payment information is handled by certified payment processors and is
            not stored on SaleMate servers.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-900">Your Rights</h3>
          <p className="mt-2 leading-relaxed">
            You may access, correct, or request deletion of your personal information at any time. Contact us using the
            details below and we will respond within seven business days.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-slate-900">Contact</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>Email: <strong>info@Salemate-eg.com</strong></li>
            <li>Phone: <strong>+201070020058</strong></li>
            <li>Address: <strong>Mokattam City, Cairo</strong></li>
          </ul>
        </section>
      </div>
    </PublicPageLayout>
  );
}


import { PublicPageLayout } from '../../components/public/PublicPageLayout';

export function RefundPolicyPublic() {
  return (
    <PublicPageLayout title="Refund & Cancellation Policy">
      <div className="space-y-8 text-slate-700">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Digital Product Policy</h2>
          <p>
            SaleMate delivers digital real estate leads instantly after purchase. We follow the guidelines below to
            keep the process fair, transparent, and compliant with our payment partners.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">English</h3>
          <ul className="list-disc space-y-2 pl-6">
            <li>All orders can be cancelled or returned within 14 days of purchase.</li>
            <li>Cancellations or order returns must be requested through your SaleMate account.</li>
            <li>No cancellation fees are charged within the first 14 days.</li>
            <li>Delivery fees apply on cancelled or returned orders.</li>
            <li>Refunds are issued using the same payment method used at checkout.</li>
            <li>
              Refunds are processed within seven days from receiving the cancellation request. Posting time depends on
              the issuing bank or payment provider.
            </li>
            <li>
              Leads delivered before a cancellation request will be revoked from the account once the refund is issued.
            </li>
          </ul>
        </section>

        <section className="space-y-3 text-right">
          <h3 className="text-lg font-semibold text-slate-900">العربية</h3>
          <ul className="list-disc space-y-2 pr-6">
            <li>يمكن إلغاء جميع الطلبات أو إرجاعها في غضون 14 يومًا من تاريخ الشراء.</li>
            <li>يجب تقديم طلبات الإلغاء أو الإرجاع من خلال حسابك على SaleMate.</li>
            <li>لا يتم فرض أي رسوم إلغاء خلال أول 14 يومًا.</li>
            <li>تطبق رسوم التسليم على الطلبات الملغاة أو المرتجعة.</li>
            <li>يتم رد المبالغ باستخدام نفس وسيلة الدفع المستخدمة عند الشراء.</li>
            <li>
              تتم معالجة المبالغ المستردة خلال سبعة أيام من استلام طلب الإلغاء، مع ملاحظة أن ظهور المبلغ في حسابك يعتمد
              على سياسة الجهة المصدرة.
            </li>
            <li>سيتم إزالة أي بيانات leads تم تسليمها بالفعل عند إصدار المبلغ المسترد.</li>
          </ul>
        </section>

        <section className="rounded-xl bg-blue-50 p-6 text-sm text-blue-900">
          <p>
            SaleMate · Mokattam City, Cairo · +201070020058 · info@Salemate-eg.com
          </p>
        </section>
      </div>
    </PublicPageLayout>
  );
}


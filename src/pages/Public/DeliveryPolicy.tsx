import { PublicPageLayout } from '../../components/public/PublicPageLayout';

export function DeliveryPolicy() {
  return (
    <PublicPageLayout title="Delivery & Shipping Policy">
      <div className="space-y-8 text-slate-700">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Digital Lead Delivery</h2>
          <p className="leading-relaxed">
            SaleMate provides digital real estate leads. Upon confirmation of payment, the purchased leads are
            delivered automatically to the purchaser’s SaleMate account and a copy is sent to the registered email
            address. No physical shipment occurs.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900">English</h3>
          <ul className="list-disc space-y-3 pl-6 text-sm leading-relaxed">
            <li>Lead delivery is executed instantly once the payment gateway confirms the transaction.</li>
            <li>All orders may be cancelled within 14 days of purchase by submitting a request through the SaleMate website.</li>
            <li>Cancellation requests submitted within the 14-day window are processed without cancellation fees.</li>
            <li>Where applicable, delivery charges displayed at checkout remain payable even if an order is cancelled or returned.</li>
            <li>Refunds are issued using the original payment method and are initiated within seven calendar days of receiving the cancellation request.</li>
            <li>The time required for the refunded amount to appear in the cardholder’s balance depends on the issuing bank or payment provider.</li>
          </ul>
        </section>

        <section className="space-y-3 text-right">
          <h3 className="text-lg font-semibold text-slate-900">العربية</h3>
          <ul className="list-disc space-y-3 pr-6 text-sm leading-relaxed">
            <li>يتم تسليم بيانات العملاء رقميًا فور تأكيد عملية الدفع من خلال بوابة الدفع.</li>
            <li>يمكن إلغاء جميع الطلبات خلال ١٤ يومًا من تاريخ الشراء من خلال تقديم طلب على موقع SaleMate.</li>
            <li>لا تُفرض أي رسوم إلغاء على الطلبات التي يتم إلغاؤها خلال فترة الأربعة عشر يومًا.</li>
            <li>إن وُجدت رسوم تسليم معروضة أثناء الشراء، تظل مستحقة حتى في حال إلغاء الطلب أو إرجاعه.</li>
            <li>يتم رد المبالغ من خلال نفس وسيلة الدفع المستخدمة، ويتم البدء في إجراءات الرد خلال سبعة أيام من استلام طلب الإلغاء.</li>
            <li>يعتمد ظهور المبلغ المرتجع في حساب حامل البطاقة على سياسة الجهة المصدرة أو مزود خدمة الدفع.</li>
          </ul>
        </section>
      </div>
    </PublicPageLayout>
  );
}


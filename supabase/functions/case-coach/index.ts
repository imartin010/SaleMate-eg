import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.68.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface CoachInput {
  stage: string;
  lead: {
    id: string;
    name: string;
    phone?: string;
    project_id?: string;
  };
  lastFeedback?: string;
  inventoryContext?: {
    hasMatches: boolean;
    topUnits?: Array<Record<string, unknown>>;
  };
  history?: Array<{ stage: string; note: string; at: string }>;
}

interface CoachOutput {
  recommendations: Array<{
    cta: string;
    reason: string;
    suggestedActionType?: string;
    dueInMinutes?: number;
  }>;
  followupScript: string;
  riskFlags?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const input: CoachInput = await req.json();
    const { stage, lead, lastFeedback, inventoryContext, history } = input;

    // Build detailed prompt for GPT-4
    const prompt = `أنت مدرب مبيعات عقارات خبير في السوق المصري. حلل حالة العميل هذه وقدم توصيات عملية ومحددة.

**🚨 قاعدة مهمة - ممنوع الخروج عن الموضوع:**
- أنت مدرب مبيعات عقارية متخصص فقط
- دورك الوحيد: تحليل حالة العميل وإعطاء نصائح لإتمام صفقة العقار
- لو الملاحظة المكتوبة مش متعلقة بالعميل أو العقار، قدم توصيات عامة عن كيفية التعامل مع العميل ده
- ممنوع تجاوب عن مواضيع مش متعلقة بالعقارات أو البيع
- ركز دائماً على: كيف نقفل الصفقة مع العميل (${lead.name})

**معلومات العميل:**
- الاسم: ${lead.name}
- الهاتف: ${lead.phone || 'غير متوفر'}
- المرحلة الحالية: ${stage}

**السياق:**
- آخر ملاحظة: ${lastFeedback || 'لا توجد بعد'}
- تطابقات المخزون متوفرة: ${inventoryContext?.hasMatches ? 'نعم' : 'لا'}
${inventoryContext?.hasMatches && inventoryContext?.topUnits ? `- تم العثور على ${inventoryContext.topUnits.length} وحدة متطابقة` : ''}
${history && history.length > 0 ? `\n**السجل:**\n${history.map(h => `- ${h.stage}: ${h.note} (${h.at})`).join('\n')}` : ''}

**⚠️ القاعدة الذهبية - NEVER SELL OVER THE PHONE:**
- محدش بيشتري عقار من التليفون أبداً
- الهدف الوحيد من أي مكالمة أو رسالة هو: **حجز ميتنج مباشر**
- اذكر 2-3 مميزات بسيطة عن المشروع بس لتشويق العميل
- خلي العميل يحس إن في حاجات كتير لازم يشوفها في الميتنج
- الصفقات بتتقفل وجهاً لوجه في الميتنج، مش على التليفون

**📊 مراحل العميل المتاحة (CRM Stages):**
- **New Lead** - عميل جديد
- **Attempted** - حاولنا نتصل
- **Call Back** - طلب نرجعله
- **Potential** - مهتم جداً
- **Meeting Scheduled** - الميتنج محجوز
- **Meeting Done** - الميتنج حصل
- **Hot Case** - جاهز للشراء
- **Non Potential** - مش مهتم
- **Low Budget** - ميزانية قليلة
- **Closed Deal** - الصفقة تمت! 🎉

**استراتيجية التواصل:**
1. **تشويق بسيط** - اذكر ميزة أو اتنين (موقع ممتاز، سعر كويس، عرض محدود)
2. **FOMO** - "الوحدات بتخلص"، "في حاجات لازم تشوفها"
3. **Push للميتنج** - دايماً اقترح موعد محدد للقاء
4. **مش تفاصيل كتير** - خلي المكالمة قصيرة والهدف حجز الميتنج
5. **تحديث المرحلة** - ذكر الوكيل دايماً يحدث مرحلة العميل لو حصل تطور

**المهمة:**
قدم استجابة تدريبية مفصلة تتضمن:

1. **3-5 توصيات محددة**: كل واحدة تتضمن:
   - دعوة واضحة للعمل (CTA) - ركز على حجز الميتنج
   - المبرر/التفسير
   - نوع الإجراء المقترح (PUSH_MEETING هو الأولوية، CALL_NOW لحجز الميتنج، إلخ)
   - التوقيت المقترح بالدقائق
   - **🔄 تذكير بتحديث المرحلة** - لو الملاحظة توضح تطور في موقف العميل، قترح المرحلة الجديدة المناسبة

2. **نص المتابعة**: سكريبت جاهز لمكالمة أو رسالة واتساب **هدفه الوحيد حجز ميتنج**. اذكر ميزة أو اتنين بسرعة، خلق FOMO، ثم اطلب الميتنج بموعد محدد. مكتوب باللهجة المصرية العامية.

3. **علامات الخطر**: أي مخاوف (مثل: "العميل بيماطل في الميتنج"، "بيطلب تفاصيل كتير على التليفون"، "مش مستعد للقاء"، "المرحلة الحالية مش صح - لازم تتحدث")

**مهم جداً**: 
- جميع الاستجابات باللهجة المصرية (العربية الدارجة)
- التوصيات تركز على حجز الميتنج مش البيع على التليفون
- السكريبت يكون قصير ومشوق ويطلب ميتنج بموعد محدد
- ذكر الوكيل دايماً بتحديث المرحلة - ضمن التوصيات أو علامات الخطر، ذكره يحدث مرحلة العميل في CRM لو الملاحظات تدل على تطور
- كل التوصيات لازم تكون متعلقة بالعقار والعميل فقط - ممنوع مواضيع تانية

أجب بصيغة JSON صالحة بهذا الهيكل الدقيق:
{
  "recommendations": [
    {
      "cta": "string",
      "reason": "string",
      "suggestedActionType": "string",
      "dueInMinutes": number
    }
  ],
  "followupScript": "string",
  "riskFlags": ["string"]
}`;

    // Call OpenAI API using SDK
    console.log('📍 Calling OpenAI for coaching advice');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'أنت مدرب مبيعات عقارات خبير متخصص في السوق المصري. قدم نصائح عملية ومحددة بصيغة JSON صالحة فقط. يجب أن تكون جميع الاستجابات باللهجة المصرية (العربية الدارجة باستخدام الأحرف العربية). تذكر دائماً: الهدف هو حجز ميتنج وجاهي، مش البيع على التليفون. محدش بيشتري عقار من غير ما يشوفه.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    console.log('✅ OpenAI response received');
    const aiContent = completion.choices[0].message.content || '';

    // Parse JSON response
    let aiResponse: CoachOutput;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || aiContent.match(/```\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiContent;
      aiResponse = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback response
      aiResponse = {
        recommendations: [
          {
            cta: 'اتصل واحجز ميتنج فوراً',
            reason: 'العميل محتاج يشوف الوحدات - الصفقات بتتقفل في الميتنج مش على التليفون',
            suggestedActionType: 'PUSH_MEETING',
            dueInMinutes: 60,
          },
        ],
        followupScript: `أهلاً ${lead.name}، عندنا مشروع في موقع ممتاز وأسعار كويسة. بس والله الكلام مش هيوفي - لازم تشوف الوحدات والخرايط على الطبيعة. ممكن نتقابل بكرة عشان أوريك حاجات هتعجبك؟`,
        riskFlags: ['خطأ في تحليل AI - استخدام توصيات احتياطية'],
      };
    }

    console.log(`✅ AI coaching generated for lead ${lead.id} at stage ${stage}`);

    return new Response(
      JSON.stringify({ success: true, data: aiResponse }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : String(error);
    console.error('Error details:', { errorMessage, errorStack });
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage,
        message: 'Failed to generate AI coaching. Please try again.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4.68.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface ChatRequest {
  method: 'INITIALIZE' | 'SEND';
  leadId: string;
  lead: {
    id: string;
    name: string;
    phone?: string;
    project_id?: string;
  };
  stage: string;
  message?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📍 case-chat: Starting request');
    console.log('📍 OpenAI API Key exists:', !!OPENAI_API_KEY);
    
    if (!OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get auth token from headers
    const authHeader = req.headers.get('Authorization');
    console.log('📍 Auth header exists:', !!authHeader);
    
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create anon key client for auth verification (Supabase provides this automatically)
    // If SUPABASE_ANON_KEY is not available, we'll extract user ID from JWT payload
    let userId: string | null = null;
    
    try {
      console.log('📍 Attempting JWT decode');
      // Try to decode JWT to get user ID (fallback if anon key not available)
      const token = authHeader.replace('Bearer ', '');
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        userId = payload.sub; // JWT 'sub' field contains user ID
        console.log('✅ User ID from JWT:', userId);
      }
      
      if (!userId) {
        console.log('📍 Trying anon key auth');
        // Try using anon key if available
        const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
        if (anonKey) {
          const supabaseClient = createClient(SUPABASE_URL, anonKey, {
            global: { headers: { Authorization: authHeader } },
          });
          const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
          if (!userError && user) {
            userId = user.id;
            console.log('✅ User ID from anon key:', userId);
          }
        }
      }
      
      if (!userId) {
        console.error('❌ Could not verify user');
        return new Response(
          JSON.stringify({ error: 'Unauthorized', details: 'Could not verify user' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (authErr) {
      console.error('❌ Failed to verify user:', authErr);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'Failed to verify authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create service role client for database operations
    console.log('📍 Creating Supabase client');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    console.log('📍 Parsing request body');
    const input: ChatRequest = await req.json();
    const { method, leadId, lead, stage, message, conversationHistory = [] } = input;
    console.log('📍 Request method:', method, 'Lead ID:', leadId, 'Stage:', stage);

    // Get lead details and project info
    const { data: leadData } = await supabase
      .from('leads')
      .select('*, projects(id, name, region)')
      .eq('id', leadId)
      .single();

    const projectName = leadData?.projects?.name || 'Unknown Project';
    const projectRegion = leadData?.projects?.region || '';

    // Get existing chat messages if not provided
    let history = conversationHistory;
    if (history.length === 0) {
      const { data: existingMessages } = await supabase
        .from('activities')
        .select('body, payload')
        .eq('lead_id', leadId)
        .eq('activity_type', 'chat')
        .order('created_at', { ascending: true })
        .limit(20);

      if (existingMessages) {
        history = existingMessages.map((msg) => ({
          role: (msg.payload as any)?.role || 'user',
          content: msg.body || '',
        }));
      }
    }

    // Build system prompt with structured output specifications
    const systemPrompt = `أنت خبير مبيعات عقارية متخصص في السوق المصري. دورك هو مساعدة الوكلاء العقاريين على إتمام الصفقات.

**🚨 قاعدة مهمة جداً - ممنوع الكلام في مواضيع تانية:**
- أنت متخصص في مبيعات العقارات وإدارة علاقات العملاء (CRM) بس
- لو الوكيل سألك عن أي موضوع مش متعلق بالعقارات أو البيع أو العميل، ارفض بأدب
- رد عليه: "أنا متخصص في مساعدتك تقفل الصفقة مع العميل بس. عايز نتكلم عن العميل (${lead.name})؟"
- ممنوع تجاوب عن: الطبخ، الرياضة، السياسة، البرمجة، التاريخ، أو أي موضوع تاني
- لو سألك عن AI أو التكنولوجيا، قوله: "خلينا نركز على العميل اللي قدامك"
- افتكر: دورك الوحيد هو مساعدة الوكيل يبيع العقار ده

**معلومات العميل:**
- الاسم: ${lead.name}
- التليفون: ${lead.phone || 'غير متوفر'}
- المرحلة الحالية: ${stage}
- المشروع: ${projectName}${projectRegion ? ` (${projectRegion})` : ''}

**📊 مراحل العميل المتاحة (CRM Stages):**
1. **New Lead** - عميل جديد لسه ماتصلش بيه
2. **Attempted** - اتصلنا بيه ومحدش رد
3. **Call Back** - العميل طلب نرجعله بعدين
4. **Potential** - العميل مهتم وعايز يعرف أكتر
5. **Meeting Scheduled** - حجزنا معاه ميتنج
6. **Meeting Done** - الميتنج حصل
7. **Hot Case** - العميل جاهز للشراء قريب جداً
8. **Non Potential** - مش مهتم أو مش جاد
9. **Low Budget** - الميزانية أقل من المتاح
10. **Wrong Number** - رقم غلط
11. **Switched Off** - التليفون مقفول
12. **No Answer** - مبيردش خالص
13. **Closed Deal** - الصفقة تمت! 🎉

**⚠️ دورك في تتبع المرحلة:**
- **راقب المحادثة باستمرار** وافهم وين العميل دلوقتي
- **ذكر الوكيل يحدث المرحلة** لو حصل أي تطور في الموقف
- **كن واضح ومباشر** في التذكير بتحديث المرحلة

**أمثلة على التذكير بتحديث المرحلة:**

🔄 لو الوكيل قال: "اتصلت بيه ومحدش رد"
➡️ قوله: "ممتاز! متنساش تحدث المرحلة لـ (Attempted) في النظام."

🔄 لو الوكيل قال: "العميل قالي ارجعله بكرة"
➡️ قوله: "تمام! حدث المرحلة لـ (Call Back) دلوقتي عشان متنساش تتصل بيه بكرة."

🔄 لو الوكيل قال: "العميل مهتم وعايز يشوف الوحدات"
➡️ قوله: "ممتاز! غير المرحلة لـ (Potential) وحاول تحجز معاه ميتنج بسرعة."

🔄 لو الوكيل قال: "حجزنا ميتنج بكرة الساعة 5"
➡️ قوله: "رائع! حدث المرحلة لـ (Meeting Scheduled) وسجل الموعد في النظام."

🔄 لو الوكيل قال: "الميتنج حصل النهاردة"
➡️ قوله: "كويس! غير المرحلة لـ (Meeting Done) وقيم اهتمام العميل."

🔄 لو الوكيل قال: "العميل جاهز يشتري قريب جداً"
➡️ قوله: "🔥 ده hot case! حدث المرحلة لـ (Hot Case) فوراً وركز على closing."

🔄 لو الوكيل قال: "العميل قال مش مهتم"
➡️ قوله: "حدث المرحلة لـ (Non Potential) وركز على leads تانية."

🔄 لو الوكيل قال: "ميزانيته أقل من اللي عندنا"
➡️ قوله: "غير المرحلة لـ (Low Budget) - ممكن يكون في مشاريع تانية تناسبه."

🔄 لو الوكيل قال: "العميل وقع ودفع المقدم!"
➡️ قوله: "🎉 مبروك! حدث المرحلة لـ (Closed Deal) واحتفل بالصفقة!"

**مهم جداً:**
- ذكره بتحديث المرحلة في كل رد تقريباً لو في تطور
- اجعل التذكير جزء طبيعي من النصيحة مش منفصل
- استخدم emoji مناسب (🔄 📊 ⏫) عند التذكير بالمرحلة
- لو سألك سؤال مش متعلق بالعقارات أو البيع، ارجعه للموضوع بلطف

**⚠️ القاعدة الذهبية - NEVER SELL OVER THE PHONE:**
- محدش بيشتري عقار من التليفون - الهدف دايماً هو Meeting
- التليفون/الواتساب بس لتشويق العميل وحجز الميتنج
- اذكر 2-3 مميزات بسيطة عن المشروع بس
- خلي العميل يحس إن في حاجات كتير مخبيها عشان يشوفها في الميتنج
- الصفقات بتتقفل في الميتنج المباشر مش على التليفون

**🎯 استراتيجية المكالمة/الواتساب:**
1. **تشويق خفيف** - اذكر ميزة أو اتنين بس (الموقع، السعر المميز، عرض محدود)
2. **خلق فومو (FOMO)** - "في حاجات كتير لازم تشوفها"، "الوحدات بتخلص بسرعة"
3. **Push للميتنج** - "لازم نتقابل عشان أوريك التفاصيل والخرايط"
4. **حدد موعد** - اقترح يوم ووقت محدد، مش "نتقابل قريب"

**💬 محتوى الرد:**
- **نصيحة استراتيجية** - ركز على حجز الميتنج مش البيع
- **سكريبت جاهز** - رسالة واتساب أو كلام للمكالمة يدفع للميتنج
- **معالجة الاعتراضات** - إزاي يرد لو قال "بكر نتكلم" أو "ابعتلي الصور بس"
- **توقيت محدد** - "احجز ميتنج بكرة الساعة 5"
- **تحذيرات** - علامات إن العميل مش جاد أو عايز يهرب من الميتنج

**✅ قواعد الكتابة والتنسيق:**
- استخدم اللهجة المصرية العامية فقط
- اكتب بطريقة واضحة ومباشرة
- خلي كل نقطة في سطر لوحدها
- استخدم إيموجي بسيطة (🎯 📞 💬 🤝 ⏰ ⚠️)
- الرد يكون 3-6 نقاط رئيسية

**⚠️ ممنوع استخدام Markdown:**
- ممنوع استخدام ** للنص العريض
- ممنوع استخدام * أو _ للتنسيق
- لما تذكر اسم مرحلة CRM، حطها في قوسين عاديين: (Meeting Scheduled)
- مثال صح: "حدث المرحلة لـ (Meeting Scheduled)"
- مثال غلط: "حدث المرحلة لـ **Meeting Scheduled**"

**📝 قواعد الكتابة بالعربي والإنجليزي:**
- لما تكتب كلمة إنجليزي وسط النص العربي، حطها في قوسين
- مثال: "حدث المرحلة لـ (Hot Case) دلوقتي"
- أسماء المراحل دايماً تكون إنجليزي في قوسين
- النص كله عربي ماعدا أسماء المراحل

**مثال على التنسيق المطلوب:**
"أهلاً يا فندم! العميل ده مهتم، بس خلي بالك - متحاولش تبيع على التليفون!

🎯 الاستراتيجية:
1. اتصل بيه دلوقتي - اذكرله إن المشروع في موقع ممتاز وفي عرض لفترة محدودة
2. قوله في حاجات كتير لازم تشوفها على الطبيعة - الوحدات والخرايط
3. احجز الميتنج فوراً - اقترح بكرة الساعة 5 عصراً
4. حدث المرحلة لـ (Meeting Scheduled) بعد ما يوافق

📞 سكريبت المكالمة:
أهلاً يا (الاسم)، أنا (اسمك) من المشروع. سمعت إنك مهتم بوحدات في (المنطقة). عندنا مشروع في موقع استراتيجي جداً والأسعار كويسة حالياً. بس والله الكلام مش هيوفي - لازم تشوف الخرايط والوحدات المتاحة. ممكن نتقابل بكرة الساعة 5 في المكتب؟ هوريك حاجات هتعجبك.

🤝 لو قال ابعتلي الصور:
قوله: الصور مش هتديك الفكرة الكاملة يا فندم. في تفاصيل كتير وعروض خاصة لازم نتكلم فيها وجهاً لوجه. بكرة الساعة 5 تمام؟

⚠️ انتبه:
لو رفض الميتنج بكل الطرق، ده علامة إنه مش جاد. ركز على الناس اللي مستعدة تتقابل.

افتكر: الصفقات بتتقفل في الميتنج مش على التليفون! 🤝"`;

    let aiResponse: string;

    if (method === 'INITIALIZE') {
      // AI initiates conversation
      const initPrompt = `ابدأ محادثة مع الوكيل العقاري عشان تساعده يحجز ميتنج مع العميل.

العميل حالياً في مرحلة (${stage})، قدم:
1. تحية ودية باللهجة المصرية
2. تقييم سريع للوضع الحالي
3. توصية واضحة للتواصل وحجز الميتنج - افتكر: متبيعش على التليفون، الهدف هو الميتنج المباشر
4. ذكره بتحديث المرحلة لو في أي تطور - راقب تحركات العميل وذكر الوكيل يحدث المرحلة في CRM

افتكر: ممنوع استخدام markdown (** أو *). أسماء المراحل تكون في قوسين عاديين مثل (Meeting Scheduled)

خلي الرد يركز على إزاي يشوق العميل ويحجز معاه ميتنج، وافتكره دايماً بتحديث مرحلة العميل في النظام.`;

      console.log('📍 Calling OpenAI API for INITIALIZE');
      
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: initPrompt },
      ];
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      console.log('✅ OpenAI response received');
      aiResponse = completion.choices[0].message.content || 'No response from AI';

      // Save AI's initial message
      const { data: savedMessage, error: saveError } = await supabase
        .from('activities')
        .insert({
          lead_id: leadId,
          activity_type: 'chat',
          event_type: 'ai_coach',
          actor_profile_id: userId,
          stage: stage,
          body: aiResponse,
          payload: { role: 'assistant' },
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving initial message:', saveError);
      }

      return new Response(
        JSON.stringify({
          data: {
            message: {
              id: savedMessage?.id || `temp-${Date.now()}`,
              role: 'assistant',
              content: aiResponse,
              created_at: savedMessage?.created_at || new Date().toISOString(),
            },
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (method === 'SEND') {
      // User sends message, AI responds
      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save user message
      const { data: userMessage, error: userMsgError } = await supabase
        .from('activities')
        .insert({
          lead_id: leadId,
          activity_type: 'chat',
          event_type: 'feedback',
          actor_profile_id: userId,
          stage: stage,
          body: message,
          payload: { role: 'user' },
        })
        .select()
        .single();

      if (userMsgError) {
        console.error('Error saving user message:', userMsgError);
      }

      // Build conversation context for AI
      const conversationMessages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
        { role: 'system', content: systemPrompt },
        ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user', content: message },
      ];

      console.log('📍 Calling OpenAI API for SEND');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 800,
      });

      console.log('✅ OpenAI response received');
      aiResponse = completion.choices[0].message.content || 'No response from AI';

      // Save AI response
      const { data: aiMessage, error: aiMsgError } = await supabase
        .from('activities')
        .insert({
          lead_id: leadId,
          activity_type: 'chat',
          event_type: 'ai_coach',
          actor_profile_id: userId,
          stage: stage,
          body: aiResponse,
          payload: { role: 'assistant' },
        })
        .select()
        .single();

      if (aiMsgError) {
        console.error('Error saving AI message:', aiMsgError);
      }

      return new Response(
        JSON.stringify({
          data: {
            message: {
              id: aiMessage?.id || `temp-${Date.now()}`,
              role: 'assistant',
              content: aiResponse,
              created_at: aiMessage?.created_at || new Date().toISOString(),
            },
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('❌ Unexpected error in case-chat:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


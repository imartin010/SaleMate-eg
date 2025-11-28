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

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface ChatRequest {
  action: 'send' | 'initialize';
  leadId: string;
  message?: string;
  lead: {
    id: string;
    name: string;
    phone?: string;
    project_id?: string;
  };
  stage: string;
}

serve(async (req) => {
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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user ID from JWT
    const token = authHeader.replace('Bearer ', '');
    const parts = token.split('.');
    let userId: string | null = null;
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      userId = payload.sub;
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const body: ChatRequest = await req.json();
    const { action, leadId, message, lead, stage } = body;

    // Get project info if available
    let projectName = 'المشروع';
    let projectRegion = '';
    if (lead.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('name, region')
        .eq('id', lead.project_id)
        .single();
      if (project) {
        projectName = project.name || projectName;
        projectRegion = project.region || '';
      }
    }

    // Load ALL existing messages from database
    const { data: existingMessages } = await supabase
      .from('events')
      .select('id, body, created_at, payload')
      .eq('lead_id', leadId)
      .eq('activity_type', 'chat')
      .order('created_at', { ascending: true });

    // Build conversation history
    const conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (existingMessages && existingMessages.length > 0) {
      conversationHistory.push(...existingMessages.map((msg) => ({
        role: (msg.payload as any)?.role || 'user',
        content: msg.body || '',
      })));
    }

    if (action === 'initialize') {
      // Check if chat already exists
      if (conversationHistory.length > 0) {
        // Return existing first message
        const firstMsg = existingMessages![0];
        return new Response(
          JSON.stringify({
            message: {
              id: firstMsg.id,
              role: (firstMsg.payload as any)?.role || 'assistant',
              content: firstMsg.body || '',
              created_at: firstMsg.created_at,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Initialize new chat
      const systemPrompt = `أنت خبير مبيعات عقارية متخصص في السوق المصري. دورك هو مساعدة الوكلاء العقاريين على إتمام الصفقات.

**✅ المواضيع المسموحة (كل حاجة متعلقة بالعميل والصفقة):**
- أي سؤال عن العميل (${lead.name}) - حالته، موقفه، احتياجاته، اعتراضاته
- أي سؤال عن المشروع (${projectName}) - المميزات، الأسعار، الوحدات المتاحة
- أي سؤال عن استراتيجية البيع - إزاي تتعامل مع العميل، إزاي تحجز ميتنج
- أي سؤال عن المراحل والخطوات التالية - إيه اللي المفروض يعمله الوكيل
- أي سؤال عن الحالة (Case) - تفاصيل الصفقة، التقدم، التحديات
- أي نصيحة متعلقة بإتمام الصفقة مع هذا العميل تحديداً
- **كل حاجة متعلقة بالعميل ده والصفقة دي مسموحة ومطلوبة!**

**🚨 المواضيع الممنوعة:**
- الطبخ، الرياضة، السياسة، البرمجة، التاريخ، العلوم العامة
- مواضيع تكنولوجية عامة (مش متعلقة بالعميل)
- أي موضوع مش له علاقة بالعقارات أو البيع أو العميل الحالي

**معلومات العميل:**
- الاسم: ${lead.name}
- التليفون: ${lead.phone || 'غير متوفر'}
- المرحلة الحالية: ${stage}
- المشروع: ${projectName}${projectRegion ? ` (${projectRegion})` : ''}

**📊 مراحل العميل:**
1. New Lead - عميل جديد
2. Attempted - اتصلنا بيه
3. Call Back - طلب يرجعله
4. Potential - مهتم
5. Meeting Scheduled - حجز ميتنج
6. Meeting Done - الميتنج حصل
7. Hot Case - جاهز للشراء
8. Non Potential - مش مهتم
9. Low Budget - الميزانية أقل
10. Wrong Number - رقم غلط
11. Switched Off - التليفون مقفول
12. No Answer - مبيردش
13. Closed Deal - الصفقة تمت! 🎉

**⚠️ دورك:**
- راقب المحادثة وافهم وين العميل دلوقتي
- ذكر الوكيل يحدث المرحلة لو حصل أي تطور
- كن واضح ومباشر في التذكير بتحديث المرحلة

**⚠️ NEVER SELL OVER THE PHONE:**
- محدش بيشتري عقار من التليفون - الهدف دايماً هو Meeting
- التليفون/الواتساب بس لتشويق العميل وحجز الميتنج
- اذكر 2-3 مميزات بسيطة بس
- خلي العميل يحس إن في حاجات كتير مخبيها عشان يشوفها في الميتنج

**🎯 استراتيجية المكالمة:**
1. تشويق خفيف - اذكر ميزة أو اتنين بس
2. خلق فومو - "في حاجات كتير لازم تشوفها"
3. Push للميتنج - "لازم نتقابل عشان أوريك التفاصيل"
4. حدد موعد - اقترح يوم ووقت محدد

**💬 محتوى الرد:**
- نصيحة استراتيجية - ركز على حجز الميتنج
- سكريبت جاهز - رسالة واتساب أو كلام للمكالمة
- معالجة الاعتراضات - إزاي يرد لو قال "بكر نتكلم"
- توقيت محدد - "احجز ميتنج بكرة الساعة 5"

**✅ قواعد الكتابة:**
- استخدم اللهجة المصرية العامية فقط
- اكتب بطريقة واضحة ومباشرة
- خلي كل نقطة في سطر لوحدها
- استخدم إيموجي بسيطة (🎯 📞 💬 🤝 ⏰ ⚠️)
- الرد يكون 3-6 نقاط رئيسية
- ممنوع استخدام Markdown (** للنص العريض)
- لما تذكر اسم مرحلة CRM، حطها في قوسين: (Meeting Scheduled)
- أسماء المراحل دايماً تكون إنجليزي في قوسين`;

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'assistant',
            content: `أهلاً وسهلاً! إزيك يا فندم؟

📊 الوضع الحالي:
العميل (${lead.name}) لسه في مرحلة (${stage}).

🎯 التوصية:
1. اتصل بيه دلوقتي وابدأ بمقدمة بسيطة عن نفسك والمشروع.
2. اذكرله ميزة أو اتنين عن (${projectName}) زي الموقع الممتاز أو أي عرض محدود.
3. خليه يحس إن في حاجات كتير لازم يشوفها بنفسه - زي الوحدات والخرايط.
4. اضغط لحجز ميتنج - اقترح عليه يوم ووقت محدد، مثلاً بكرة الساعة 5 مساءً.

🔄 مهم جداً:
لو حصل أي تطور في المحادثة، زي العميل اهتم أو حجز ميتنج، متنساش تحدث المرحلة في النظام لـ (Potential) أو (Meeting Scheduled) حسب الحالة.

ركز على حجز الميتنج وخلي التفاصيل المهمة للقاء المباشر. 🤝`,
          },
        ],
        temperature: 0.7,
        max_tokens: 800,
      });

      const initialMessage = aiResponse.choices[0].message.content || '';

      // Save initial message
      const { data: savedMessage } = await supabase
        .from('events')
        .insert({
          lead_id: leadId,
          activity_type: 'chat',
          event_type: 'activity',
          actor_profile_id: userId,
          stage: stage,
          body: initialMessage,
          payload: { role: 'assistant' },
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({
          message: {
            id: savedMessage?.id || `temp-${Date.now()}`,
            role: 'assistant',
            content: initialMessage,
            created_at: savedMessage?.created_at || new Date().toISOString(),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'send') {
      if (!message) {
        return new Response(
          JSON.stringify({ error: 'Message is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Save user message
      await supabase.from('events').insert({
        lead_id: leadId,
        activity_type: 'chat',
        event_type: 'activity',
        actor_profile_id: userId,
        stage: stage,
        body: message,
        payload: { role: 'user' },
      });

      // Build system prompt
      const systemPrompt = `أنت خبير مبيعات عقارية متخصص في السوق المصري. دورك هو مساعدة الوكلاء العقاريين على إتمام الصفقات.

**✅ المواضيع المسموحة (كل حاجة متعلقة بالعميل والصفقة):**
- أي سؤال عن العميل (${lead.name}) - حالته، موقفه، احتياجاته، اعتراضاته
- أي سؤال عن المشروع (${projectName}) - المميزات، الأسعار، الوحدات المتاحة
- أي سؤال عن استراتيجية البيع - إزاي تتعامل مع العميل، إزاي تحجز ميتنج
- أي سؤال عن المراحل والخطوات التالية - إيه اللي المفروض يعمله الوكيل
- أي سؤال عن الحالة (Case) - تفاصيل الصفقة، التقدم، التحديات
- أي نصيحة متعلقة بإتمام الصفقة مع هذا العميل تحديداً
- **كل حاجة متعلقة بالعميل ده والصفقة دي مسموحة ومطلوبة!**

**🚨 المواضيع الممنوعة:**
- الطبخ، الرياضة، السياسة، البرمجة، التاريخ، العلوم العامة
- مواضيع تكنولوجية عامة (مش متعلقة بالعميل)
- أي موضوع مش له علاقة بالعقارات أو البيع أو العميل الحالي

**معلومات العميل:**
- الاسم: ${lead.name}
- التليفون: ${lead.phone || 'غير متوفر'}
- المرحلة الحالية: ${stage}
- المشروع: ${projectName}${projectRegion ? ` (${projectRegion})` : ''}

**📊 مراحل العميل:**
1. New Lead - عميل جديد
2. Attempted - اتصلنا بيه
3. Call Back - طلب يرجعله
4. Potential - مهتم
5. Meeting Scheduled - حجز ميتنج
6. Meeting Done - الميتنج حصل
7. Hot Case - جاهز للشراء
8. Non Potential - مش مهتم
9. Low Budget - الميزانية أقل
10. Wrong Number - رقم غلط
11. Switched Off - التليفون مقفول
12. No Answer - مبيردش
13. Closed Deal - الصفقة تمت! 🎉

**⚠️ دورك:**
- راقب المحادثة وافهم وين العميل دلوقتي
- ذكر الوكيل يحدث المرحلة لو حصل أي تطور
- كن واضح ومباشر في التذكير بتحديث المرحلة

**⚠️ NEVER SELL OVER THE PHONE:**
- محدش بيشتري عقار من التليفون - الهدف دايماً هو Meeting
- التليفون/الواتساب بس لتشويق العميل وحجز الميتنج
- اذكر 2-3 مميزات بسيطة بس
- خلي العميل يحس إن في حاجات كتير مخبيها عشان يشوفها في الميتنج

**🎯 استراتيجية المكالمة:**
1. تشويق خفيف - اذكر ميزة أو اتنين بس
2. خلق فومو - "في حاجات كتير لازم تشوفها"
3. Push للميتنج - "لازم نتقابل عشان أوريك التفاصيل"
4. حدد موعد - اقترح يوم ووقت محدد

**💬 محتوى الرد:**
- نصيحة استراتيجية - ركز على حجز الميتنج
- سكريبت جاهز - رسالة واتساب أو كلام للمكالمة
- معالجة الاعتراضات - إزاي يرد لو قال "بكر نتكلم"
- توقيت محدد - "احجز ميتنج بكرة الساعة 5"

**✅ قواعد الكتابة:**
- استخدم اللهجة المصرية العامية فقط
- اكتب بطريقة واضحة ومباشرة
- خلي كل نقطة في سطر لوحدها
- استخدم إيموجي بسيطة (🎯 📞 💬 🤝 ⏰ ⚠️)
- الرد يكون 3-6 نقاط رئيسية
- ممنوع استخدام Markdown (** للنص العريض)
- لما تذكر اسم مرحلة CRM، حطها في قوسين: (Meeting Scheduled)
- أسماء المراحل دايماً تكون إنجليزي في قوسين`;

      // Build messages for AI
      const aiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.map((h) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content,
        })),
        { role: 'user' as const, content: message },
      ];

      const aiResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: aiMessages,
        temperature: 0.7,
        max_tokens: 800,
      });

      const aiMessageContent = aiResponse.choices[0].message.content || '';

      // Save AI response
      const { data: savedAiMessage } = await supabase
        .from('events')
        .insert({
          lead_id: leadId,
          activity_type: 'chat',
          event_type: 'activity',
          actor_profile_id: userId,
          stage: stage,
          body: aiMessageContent,
          payload: { role: 'assistant' },
        })
        .select()
        .single();

      return new Response(
        JSON.stringify({
          message: {
            id: savedAiMessage?.id || `temp-${Date.now()}`,
            role: 'assistant',
            content: aiMessageContent,
            created_at: savedAiMessage?.created_at || new Date().toISOString(),
          },
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

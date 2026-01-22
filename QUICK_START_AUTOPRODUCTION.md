# Quick Start - Auto Production

## 🚀 للبدء السريع

### 1. تحديث قاعدة البيانات

قم بتشغيل migration للجداول الجديدة:

```bash
npm run db:push
```

هذا سينشئ:
- تحديثات على `production_campaigns` table
- `campaign_items` table جديد

### 2. تشغيل السيرفر

```bash
npm run dev
```

### 3. الوصول إلى Auto Story

افتح المتصفح وانتقل إلى:
```
http://localhost:5000/autoproduction/story
```

### 4. إنشاء حملة تجريبية

1. اضغط "New Campaign"
2. اختر "Stories" في Step 1
3. اختر Template (مثلاً "Problem-Solution")
4. أدخل 10 مواضيع (مثال):
```
كيف تستيقظ باكراً
أسرار القهوة المثالية
5 طرق لزيادة الإنتاجية
كيف تتعلم البرمجة
أفضل تطبيقات للتنظيم
كيف تحسن صحتك
طرق لتوفير المال
كيف تبدأ عمل تجاري
نصائح للنوم الجيد
كيف تتعلم لغة جديدة
```
5. اختر الإعدادات (Duration: 45s، Aspect Ratio: 9:16، etc.)
6. اختر Visual Style (Photorealistic)
7. اختر Audio Settings (Voiceover: Yes)
8. أكمل الخطوات المتبقية (TODO للجدولة والنشر)
9. اضغط "Create Campaign"

### 5. بدء التوليد (بعد ربط AI)

1. في Dashboard، اضغط "Start Generation"
2. سترى Progress real-time:
   - "Generating 1/10..."
   - "Generating 2/10..."
   - etc.
3. بعد الانتهاء، راجع القصص المولدة
4. وافق/ارفض كل قصة
5. جدول النشر
6. انشر على المنصات

---

## ⚙️ خطوات التكامل مع AI

### ملف: `server/autoproduction/auto-story/services/ai-helper.ts`

استبدل هذا:
```typescript
throw new Error('AI integration not yet implemented');
```

بهذا:
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function callAI(options: AICallOptions): Promise<AIResponse> {
  const response = await openai.chat.completions.create({
    model: options.model,
    messages: options.messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 2000,
    response_format: options.response_format,
  });
  
  return {
    content: response.choices[0].message.content || '',
  };
}
```

### تأكد من وجود API Keys

في `.env`:
```
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
```

---

## 📁 هيكل الملفات الرئيسية

### Frontend
```
client/src/autoproduction/
├── shared/
│   ├── components/
│   │   ├── layout/wizard-layout.tsx          # Wizard wrapper
│   │   ├── ui/status-badge.tsx               # Status badges
│   │   └── ui/progress-tracker.tsx           # Progress display
│   └── hooks/
│       ├── useCampaign.ts                    # Campaign operations
│       └── useGeneration.ts                  # Generation tracking
│
└── auto-story/
    ├── pages/
    │   ├── index.tsx                         # القائمة
    │   ├── create.tsx                        # الـ Wizard
    │   └── [id]/dashboard.tsx                # Dashboard
    ├── components/
    │   └── wizard/
    │       ├── step-2-template-selection.tsx # Templates
    │       ├── step-3-content-setup.tsx      # 10 Topics
    │       └── step-4-style-settings.tsx     # Visual/Audio
    └── hooks/
        └── useBatchGeneration.ts             # Batch control
```

### Backend
```
server/autoproduction/
├── shared/
│   ├── services/campaign-manager.ts          # CRUD operations
│   └── routes/index.ts                       # Shared endpoints
│
└── auto-story/
    ├── services/
    │   ├── story-generator.ts                # Core generator ⭐
    │   ├── batch-processor.ts                # 10-topic handler ⭐
    │   └── ai-helper.ts                      # AI integration ⚠️
    ├── agents/
    │   ├── script-writer.ts                  # Script generation
    │   ├── scene-breaker.ts                  # Scene breakdown
    │   ├── visual-prompter.ts                # Image prompts
    │   └── narrator.ts                       # Voiceover
    ├── templates/
    │   ├── problem-solution/
    │   ├── tease-reveal/
    │   ├── before-after/
    │   └── myth-busting/
    └── routes/index.ts                       # API endpoints
```

---

## 🎯 للعمل مع زميلك

### أنت تعمل على (Auto Video):
```
client/src/autoproduction/auto-video/
server/autoproduction/auto-video/
```

### زميلك يعمل على (Auto Story Templates):
```
server/autoproduction/auto-story/templates/
  - تحسين prompts
  - template-specific logic
  - testing & validation
```

### معاً على (Shared):
```
autoproduction/shared/
  - Scheduling service
  - Publishing service
  - UI components
```

---

## 🧪 للتجربة

### Test Batch Generation (بعد ربط AI)

```bash
# 1. Create campaign via API
curl -X POST http://localhost:5000/api/autoproduction/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "type": "auto-story",
    "name": "Test Campaign",
    "storyTemplate": "problem-solution",
    "storyTopics": ["Topic 1", "Topic 2", "..."],
    "storyDuration": 45,
    "imageStyle": "photorealistic"
  }'

# 2. Start generation
curl -X POST http://localhost:5000/api/autoproduction/story/{id}/generate-batch

# 3. Check progress
curl http://localhost:5000/api/autoproduction/story/{id}/batch-progress

# 4. Get stories
curl http://localhost:5000/api/autoproduction/story/{id}/stories
```

---

## 📞 الدعم

إذا واجهت مشاكل:

1. **TypeScript Errors**: تأكد من تشغيل `npm install`
2. **Database Errors**: قم بتشغيل `npm run db:push`
3. **AI Errors**: تحقق من API keys في `.env`
4. **Route Errors**: تأكد من إعادة تشغيل السيرفر

---

## ✅ Checklist للإطلاق

- [ ] Database migration completed
- [ ] AI integration working
- [ ] Test campaign creation
- [ ] Test batch generation (10 topics)
- [ ] Verify dashboard shows progress
- [ ] Test story review
- [ ] Test approval workflow
- [ ] Add scheduling (optional)
- [ ] Add publishing (optional)
- [ ] Deploy to production

---

## 🎉 بعد الإكمال

ستتمكن من:
1. إنشاء حملة من 10 مواضيع
2. توليد 10 قصص تلقائياً
3. مراجعتها جميعاً في مكان واحد
4. الموافقة عليها بنقرة واحدة
5. جدولة النشر
6. النشر التلقائي على منصات متعددة

**وقت التوفير:** بدلاً من 10 ساعات → 1 ساعة! 🚀

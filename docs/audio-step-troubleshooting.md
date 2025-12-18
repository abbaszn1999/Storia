# Audio Step - Troubleshooting Guide

## مشكلة Preview URLs

### المشكلة الأصلية:
عند محاولة تشغيل preview للأصوات من ElevenLabs، كانت تظهر الأخطاء التالية:
```
[AudioStep] Failed to load preview: NotSupportedError
Failed to load because no supported source was found
```

### السبب:
1. **CORS Issues**: Google Storage URLs قد لا تسمح بـ CORS من localhost
2. **Audio Format**: بعض المتصفحات لا تدعم تشغيل MP3 من مصادر خارجية مباشرة
3. **Network Issues**: الاتصال بـ Google Storage قد يكون محظوراً في بعض البيئات

### الحل المطبق:
تم **تعطيل** وظيفة Preview مؤقتاً لتجنب الأخطاء. بدلاً من ذلك:
- يتم عرض رسالة "Preview available after selection"
- المستخدم يمكنه اختيار الصوت مباشرة
- سيتم سماع الصوت الفعلي عند توليد الـ voiceover

### الحلول البديلة المستقبلية:

#### 1. Backend Proxy (الأفضل)
إنشاء endpoint في الـ backend لجلب preview من ElevenLabs:

```typescript
// server/stories/problem-solution/routes/index.ts
psRouter.get(
  "/voices/:voiceId/preview",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const { voiceId } = req.params;
      
      // Fetch preview from ElevenLabs API
      const response = await fetch(
        `https://api.elevenlabs.io/v1/voices/${voiceId}`,
        {
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          },
        }
      );
      
      const data = await response.json();
      const previewUrl = data.preview_url;
      
      // Fetch the actual audio file
      const audioResponse = await fetch(previewUrl);
      const audioBuffer = await audioResponse.arrayBuffer();
      
      // Return audio with correct headers
      res.set('Content-Type', 'audio/mpeg');
      res.set('Access-Control-Allow-Origin', '*');
      res.send(Buffer.from(audioBuffer));
    } catch (error) {
      console.error('[voices] Preview fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch preview' });
    }
  }
);
```

#### 2. استخدام ElevenLabs API مباشرة
جلب قائمة الأصوات مع preview URLs من ElevenLabs API:

```typescript
// GET https://api.elevenlabs.io/v1/voices
// Response includes preview_url for each voice
```

#### 3. تخزين Preview Files في Bunny Storage
- تحميل preview files من ElevenLabs مرة واحدة
- رفعها إلى Bunny Storage
- استخدام CDN URLs بدلاً من Google Storage

### الكود الحالي:

```typescript
// AudioStep.tsx - Preview Disabled
<div className="mt-3 w-full py-2 px-3 rounded-lg bg-white/5 text-white/40 text-xs text-center">
  Preview available after selection
</div>
```

### لتفعيل Preview في المستقبل:

1. إضافة backend endpoint:
```bash
GET /api/problem-solution/voices/:voiceId/preview
```

2. تحديث frontend:
```typescript
const handlePlayPreview = async (voiceId: string) => {
  try {
    const audio = new Audio(`/api/problem-solution/voices/${voiceId}/preview`);
    await audio.play();
  } catch (error) {
    console.error('Preview failed:', error);
  }
};
```

## الحالة الحالية:
✅ Voice Selection يعمل بشكل صحيح  
✅ Voiceover Generation يعمل بشكل صحيح  
⚠️ Preview معطل مؤقتاً (لا يؤثر على الوظيفة الأساسية)  

## الخطوات التالية:
1. تطبيق Backend Proxy للـ preview (اختياري)
2. اختبار الـ voiceover generation الفعلي
3. التأكد من جودة الصوت المولد

tytrhr
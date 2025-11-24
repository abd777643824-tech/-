// api/chat.js
// هذا الملف هو Vercel Serverless Function يتعامل مع طلبات الشات بأمان.
// يتم نشره تلقائياً بواسطة Vercel عندما يكون داخل مجلد 'api'.

// استيراد 'node-fetch' للتعامل مع طلبات HTTP في بيئة Node.js (Vercel يوفره تلقائياً)
import fetch from 'node-fetch'; 

// عنوان Gemini API الأساسي
const API_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=';

// هذه هي دالة الـ Serverless Function التي ستتعامل مع الطلبات من الواجهة الأمامية (index.html)
export default async function (req, res) {
    // التأكد من أن الطلب هو من نوع POST
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    // استخلاص الـ prompt (سؤال المستخدم) والـ systemInstruction (تعليمات الهوية) من جسم الطلب
    const { prompt, systemInstruction } = req.body;

    // الوصول الآمن لمفتاح الـ API من متغيرات البيئة الخاصة بـ Vercel
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // التحقق مما إذا كان المفتاح موجوداً
    if (!GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in Vercel Environment Variables.");
        return res.status(500).json({ error: 'API Key is not configured on the server. Please check Vercel Environment Variables.' });
    }

    // بناء الـ Payload لطلب Gemini API
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] }
    };

    try {
        // إرسال الطلب إلى Gemini API باستخدام المفتاح الآمن
        const response = await fetch(`${API_URL_BASE}${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // التعامل مع الأخطاء إذا لم يكن الرد من Gemini ناجحاً
        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error:", errorData);
            // إرجاع رسالة خطأ واضحة للعميل
            return res.status(response.status).json({ error: errorData.error?.message || 'Gemini API Error: Something went wrong with the AI service.' });
        }

        // تحليل الرد من Gemini وإرساله إلى الواجهة الأمامية
        const result = await response.json();
        res.status(200).json(result);

    } catch (error) {
        console.error("Error in Vercel Serverless Function:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error: Could not process your request.' });
    }
}

# إعداد GitHub و Vercel

## الخطوات لإرفاع المشروع على GitHub:

### 1. إنشاء مستودع جديد على GitHub:
   - اذهب إلى [GitHub](https://github.com/new)
   - اختر اسم للمستودع (مثلاً: `scan-barcode`)
   - اختر Public أو Private
   - **لا** تضع علامة على "Initialize with README"
   - اضغط "Create repository"

### 2. ربط المشروع المحلي مع GitHub:

```bash
# إضافة المستودع البعيد
git remote add origin https://github.com/YOUR_USERNAME/scan-barcode.git

# رفع الملفات
git push -u origin main
```

**ملاحظة:** استبدل `YOUR_USERNAME` باسم المستخدم الخاص بك على GitHub

## الخطوات للنشر على Vercel:

### الطريقة الأولى: من خلال GitHub (موصى بها)

1. **ارفع المشروع على GitHub** (اتبع الخطوات أعلاه)

2. **اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)**

3. **اضغط "Add New Project"**

4. **اختر المستودع** `scan-barcode` من قائمة GitHub repositories

5. **إعداد Environment Variables:**
   - في صفحة الإعدادات، اذهب إلى "Environment Variables"
   - أضف متغير جديد:
     - **Name:** `REACT_APP_RAPIDAPI_KEY`
     - **Value:** مفتاح RapidAPI الخاص بك
     - **Environments:** اختر Production, Preview, Development
   - اضغط "Save"

6. **اضغط "Deploy"**
   - Vercel سيقوم ببناء المشروع تلقائياً
   - بعد الانتهاء، ستحصل على رابط مثل: `https://your-project.vercel.app`

### الطريقة الثانية: من خلال Vercel CLI

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# النشر
vercel

# اتباع التعليمات على الشاشة
```

## ملاحظات مهمة:

✅ **المشروع جاهز للنشر:**
- ✅ `vercel.json` موجود ومُعد بشكل صحيح
- ✅ `.gitignore` يتضمن `.env` لحماية المفاتيح
- ✅ `package.json` يحتوي على إعدادات Node.js
- ✅ المشروع يستخدم HTTPS (مطلوب للكاميرا)

⚠️ **تذكر:**
- لا ترفع ملف `.env` على GitHub
- أضف `REACT_APP_RAPIDAPI_KEY` في Vercel Dashboard فقط
- الكاميرا تعمل فقط على HTTPS (Vercel يوفر HTTPS تلقائياً)

## بعد النشر:

- ✅ التطبيق سيعمل على `https://your-project.vercel.app`
- ✅ الكاميرا ستعمل لأن Vercel يوفر HTTPS
- ✅ كل تحديث على GitHub سيُحدث التطبيق تلقائياً


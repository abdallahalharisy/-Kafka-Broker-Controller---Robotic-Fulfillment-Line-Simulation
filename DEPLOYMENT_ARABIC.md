# دليل النشر الكامل - محاكي Kafka Broker

## 🚀 الطريقة الأولى: Frontend على Vercel + Backend على Railway (الأفضل)

### لماذا هذه الطريقة؟
- ✅ **مجانية** - كلاهما يوفران خطة مجانية ممتازة
- ✅ **سريعة** - نشر بضغطة زر
- ✅ **موثوقة** - CDN عالمي وأداء عالي
- ✅ **WebSocket Support** - Railway يدعم WebSocket بشكل كامل

---

## 📦 الخطوة 1: نشر الـ Backend على Railway

### 1. إنشاء حساب على Railway

1. روح على [railway.app](https://railway.app)
2. اضغط "Start a New Project"
3. سجل دخول بحساب GitHub

### 2. نشر البروجكت

**الطريقة الأولى: عبر الموقع (الأسهل)**

1. اضغط "Deploy from GitHub repo"
2. اختر الريبو: `kafka-broker-sim`
3. اختر البرانش: `backend` أو `master`
4. Railway راح يكتشف Node.js project تلقائياً
5. اضغط "Deploy Now"

**الطريقة الثانية: عبر CLI**

```bash
# ثبت Railway CLI
npm i -g @railway/cli

# سجل دخول
railway login

# ابدأ بروجكت جديد
railway init

# انشر
railway up
```

### 3. تكوين البيئة على Railway

في لوحة تحكم Railway:

1. اختر الـ Service اللي انشأته
2. اضغط على "Variables"
3. أضف المتغيرات التالية:

```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=*
```

### 4. احصل على رابط الـ Backend

- Railway راح يعطيك رابط مثل: `https://your-app.railway.app`
- احفظ هذا الرابط، راح تحتاجه للفرونت إند

### 5. اختبر الـ Backend

افتح الرابط في المتصفح:
```
https://your-app.railway.app/api/metrics
```

لازم تشوف بيانات JSON ترجع

---

## 🎨 الخطوة 2: نشر الـ Frontend على Vercel

### 1. إنشاء حساب على Vercel

1. روح على [vercel.com](https://vercel.com)
2. سجل دخول بحساب GitHub

### 2. استيراد البروجكت

1. اضغط "Add New Project"
2. اضغط "Import" بجانب الريبو `kafka-broker-sim`
3. Vercel راح يكتشف الإعدادات من `vercel.json` تلقائياً

### 3. تكوين المتغيرات البيئية

قبل ما تضغط Deploy، أضف المتغيرات التالية:

**في قسم "Environment Variables":**

```
VITE_API_URL = https://your-app.railway.app
VITE_WS_URL = wss://your-app.railway.app
```

⚠️ **مهم:** استبدل `your-app.railway.app` برابط الـ Backend من Railway

### 4. اضغط Deploy

- Vercel راح يبني ويرفع الفرونت إند
- راح ياخذ 2-3 دقائق
- بعدها راح يعطيك رابط مثل: `https://kafka-broker-sim.vercel.app`

### 5. تحديث CORS في Backend

ارجع لـ Railway وحدث المتغير:

```
CORS_ORIGIN=https://kafka-broker-sim.vercel.app
```

أو إذا عندك أكثر من دومين:

```
CORS_ORIGIN=https://kafka-broker-sim.vercel.app,https://kafka-broker-sim-*.vercel.app
```

---

## ✅ الخطوة 3: اختبار التطبيق

1. افتح رابط الفرونت إند من Vercel
2. لازم تشوف Dashboard يشتغل
3. جرب:
   - إنتاج رسالة عادية
   - إنتاج رسالة سامة
   - شوف الـ Metrics تتحدث
   - شوف الـ Logs تظهر

---

## 🔧 الطريقة الثانية: كل شي على Railway (Monorepo)

### المميزات
- ✅ كل شي في مكان واحد
- ✅ إدارة أسهل
- ✅ WebSocket يشتغل بدون مشاكل

### الخطوات

1. **أنشئ Railway Project**
   ```bash
   railway init
   ```

2. **أضف ملف `nixpacks.toml`:**

```toml
[phases.setup]
nixPkgs = ['nodejs-20_x']

[phases.install]
cmds = [
  'cd backend && npm install',
  'cd frontend && npm install'
]

[phases.build]
cmds = [
  'cd backend && npm run build',
  'cd frontend && npm run build'
]

[start]
cmd = 'cd backend && npm start'
```

3. **انشر:**
   ```bash
   railway up
   ```

4. **اضبط Static Files** في Backend:

في `backend/src/index.ts`:

```typescript
// بعد السطر const app = express();
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
```

---

## 🔧 الطريقة الثالثة: كل شي على Render

### Frontend + Backend على Render

1. روح على [render.com](https://render.com)
2. اضغط "New +" → "Web Service"
3. اختر الريبو من GitHub
4. **للـ Backend:**
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
5. **للـ Frontend:**
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

---

## 🐛 حل المشاكل الشائعة

### مشكلة 1: CORS Error

**الحل:**
في `backend/src/index.ts` تأكد من:

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
```

### مشكلة 2: WebSocket لا يتصل

**الحل:**
- تأكد من استخدام `wss://` بدلاً من `ws://` للمواقع HTTPS
- تأكد من أن الخادم يدعم WebSocket
- في Railway: WebSocket مدعوم تلقائياً

### مشكلة 3: Build Failed

**الحل:**
```bash
# امسح node_modules وأعد التثبيت
rm -rf backend/node_modules backend/package-lock.json
cd backend && npm install

rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install
```

### مشكلة 4: Backend يعمل لكن الفرونت إند لا يتصل

**الحل:**
- تأكد من رابط الـ Backend في Environment Variables
- افحص Console في المتصفح للأخطاء
- تأكد من CORS_ORIGIN صحيح

---

## 📊 المراقبة والصيانة

### Railway
- Dashboard يعرض logs مباشر
- Metrics للـ CPU والـ Memory
- Automatic deploys عند push للـ GitHub

### Vercel
- Analytics مجاني
- Build logs تفصيلية
- Automatic deploys من GitHub

---

## 💰 التكاليف

### الخطة المجانية (كافية لبداية)

**Railway Free Tier:**
- $5 رصيد مجاني شهرياً
- يكفي لتشغيل الـ Backend 24/7
- 500 ساعة تشغيل

**Vercel Free Tier:**
- Unlimited deployments
- 100 GB bandwidth
- CDN عالمي

### متى تحتاج upgrade؟
- إذا صار عندك traffic عالي (1000+ مستخدم يومياً)
- إذا بدك custom domain
- إذا بدك analytics متقدم

---

## 🎯 الخلاصة والتوصية

### للبداية السريعة:
✅ **Frontend على Vercel + Backend على Railway**

### للمشاريع الصغيرة:
✅ **كل شي على Railway** (أسهل للإدارة)

### للمشاريع الكبيرة:
✅ **Frontend على Vercel + Backend على AWS/GCP**

---

## 📝 Checklist قبل النشر

- [ ] Backend يشتغل محلياً بدون أخطاء
- [ ] Frontend يشتغل محلياً ويتصل بالـ Backend
- [ ] ملفات `.env.example` موجودة وواضحة
- [ ] CORS مضبوط صح
- [ ] WebSocket يتصل بدون مشاكل
- [ ] اختبرت Production build محلياً
- [ ] Environment variables جاهزة للنشر

---

**بالتوفيق في النشر! 🚀**

أي سؤال أو مشكلة، أنا موجود لمساعدتك.

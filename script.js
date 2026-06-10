/* ===================================================================
   رجال ألمع - ملف الجافاسكربت
   يحتوي على: الوضع الليلي، نظام الدخول (LocalStorage)، النوافذ،
   التحقق من المدخلات، المعرض، العدّادات، وحركات الكشف.

   ملاحظة أمنية: نظام الدخول هنا تعليمي ويخزّن البيانات محليًا في
   متصفح المستخدم فقط (LocalStorage). لا تستخدمه لبيانات حقيقية حساسة،
   فهو غير آمن لأنه يعمل في جهة العميل بالكامل.
   =================================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* ============ مفاتيح التخزين ============ */
  const KEYS = {
    users: "ra_users",       // مصفوفة المستخدمين المسجّلين
    session: "ra_session",    // المستخدم الحالي (الجلسة)
    theme: "ra_theme",        // الوضع: light / dark
  };

  /* أدوات مختصرة لاختيار العناصر */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


  /* ===================================================================
     1) الوضع الليلي (Dark Mode)
     =================================================================== */
  const themeToggle = $("#themeToggle");

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  // استرجاع الوضع المحفوظ، أو اتباع تفضيل النظام
  const savedTheme = localStorage.getItem(KEYS.theme)
    || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(KEYS.theme, next);
    applyTheme(next);
  });


  /* ===================================================================
     2) نظام التنبيهات (Toasts)
     =================================================================== */
  const toastWrap = $("#toastWrap");

  function toast(message, type = "success") {
    const el = document.createElement("div");
    el.className = "toast" + (type === "error" ? " error" : "");
    el.innerHTML = `<span>${type === "error" ? "⚠️" : "✅"}</span><span>${message}</span>`;
    toastWrap.appendChild(el);
    // إزالة تلقائية بعد 3.5 ثانية
    setTimeout(() => {
      el.classList.add("out");
      el.addEventListener("animationend", () => el.remove());
    }, 3500);
  }


  /* ===================================================================
     3) نظام الدخول والتسجيل (Authentication عبر LocalStorage)
     =================================================================== */
  const authModal = $("#authModal");
  const loginForm = $("#loginForm");
  const registerForm = $("#registerForm");
  const loginError = $("#loginError");
  const regError = $("#regError");

  // قراءة/حفظ المستخدمين
  const getUsers = () => JSON.parse(localStorage.getItem(KEYS.users) || "[]");
  const saveUsers = (users) => localStorage.setItem(KEYS.users, JSON.stringify(users));

  // الجلسة الحالية
  const getSession = () => JSON.parse(localStorage.getItem(KEYS.session) || "null");
  const setSession = (user) => localStorage.setItem(KEYS.session, JSON.stringify(user));
  const clearSession = () => localStorage.removeItem(KEYS.session);

  // التحقق من صيغة البريد
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* --- فتح / إغلاق النافذة --- */
  function openModal(tab = "login") {
    authModal.hidden = false;
    switchTab(tab);
    document.body.style.overflow = "hidden"; // منع تمرير الخلفية
  }
  function closeModal() {
    authModal.hidden = true;
    document.body.style.overflow = "";
    loginError.textContent = "";
    regError.textContent = "";
    loginForm.reset();
    registerForm.reset();
  }

  // التبديل بين تبويبي الدخول والتسجيل
  function switchTab(tab) {
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
    loginForm.hidden = tab !== "login";
    registerForm.hidden = tab !== "register";
    $("#authTitle").textContent = tab === "login" ? "مرحبًا بعودتك" : "أنشئ حسابك";
    loginError.textContent = "";
    regError.textContent = "";
  }

  /* --- تحديث واجهة الحساب حسب حالة الدخول --- */
  function updateAccountUI() {
    const user = getSession();
    const loginBtn = $("#loginBtn");
    const userMenu = $("#userMenu");

    if (user) {
      // مسجّل دخوله: إخفاء زر الدخول وإظهار اسم المستخدم
      loginBtn.hidden = true;
      userMenu.hidden = false;
      $("#userName").textContent = user.name;
      $("#dropdownName").textContent = user.name;
      $("#userAvatar").textContent = user.name.charAt(0).toUpperCase();
    } else {
      loginBtn.hidden = false;
      userMenu.hidden = true;
    }
  }

  /* --- معالجة التسجيل (إنشاء حساب) --- */
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#regName").value.trim();
    const email = $("#regEmail").value.trim().toLowerCase();
    const pass = $("#regPass").value;

    // التحقق من المدخلات (حماية بسيطة)
    if (!name || !email || !pass) return (regError.textContent = "يرجى تعبئة جميع الحقول.");
    if (name.length < 2) return (regError.textContent = "اسم المستخدم قصير جدًا.");
    if (!isEmail(email)) return (regError.textContent = "صيغة البريد الإلكتروني غير صحيحة.");
    if (pass.length < 6) return (regError.textContent = "كلمة المرور يجب أن تكون 6 أحرف على الأقل.");

    const users = getUsers();
    if (users.some((u) => u.email === email)) {
      return (regError.textContent = "هذا البريد مسجّل مسبقًا، جرّب تسجيل الدخول.");
    }

    // حفظ المستخدم الجديد
    const newUser = { name, email, pass };
    users.push(newUser);
    saveUsers(users);

    // تسجيل الدخول تلقائيًا بعد التسجيل
    setSession({ name, email });
    updateAccountUI();
    closeModal();
    toast(`تم إنشاء حسابك بنجاح، أهلًا ${name}! 🎉`);
  });

  /* --- معالجة تسجيل الدخول --- */
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#loginEmail").value.trim().toLowerCase();
    const pass = $("#loginPass").value;

    if (!email || !pass) return (loginError.textContent = "يرجى إدخال البريد وكلمة المرور.");
    if (!isEmail(email)) return (loginError.textContent = "صيغة البريد الإلكتروني غير صحيحة.");

    const user = getUsers().find((u) => u.email === email && u.pass === pass);
    if (!user) return (loginError.textContent = "البريد أو كلمة المرور غير صحيحة.");

    // إنشاء الجلسة (يبقى مسجّلًا حتى يخرج)
    setSession({ name: user.name, email: user.email });
    updateAccountUI();
    closeModal();
    toast(`أهلًا بعودتك، ${user.name}! 👋`);
  });

  /* --- تسجيل الخروج --- */
  $("#logoutBtn").addEventListener("click", () => {
    clearSession();
    updateAccountUI();
    $("#userDropdown").hidden = true;
    toast("تم تسجيل الخروج بنجاح.");
  });

  /* --- ربط أزرار فتح النافذة --- */
  $("#loginBtn").addEventListener("click", () => openModal("login"));
  $("#bnAccount").addEventListener("click", () => {
    // زر "حسابي" في شريط الجوال: يفتح القائمة إن كان مسجّلًا، وإلا نافذة الدخول
    if (getSession()) $("#userDropdown").hidden = !$("#userDropdown").hidden;
    else openModal("login");
  });

  // قائمة المستخدم المنسدلة
  $("#userChip").addEventListener("click", () => {
    const dd = $("#userDropdown");
    dd.hidden = !dd.hidden;
  });
  // إغلاق القائمة عند الضغط خارجها
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#userMenu") && !e.target.closest("#bnAccount")) {
      $("#userDropdown").hidden = true;
    }
  });

  // تبويبات النافذة + أزرار الإغلاق
  $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));
  $$("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
  // إغلاق بمفتاح Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!authModal.hidden) closeModal();
      if (!$("#lightbox").hidden) closeLightbox();
    }
  });

  // تطبيق الحالة عند تحميل الصفحة (يبقى مسجّلًا)
  updateAccountUI();


  /* ===================================================================
     4) نموذج التواصل (واجهة فقط مع تحقق)
     =================================================================== */
  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#cName").value.trim();
    const email = $("#cEmail").value.trim();
    const msg = $("#cMsg").value.trim();

    if (!name || !email || !msg) return toast("يرجى تعبئة جميع الحقول.", "error");
    if (!isEmail(email)) return toast("صيغة البريد الإلكتروني غير صحيحة.", "error");

    e.target.reset();
    toast("تم استلام رسالتك، سنتواصل معك قريبًا! 📨");
  });


  /* ===================================================================
     5) قائمة الجوال + التمرير الناعم + الرابط النشط
     =================================================================== */
  const navLinks = $("#navLinks");

  // فتح/إغلاق قائمة الجوال
  $("#menuToggle").addEventListener("click", () => navLinks.classList.toggle("open"));

  // إغلاق القائمة عند الضغط على رابط
  $$(".nav-link").forEach((link) =>
    link.addEventListener("click", () => navLinks.classList.remove("open"))
  );

  // تظليل الرابط النشط حسب القسم الظاهر
  const sections = $$("section[id]");
  const navLinkEls = $$(".nav-link");
  const bottomNavEls = $$(".bn-item[href]");

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinkEls.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${id}`));
          bottomNavEls.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === `#${id}`));
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));


  /* ===================================================================
     6) شريط التنقل: ظل عند التمرير + زر العودة للأعلى
     =================================================================== */
  const navbar = $("#navbar");
  const toTop = $("#toTop");

  window.addEventListener("scroll", () => {
    const y = window.scrollY;
    navbar.classList.toggle("scrolled", y > 10);
    // زر العودة للأعلى
    if (y > 500) { toTop.hidden = false; requestAnimationFrame(() => toTop.classList.add("show")); }
    else { toTop.classList.remove("show"); }
  });

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));


  /* ===================================================================
     7) حركات الكشف عند التمرير + عدّاد الإحصائيات
     =================================================================== */
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          // تشغيل العدّاد إن كان داخل العنصر أرقام
          $$(".stat-num", entry.target).forEach(countUp);
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  // عدّاد تصاعدي للأرقام
  function countUp(el) {
    const target = +el.dataset.count;
    if (!target || el.dataset.done) return;
    el.dataset.done = "1";
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // تباطؤ في النهاية
      el.textContent = Math.floor(eased * target).toLocaleString("ar-EG");
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }


  /* ===================================================================
     8) صندوق الإضاءة لعرض صور المعرض (Lightbox)
     =================================================================== */
  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.style.overflow = "";
  }

  $$(".gallery-item").forEach((item) => {
    item.addEventListener("click", () => {
      const img = $("img", item);
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  $("#lightboxClose").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });

});

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

// Define available languages
export type Language = "en" | "ar"

// Define the context type
type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  dir: "ltr" | "rtl"
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Translations
const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    "app.name": "MedConnect",
    "app.tagline": "Doctor Patient Meeting Platform",

    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.patients": "Patients",
    "nav.followUps": "Follow Ups",
    "nav.coldLeads": "Cold Leads",
    "nav.makeCalls": "Make Calls",
    "nav.doctors": "Doctors",
    "nav.clinics": "Clinics",
    "nav.settings": "Settings",
    "nav.signOut": "Sign Out",
    "nav.messages": "Messages",

    // Dashboard
    "dashboard.title": "Dashboard",
    "dashboard.totalPatients": "Total Patients",
    "dashboard.callsMade": "Calls Made",
    "dashboard.messagesSent": "Messages Sent",
    "dashboard.interested": "Interested",
    "dashboard.pending": "Pending",
    "dashboard.patientStatus": "Patient Status Distribution",
    "dashboard.callStatistics": "Call Statistics",
    "dashboard.conversionRate": "Conversion Rate by Doctor",
    "dashboard.leadFunnel": "Lead Funnel",
    "dashboard.aiInsights": "AI Insights",
    "dashboard.leadFunnel": "Lead Funnel",
    "dashboard.messageStats": "Message Statistics",
    "dashboard.responseRate": "Response Rate",

    // Patients
    "patients.title": "Patients",
    "patients.add": "Add Patient",
    "patients.bulkImport": "Bulk Import",
    "patients.search": "Search patients...",
    "patients.name": "Name",
    "patients.phone": "Phone",
    "patients.email": "Email",
    "patients.status": "Status",
    "patients.appointmentDate": "Appointment Date",
    "patients.addedBy": "Added By",
    "patients.age": "Age",
    "patients.gender": "Gender",
    "patients.clinic": "Clinic",
    "patients.doctor": "Doctor",
    "patients.actions": "Actions",
    "patients.noResults": "No patients found.",
    "patients.edit": "Edit",
    "patients.view": "View Details",
    "patients.delete": "Delete",
    "patients.select": "Select Patient",
    "patients.fetchError": "Failed to fetch patients",
    "patients.filterByStatus": "Filter by Status",

    // Gender
    "gender.male": "Male",
    "gender.female": "Female",
    "gender.other": "Other",

    // Status
    "status.pending": "Pending",
    "status.called": "Called",
    "status.notAnswered": "Not Answered",
    "status.followUp": "Follow Up",
    "status.interested": "Interested",
    "status.notInterested": "Not Interested",
    "status.booked": "Booked",
    "status.wrongNumber": "Wrong Number",
    "status.busy": "Busy",
    "status.callBack": "Call Back Later",

    // Forms
    "form.save": "Save",
    "form.cancel": "Cancel",
    "form.submit": "Submit",
    "form.update": "Update",
    "form.delete": "Delete",
    "form.required": "Required",
    "form.optional": "Optional",
    "form.basic": "Basic Info",
    "form.select": "Select...",
    "form.submitting": "Submitting...",

    // Settings
    "settings.title": "Settings",
    "settings.callSettings": "Call Settings",
    "settings.messageSettings": "Message Settings",
    "settings.followupSettings": "Follow-up Settings",
    "settings.callStartTime": "Call Start Time",
    "settings.callEndTime": "Call End Time",
    "settings.maxCallsPerDay": "Maximum Calls Per Day",
    "settings.retellApiKey": "Retell AI API Key",
    "settings.twilioApiKey": "Twilio API Key",
    "settings.twilioAccountSid": "Twilio Account SID",
    "settings.twilioAuthToken": "Twilio Auth Token",
    "settings.whatsappFromNumber": "WhatsApp From Number",
    "settings.messageBeforeCall": "Send Message Before Call",
    "settings.messageTemplate": "Message Template",
    "settings.maxFollowupCalls": "Maximum Follow-up Calls",
    "settings.maxFollowupMessages": "Maximum Follow-up Messages",
    "settings.daysBeforeFollowup": "Days Before Follow-up",
    "settings.preferredCallDay": "Preferred Call Day",
    "settings.preferredCallTime": "Preferred Call Time",
    "settings.scriptVariables": "You can use variables like {{patient_name}}, {{doctor_name}}, {{appointment_date}}",
    "settings.scriptPlaceholder": "Enter call script here...",
    "settings.validate": "Validate",
    "settings.validating": "Validating...",
    "settings.validSuccess": "API key is valid",
    "settings.validFail": "API key is invalid",
    "settings.validError": "Error validating API key",
    "settings.saving": "Saving settings...",
    "settings.saveSettings": "Save Settings",
    "settings.saveSuccess": "Settings saved successfully",
    "settings.updateError": "Failed to update settings",
    "settings.fetchError": "Failed to fetch settings",
    "settings.testRetell": "Test Retell AI",
    "settings.callSettingsDesc": "Configure when and how calls are made",
    "settings.messageSettingsDesc": "Configure WhatsApp messaging settings",
    "settings.followupSettingsDesc": "Configure follow-up behavior",
    "settings.twilioPhoneNumberDesc": "Enter the WhatsApp number with country code (e.g., +1234567890)",
    "settings.messageTemplateDesc": "Use variables like {{patient_name}}, {{doctor_name}}, {{appointment_date}}",
    "settings.information": "Information",

    // Authentication
    "auth.signIn": "Sign In",
    "auth.signingIn": "Signing In...",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgotPassword": "Forgot Password?",
    "auth.loginFailed": "Login Failed",
    "auth.invalidCredentials": "Invalid email or password",
    "auth.unknownError": "Something went wrong. Please try again.",
    "auth.loginSuccess": "Login Successful",
    "auth.redirecting": "Redirecting to dashboard...",

    // Clinics
    "clinics.title": "Clinics",
    "clinics.add": "Add Clinic",
    "clinics.name": "Clinic Name",
    "clinics.address": "Address",
    "clinics.phone": "Phone",
    "clinics.email": "Email",
    "clinics.doctors": "Doctors",
    "clinics.patients": "Patients",
    "clinics.actions": "Actions",
    "clinics.view": "View Details",
    "clinics.edit": "Edit",
    "clinics.search": "Search clinics...",
    "clinics.noResults": "No clinics found.",
    "clinics.website": "Website",
    "clinics.information": "Clinic Information",
    "clinics.addSuccess": "Clinic added successfully",
    "clinics.addError": "Failed to add clinic",
    "clinics.manage": "Manage Doctors",

    // Doctors
    "doctors.title": "Doctors",
    "doctors.add": "Add Doctor",
    "doctors.name": "Name",
    "doctors.email": "Email",
    "doctors.phone": "Phone",
    "doctors.specialty": "Specialty",
    "doctors.clinic": "Clinic",
    "doctors.manage": "Manage Doctors",

    // Messages
    "messages.title": "Messages",
    "messages.send": "Send Message",
    "messages.template": "Message Template",
    "messages.history": "Message History",
    "messages.status": "Status",
    "messages.sent": "Sent",
    "messages.delivered": "Delivered",
    "messages.read": "Read",
    "messages.failed": "Failed",
    "messages.queued": "Queued",
    "messages.content": "Message Content",
    "messages.sentAt": "Sent At",
    "messages.type": "Type",
    "messages.sentBy": "Sent By",
    "messages.actions": "Actions",
    "messages.reply": "Reply",
    "messages.search": "Search messages...",
    "messages.noResults": "No messages found.",
    "messages.selectTemplate": "Select a template",
    "messages.contentPlaceholder": "Enter your message here...",
    "messages.contentHelp": "Use variables like {{patient_name}}, {{doctor_name}}, {{appointment_date}}",
    "messages.sending": "Sending...",
    "messages.selectPatient": "Please select a patient",
    "messages.enterMessage": "Please enter a message",
    "messages.sendError": "Failed to send message",
    "messages.sendSuccess": "Message sent successfully",
    "messages.sendDesc": "Send a WhatsApp message to a patient",
    "messages.attempts": "Message Attempts",
    "messages.filterByStatus": "Filter by Status",
    "messages.responded": "Responded",
    "messages.notResponded": "Not Responded",
    "messages.whatsappIntegration": "Enable WhatsApp Integration",
    "messages.reminder": "Reminder",
    "messages.confirmation": "Confirmation",
    "messages.followUp": "Follow-up",
    "messages.webhookUrl": "Webhook URL",

    // Calls
    "calls.title": "Calls",
    "calls.make": "Make Call",
    "calls.history": "Call History",
    "calls.status": "Status",
    "calls.duration": "Duration",
    "calls.recording": "Recording",
    "calls.transcript": "Transcript",
    "calls.schedule": "Schedule Call",
    "calls.scheduling": "Scheduling calls...",
    "calls.scheduleTomorrow": "Schedule Tomorrow's Calls",
    "calls.scheduleDesc": "Schedule automated calls for patients with appointments tomorrow",
    "calls.scheduleError": "Failed to schedule calls",
    "calls.scheduledSuccess": "Successfully scheduled calls:",
    "calls.script": "Call Script",
    "calls.attempts": "Call Attempts",

    // Follow-ups
    "followups.title": "Follow Ups",
    "followups.description": "Patients who answered the call and require follow-up.",
    "followups.recentCalls": "Recent Call Recordings",
    "followups.process": "Process Follow-ups",
    "followups.processing": "Processing follow-ups...",
    "followups.processSuccess": "Follow-ups processed successfully",
    "followups.processError": "Failed to process follow-ups",
    "followups.filterByStatus": "Filter by Status",

    // Cold Leads
    "coldleads.title": "Cold Leads",
    "coldleads.description": "Patients who did not answer the automated calls or messages.",
    "coldleads.reason": "Reason",
    "coldleads.filterByReason": "Filter by Reason",

    // Days
    "days.monday": "Monday",
    "days.tuesday": "Tuesday",
    "days.wednesday": "Wednesday",
    "days.thursday": "Thursday",
    "days.friday": "Friday",
    "days.saturday": "Saturday",
    "days.sunday": "Sunday",

    // Notifications
    "notification.success": "Success",
    "notification.error": "Error",
    "notification.warning": "Warning",
    "notification.info": "Information",

    // AI Insights
    "ai.insights": "AI Insights",
    "ai.analysis": "AI Analysis",
    "ai.feedback": "AI Feedback",
    "ai.sentiment": "Sentiment Analysis",
    "ai.positive": "Positive",
    "ai.negative": "Negative",
    "ai.neutral": "Neutral",
    "ai.intent": "Patient Intent",
    "ai.recommendation": "AI Recommendation",
  },
  ar: {
    // Common
    "app.name": "ميدكونيكت",
    "app.tagline": "منصة لقاء الطبيب والمريض",

    // Navigation
    "nav.dashboard": "لوحة التحكم",
    "nav.patients": "المرضى",
    "nav.followUps": "المتابعات",
    "nav.coldLeads": "العملاء المحتملين",
    "nav.makeCalls": "إجراء المكالمات",
    "nav.doctors": "الأطباء",
    "nav.clinics": "العيادات",
    "nav.settings": "الإعدادات",
    "nav.signOut": "تسجيل الخروج",
    "nav.messages": "الرسائل",

    // Dashboard
    "dashboard.title": "لوحة التحكم",
    "dashboard.totalPatients": "إجمالي المرضى",
    "dashboard.callsMade": "المكالمات التي تم إجراؤها",
    "dashboard.messagesSent": "الرسائل المرسلة",
    "dashboard.interested": "مهتم",
    "dashboard.pending": "قيد الانتظار",
    "dashboard.patientStatus": "توزيع حالة المريض",
    "dashboard.callStatistics": "إحصائيات المكالمات",
    "dashboard.conversionRate": "معدل التحويل حسب الطبيب",
    "dashboard.leadFunnel": "قمع العملاء المحتملين",
    "dashboard.aiInsights": "رؤى الذكاء الاصطناعي",
    "dashboard.leadFunnel": "قمع العملاء المحتملين",
    "dashboard.messageStats": "إحصائيات الرسائل",
    "dashboard.responseRate": "معدل الاستجابة",

    // Patients
    "patients.title": "المرضى",
    "patients.add": "إضافة مريض",
    "patients.bulkImport": "استيراد بالجملة",
    "patients.search": "البحث عن المرضى...",
    "patients.name": "الاسم",
    "patients.phone": "الهاتف",
    "patients.email": "البريد الإلكتروني",
    "patients.status": "الحالة",
    "patients.appointmentDate": "تاريخ الموعد",
    "patients.addedBy": "تمت الإضافة بواسطة",
    "patients.age": "العمر",
    "patients.gender": "الجنس",
    "patients.clinic": "العيادة",
    "patients.doctor": "الطبيب",
    "patients.actions": "الإجراءات",
    "patients.noResults": "لم يتم العثور على مرضى.",
    "patients.edit": "تعديل",
    "patients.view": "عرض التفاصيل",
    "patients.delete": "حذف",
    "patients.select": "اختر المريض",
    "patients.fetchError": "فشل في جلب المرضى",
    "patients.filterByStatus": "تصفية حسب الحالة",

    // Gender
    "gender.male": "ذكر",
    "gender.female": "أنثى",
    "gender.other": "آخر",

    // Status
    "status.pending": "قيد الانتظار",
    "status.called": "تم الاتصال",
    "status.notAnswered": "لم يتم الرد",
    "status.followUp": "متابعة",
    "status.interested": "مهتم",
    "status.notInterested": "غير مهتم",
    "status.booked": "تم الحجز",
    "status.wrongNumber": "رقم خاطئ",
    "status.busy": "مشغول",
    "status.callBack": "معاودة الاتصال لاحقًا",

    // Forms
    "form.save": "حفظ",
    "form.cancel": "إلغاء",
    "form.submit": "إرسال",
    "form.update": "تحديث",
    "form.delete": "حذف",
    "form.required": "مطلوب",
    "form.optional": "اختياري",
    "form.basic": "معلومات أساسية",
    "form.select": "اختر...",
    "form.submitting": "جاري الإرسال...",

    // Settings
    "settings.title": "الإعدادات",
    "settings.callSettings": "إعدادات المكالمات",
    "settings.messageSettings": "إعدادات الرسائل",
    "settings.followupSettings": "إعدادات المتابعة",
    "settings.callStartTime": "وقت بدء المكالمة",
    "settings.callEndTime": "وقت انتهاء المكالمة",
    "settings.maxCallsPerDay": "الحد الأقصى للمكالمات في اليوم",
    "settings.retellApiKey": "مفتاح واجهة برمجة تطبيقات Retell AI",
    "settings.twilioApiKey": "مفتاح واجهة برمجة تطبيقات Twilio",
    "settings.twilioAccountSid": "معرف حساب Twilio",
    "settings.twilioAuthToken": "رمز مصادقة Twilio",
    "settings.whatsappFromNumber": "رقم WhatsApp المرسل",
    "settings.messageBeforeCall": "إرسال رسالة قبل المكالمة",
    "settings.messageTemplate": "قالب الرسالة",
    "settings.maxFollowupCalls": "الحد الأقصى لمكالمات المتابعة",
    "settings.maxFollowupMessages": "الحد الأقصى لرسائل المتابعة",
    "settings.daysBeforeFollowup": "الأيام قبل المتابعة",
    "settings.preferredCallDay": "يوم الاتصال المفضل",
    "settings.preferredCallTime": "وقت الاتصال المفضل",
    "settings.scriptVariables": "يمكنك استخدام متغيرات مثل {{patient_name}}، {{doctor_name}}، {{appointment_date}}",
    "settings.scriptPlaceholder": "أدخل نص المكالمة هنا...",
    "settings.validate": "تحقق",
    "settings.validating": "جاري التحقق...",
    "settings.validSuccess": "مفتاح API صالح",
    "settings.validFail": "مفتاح API غير صالح",
    "settings.validError": "خطأ في التحقق من مفتاح API",
    "settings.saving": "جاري حفظ الإعدادات...",
    "settings.saveSettings": "حفظ الإعدادات",
    "settings.saveSuccess": "تم حفظ الإعدادات بنجاح",
    "settings.updateError": "فشل في تحديث الإعدادات",
    "settings.fetchError": "فشل في جلب الإعدادات",
    "settings.testRetell": "اختبار Retell AI",
    "settings.callSettingsDesc": "تكوين متى وكيف يتم إجراء المكالمات",
    "settings.messageSettingsDesc": "تكوين إعدادات رسائل WhatsApp",
    "settings.followupSettingsDesc": "تكوين سلوك المتابعة",
    "settings.twilioPhoneNumberDesc": "أدخل رقم WhatsApp مع رمز البلد (مثل +1234567890)",
    "settings.messageTemplateDesc": "استخدم متغيرات مثل {{patient_name}}، {{doctor_name}}، {{appointment_date}}",
    "settings.information": "معلومات",

    // Authentication
    "auth.signIn": "تسجيل الدخول",
    "auth.signingIn": "جاري تسجيل الدخول...",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.forgotPassword": "نسيت كلمة المرور؟",
    "auth.loginFailed": "فشل تسجيل الدخول",
    "auth.invalidCredentials": "بريد إلكتروني أو كلمة مرور غير صالحة",
    "auth.unknownError": "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    "auth.loginSuccess": "تم تسجيل الدخول بنجاح",
    "auth.redirecting": "جاري التوجيه إلى لوحة التحكم...",

    // Clinics
    "clinics.title": "العيادات",
    "clinics.add": "إضافة عيادة",
    "clinics.name": "اسم العيادة",
    "clinics.address": "العنوان",
    "clinics.phone": "الهاتف",
    "clinics.email": "البريد الإلكتروني",
    "clinics.doctors": "الأطباء",
    "clinics.patients": "المرضى",
    "clinics.actions": "الإجراءات",
    "clinics.view": "عرض التفاصيل",
    "clinics.edit": "تعديل",
    "clinics.search": "البحث عن العيادات...",
    "clinics.noResults": "لم يتم العثور على عيادات.",
    "clinics.website": "الموقع الإلكتروني",
    "clinics.information": "معلومات العيادة",
    "clinics.addSuccess": "تمت إضافة العيادة بنجاح",
    "clinics.addError": "فشل في إضافة العيادة",
    "clinics.manage": "إدارة الأطباء",

    // Doctors
    "doctors.title": "الأطباء",
    "doctors.add": "إضافة طبيب",
    "doctors.name": "الاسم",
    "doctors.email": "البريد الإلكتروني",
    "doctors.phone": "الهاتف",
    "doctors.specialty": "التخصص",
    "doctors.clinic": "العيادة",
    "doctors.manage": "إدارة الأطباء",

    // Messages
    "messages.title": "الرسائل",
    "messages.send": "إرسال رسالة",
    "messages.template": "قالب الرسالة",
    "messages.history": "سجل الرسائل",
    "messages.status": "الحالة",
    "messages.sent": "تم الإرسال",
    "messages.delivered": "تم التسليم",
    "messages.read": "تمت القراءة",
    "messages.failed": "فشل",
    "messages.queued": "في قائمة الانتظار",
    "messages.content": "محتوى الرسالة",
    "messages.sentAt": "تم الإرسال في",
    "messages.type": "النوع",
    "messages.sentBy": "تم الإرسال بواسطة",
    "messages.actions": "الإجراءات",
    "messages.reply": "الرد",
    "messages.search": "البحث عن الرسائل...",
    "messages.noResults": "لم يتم العثور على رسائل.",
    "messages.selectTemplate": "اختر قالبًا",
    "messages.contentPlaceholder": "أدخل رسالتك هنا...",
    "messages.contentHelp": "استخدم متغيرات مثل {{patient_name}}، {{doctor_name}}، {{appointment_date}}",
    "messages.sending": "جاري الإرسال...",
    "messages.selectPatient": "الرجاء اختيار مريض",
    "messages.enterMessage": "الرجاء إدخال رسالة",
    "messages.sendError": "فشل في إرسال الرسالة",
    "messages.sendSuccess": "تم إرسال الرسالة بنجاح",
    "messages.sendDesc": "إرسال رسالة WhatsApp إلى مريض",
    "messages.attempts": "محاولات الرسائل",
    "messages.filterByStatus": "تصفية حسب الحالة",
    "messages.responded": "تم الرد",
    "messages.notResponded": "لم يتم الرد",
    "messages.whatsappIntegration": "تمكين تكامل واتساب",
    "messages.reminder": "تذكير",
    "messages.confirmation": "تأكيد",
    "messages.followUp": "متابعة",
    "messages.webhookUrl": "رابط الويب هوك",

    // Calls
    "calls.title": "المكالمات",
    "calls.make": "إجراء مكالمة",
    "calls.history": "سجل المكالمات",
    "calls.status": "الحالة",
    "calls.duration": "المدة",
    "calls.recording": "التسجيل",
    "calls.transcript": "النص",
    "calls.schedule": "جدولة مكالمة",
    "calls.scheduling": "جاري جدولة المكالمات...",
    "calls.scheduleTomorrow": "جدولة مكالمات الغد",
    "calls.scheduleDesc": "جدولة مكالمات آلية للمرضى الذين لديهم مواعيد غدًا",
    "calls.scheduleError": "فشل في جدولة المكالمات",
    "calls.scheduledSuccess": "تم جدولة المكالمات بنجاح:",
    "calls.script": "نص المكالمة",
    "calls.attempts": "محاولات الاتصال",

    // Follow-ups
    "followups.title": "المتابعات",
    "followups.description": "المرضى الذين ردوا على المكالمة ويحتاجون إلى متابعة.",
    "followups.recentCalls": "تسجيلات المكالمات الأخيرة",
    "followups.process": "معالجة المتابعات",
    "followups.processing": "جاري معالجة المتابعات...",
    "followups.processSuccess": "تمت معالجة المتابعات بنجاح",
    "followups.processError": "فشل في معالجة المتابعات",
    "followups.filterByStatus": "تصفية حسب الحالة",

    // Cold Leads
    "coldleads.title": "العملاء المحتملين",
    "coldleads.description": "المرضى الذين لم يردوا على المكالمات أو الرسائل الآلية.",
    "coldleads.reason": "السبب",
    "coldleads.filterByReason": "تصفية حسب السبب",

    // Days
    "days.monday": "الاثنين",
    "days.tuesday": "الثلاثاء",
    "days.wednesday": "الأربعاء",
    "days.thursday": "الخميس",
    "days.friday": "الجمعة",
    "days.saturday": "السبت",
    "days.sunday": "الأحد",

    // Notifications
    "notification.success": "نجاح",
    "notification.error": "خطأ",
    "notification.warning": "تحذير",
    "notification.info": "معلومات",

    // AI Insights
    "ai.insights": "رؤى الذكاء الاصطناعي",
    "ai.analysis": "تحليل الذكاء الاصطناعي",
    "ai.feedback": "تعليقات الذكاء الاصطناعي",
    "ai.sentiment": "تحليل المشاعر",
    "ai.positive": "إيجابي",
    "ai.negative": "سلبي",
    "ai.neutral": "محايد",
    "ai.intent": "نية المريض",
    "ai.recommendation": "توصية الذكاء الاصطناعي",
  },
}

// Provider component
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en")
  const router = useRouter()

  // Set the language and update HTML dir attribute
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr")
    document.documentElement.setAttribute("lang", lang)
    localStorage.setItem("language", lang)
  }

  // Translation function
  const t = (key: string): string => {
    return translations[language][key] || key
  }

  // Get direction based on language
  const dir = language === "ar" ? "rtl" : "ltr"

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "ar")) {
      setLanguage(savedLanguage)
    }
  }, [])

  return <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>{children}</LanguageContext.Provider>
}

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

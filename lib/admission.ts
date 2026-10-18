// Admission information shown on the home page. The administrator can rewrite every section from Admin > Admission info (one point per line).
export type AdmissionInfo = { requirements_en: string; requirements_ur: string; steps_en: string; steps_ur: string; fees_en: string; fees_ur: string };
export const ADMISSION_DEFAULTS: AdmissionInfo = {
  requirements_en: [
    'Student’s full name, father’s name, date of birth and gender',
    'A working email address (used for your account and password reset)',
    'A WhatsApp number with country code, for example +923001234567',
    'A phone, tablet or computer with a camera and microphone',
    'A stable internet connection and a quiet place for class',
    'A copy of the Quran for the lesson',
    'A clear, recent photo of the student (it becomes the permanent profile picture)'].join('\n'),
  requirements_ur: [
    'طالب علم کا پورا نام، والد کا نام، تاریخِ پیدائش اور جنس',
    'کام کرتا ہوا ای میل ایڈریس (اکاؤنٹ اور پاسورڈ ری سیٹ کے لیے)',
    'ملک کے کوڈ کے ساتھ واٹس ایپ نمبر، مثلاً +923001234567',
    'کیمرہ اور مائیکروفون والا فون، ٹیبلیٹ یا کمپیوٹر',
    'مستحکم انٹرنیٹ اور کلاس کے لیے پرسکون جگہ',
    'سبق کے لیے قرآن مجید کا نسخہ',
    'طالب علم کی صاف اور حالیہ تصویر (یہی مستقل پروفائل تصویر بنے گی)'].join('\n'),
  steps_en: [
    'Open the Register page and fill in the form.',
    'The academy reviews your application and contacts you.',
    'After approval you receive your Student ID and a temporary password by email.',
    'Log in and change your password. Your fee card is ready in your dashboard.',
    'The academy arranges your class timing. It appears on your Classes page.',
    'Join your live class from the Classes page.'].join('\n'),
  steps_ur: [
    'رجسٹریشن کا صفحہ کھولیں اور فارم پُر کریں۔',
    'اکیڈمی آپ کی درخواست دیکھ کر آپ سے رابطہ کرتی ہے۔',
    'منظوری کے بعد آپ کو ای میل پر طالب علم ID اور عارضی پاسورڈ ملتا ہے۔',
    'لاگ اِن کر کے پاسورڈ بدل لیں۔ آپ کا فیس کارڈ ڈیش بورڈ میں تیار ہوگا۔',
    'کلاس کا وقت اکیڈمی طے کرتی ہے اور وہ آپ کے کلاسز کے صفحے پر نظر آتا ہے۔',
    'کلاسز کے صفحے سے اپنی لائیو کلاس میں شامل ہوں۔'].join('\n'),
  fees_en: [
    'The fee of each course is shown on the Courses page and on the registration form.',
    'After approval, your dashboard shows your fee card: amount, due date and status.',
    'Pay into one of the academy’s payment accounts listed on your Fees page.',
    'Enter the transaction number (and receipt, if asked) on the Fees page.',
    'The academy verifies the payment and marks the fee as paid.',
    'Keep your receipt until the payment shows as verified.'].join('\n'),
  fees_ur: [
    'ہر کورس کی فیس کورسز کے صفحے اور رجسٹریشن فارم پر درج ہے۔',
    'منظوری کے بعد آپ کے ڈیش بورڈ میں فیس کارڈ نظر آتا ہے: رقم، آخری تاریخ اور حالت۔',
    'ادائیگی فیس کے صفحے پر دیے گئے اکیڈمی کے کسی ادائیگی اکاؤنٹ میں کریں۔',
    'فیس کے صفحے پر ٹرانزیکشن نمبر (اور اگر کہا جائے تو رسید) درج کریں۔',
    'اکیڈمی ادائیگی کی تصدیق کر کے فیس کو ادا شدہ کر دیتی ہے۔',
    'ادائیگی کی تصدیق ہونے تک اپنی رسید سنبھال کر رکھیں۔'].join('\n'),
};
export function pick(saved: Partial<AdmissionInfo> | null | undefined): AdmissionInfo {
  const s = saved ?? {}; const o = { ...ADMISSION_DEFAULTS };
  (Object.keys(o) as (keyof AdmissionInfo)[]).forEach(k => { if (typeof s[k] === 'string' && s[k]!.trim()) o[k] = s[k]!; });
  return o;
}
export const lines = (t: string) => t.split('\n').map(x => x.trim()).filter(Boolean);

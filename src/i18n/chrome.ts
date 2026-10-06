/* Header and footer strings. English and Arabic are copied from legacy/i18n.js (chrome block), same keys in both.
   The Arabic navigation keeps the legacy items until the new labels have been translated and reviewed by a native reader. */
import type { NavItem } from '../content/site';

export const chrome = {
  en: {
    skip: 'Skip to content', homeAria: 'AIUXAleem home', display: 'Display settings', menu: 'Menu', openMenu: 'Open menu', closeMenu: 'Close menu',
    toDark: 'Switch to dark theme', toLight: 'Switch to light theme', darkTip: 'Dark theme', lightTip: 'Light theme',
    langLabel: 'العربية', langLabelLang: 'ar', langHint: 'read this page in Arabic', langHintFallback: 'this page is English only, so this opens the closest Arabic page',
    langTip: 'Arabic', langTipFallback: 'English only. Opens the closest Arabic page.',
    resumeMenu: 'Download resume (PDF)', resume: 'Download resume', resumeView: 'View resume', copyEmail: 'Copy email address', copied: 'Copied', pressCopy: 'Selected. Press Ctrl+C or Cmd+C to copy.',
    footerOverline: 'Hiring or building?', footerTitle: "Let's make it trustworthy.", call: 'Book a 15-min call', newTab: '(opens in a new tab)',
    bio: 'Mohammad Abdul Aleem, Lead AI Product Designer. Enterprise UX, design systems and AI product design from Hyderabad, on GCC hours, for teams in KSA, UAE and anywhere.',
    rights: '© 2026 Mohammad Abdul Aleem · Hyderabad, India', footerNav: 'Footer', talk: "Let's talk",
  },
  ar: {
    skip: 'تخطَّ إلى المحتوى', homeAria: 'الصفحة الرئيسية لـ AIUXAleem', display: 'إعدادات العرض', menu: 'القائمة', openMenu: 'افتح القائمة', closeMenu: 'أغلق القائمة',
    toDark: 'التبديل إلى الوضع الداكن', toLight: 'التبديل إلى الوضع الفاتح', darkTip: 'الوضع الداكن', lightTip: 'الوضع الفاتح',
    langLabel: 'English', langLabelLang: 'en', langHint: 'اقرأ هذه الصفحة بالإنجليزية', langHintFallback: 'اقرأ هذه الصفحة بالإنجليزية',
    langTip: 'English', langTipFallback: 'English',
    resumeMenu: 'تحميل السيرة الذاتية (PDF)', resume: 'تحميل السيرة الذاتية', resumeView: 'عرض السيرة الذاتية', copyEmail: 'نسخ عنوان البريد', copied: 'تم النسخ', pressCopy: 'تم التحديد. اضغط Ctrl+C أو Cmd+C للنسخ.',
    footerOverline: 'توظيف أم بناء؟', footerTitle: 'لنجعله جديرًا بالثقة.', call: 'احجز مكالمة لمدة 15 دقيقة', newTab: '(يفتح في علامة تبويب جديدة)',
    bio: 'محمد عبد العليم، مصمّم منتجات رئيسي يضع الذكاء الاصطناعي أولًا. تجربة مستخدم للمؤسسات وأنظمة تصميم وتصميم منتجات ذكاء اصطناعي، من حيدر آباد، بتوقيت الخليج، لفرق في السعودية والإمارات وأي مكان.',
    rights: '© 2026 محمد عبد العليم · حيدر آباد، الهند', footerNav: 'تذييل الموقع', talk: 'لنتحدّث',
  },
} as const;

/** Arabic navigation from the legacy site: only Home and case studies exist in Arabic, so the rest point at Home sections. */
export const arNav: NavItem[] = [
  { key: 'work', label: 'الأعمال', href: '/case-studies' },
  { key: 'content', label: 'المحتوى', href: '/ar#content' },
  { key: 'guides', label: 'الأدلة', href: '/ar#guides' },
  { key: 'services', label: 'الخدمات', href: '/ar#services' },
  { key: 'about', label: 'نبذة عني', href: '/ar#about' },
];

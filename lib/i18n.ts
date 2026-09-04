/**
 * Every user-facing string in the app lives here. No hardcoded text in JSX.
 *
 * `uz` is the source of truth: `ru` is typed as Record<UzKey, string>, so
 * TypeScript fails the build the moment a key is added to uz and forgotten in ru.
 */

export const locales = ['uz', 'ru'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'uz'
export const LOCALE_COOKIE = 'darsly_locale'

const uz = {
  'app.name': 'Darsly',
  'app.tagline': 'Interaktiv mashqlar yaratuvchi',

  'common.signIn': 'Kirish',
  'common.signOut': 'Chiqish',
  'common.retry': 'Qayta urinish',
  'common.loading': 'Yuklanmoqda…',
  'common.language': 'Til',
  'common.dashboard': 'Mashqlarim',

  'hero.title': 'Bir marta kiriting — oltita o‘yin chiqsin',
  'hero.subtitle':
    'So‘z juftliklari, savollar yoki kategoriyalarni bir marta kiritasiz. Ular o‘zi viktorina, moslashtirish, kartochka va boshqa interaktiv o‘yinlarga aylanadi.',
  'hero.ctaPrimary': 'Bepul boshlash',
  'hero.ctaSecondary': 'Kutubxonani ko‘rish',

  'how.title': 'Qanday ishlaydi',
  'how.step1.title': 'Kontent kiriting',
  'how.step1.body':
    'Jadvalga yozing yoki Excel’dan to‘g‘ridan-to‘g‘ri nusxa ko‘chiring. Yigirma qatorni qo‘lda terish shart emas.',
  'how.step2.title': 'O‘yinni tanlang',
  'how.step2.body':
    'Bitta bosish bilan o‘yinni almashtiring. Ma’lumotni qayta kiritish hech qachon kerak bo‘lmaydi.',
  'how.step3.title': 'Havolani ulashing',
  'how.step3.body':
    'O‘quvchilar telefonda ochadi. Natijalar sizga qaytib keladi.',

  'games.title': 'Mavjud o‘yinlar',
  'game.quiz': 'Viktorina',
  'game.match-up': 'Moslashtirish',
  'game.flashcards': 'Kartochkalar',
  'game.matching-pairs': 'Juftini top',
  'game.group-sort': 'Guruhlarga ajratish',
  'game.anagram': 'Anagramma',

  'footer.builtFor': 'O‘zbekiston o‘qituvchilari uchun',

  'login.title': 'Kirish',
  'login.subtitle':
    'Elektron pochtangizga kirish havolasini yuboramiz — parol kerak emas.',
  'login.email': 'Elektron pochta',
  'login.emailPlaceholder': 'ism@maktab.uz',
  'login.sendLink': 'Havola yuborish',
  'login.sending': 'Yuborilmoqda…',
  'login.google': 'Google bilan davom etish',
  'login.or': 'yoki',
  'login.sent.title': 'Pochtangizni tekshiring',
  'login.sent.body':
    'Kirish havolasini yubordik. Havolani bossangiz, avtomatik kirasiz.',
  'login.error.invalidEmail': 'Elektron pochta manzili noto‘g‘ri.',
  'login.error.sendFailed':
    'Havolani yuborib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring.',
  'login.error.oauthFailed': 'Google orqali kirish amalga oshmadi.',

  'dashboard.title': 'Mening mashqlarim',
  'dashboard.new': 'Yangi mashq',
  'dashboard.empty.title': 'Hali mashq yo‘q',
  'dashboard.empty.body':
    'Birinchi mashqingizni yarating — bir necha daqiqada tayyor bo‘ladi.',
  'dashboard.empty.cta': 'Birinchi mashqni yaratish',
  'dashboard.error.title': 'Mashqlarni yuklab bo‘lmadi',
  'dashboard.error.body': 'Ulanishni tekshiring va qayta urinib ko‘ring.',
} as const

export type TKey = keyof typeof uz

const ru: Record<TKey, string> = {
  'app.name': 'Darsly',
  'app.tagline': 'Конструктор интерактивных заданий',

  'common.signIn': 'Войти',
  'common.signOut': 'Выйти',
  'common.retry': 'Повторить',
  'common.loading': 'Загрузка…',
  'common.language': 'Язык',
  'common.dashboard': 'Мои задания',

  'hero.title': 'Введите один раз — получите шесть игр',
  'hero.subtitle':
    'Вы один раз вводите пары слов, вопросы или категории. Они сами превращаются в викторину, сопоставление, карточки и другие интерактивные игры.',
  'hero.ctaPrimary': 'Начать бесплатно',
  'hero.ctaSecondary': 'Открыть библиотеку',

  'how.title': 'Как это работает',
  'how.step1.title': 'Введите материал',
  'how.step1.body':
    'Заполните таблицу или вставьте прямо из Excel. Набирать двадцать строк вручную не нужно.',
  'how.step2.title': 'Выберите игру',
  'how.step2.body':
    'Меняйте игру одним щелчком. Вводить данные заново не придётся никогда.',
  'how.step3.title': 'Поделитесь ссылкой',
  'how.step3.body':
    'Ученики открывают на телефоне. Результаты возвращаются к вам.',

  'games.title': 'Доступные игры',
  'game.quiz': 'Викторина',
  'game.match-up': 'Сопоставление',
  'game.flashcards': 'Карточки',
  'game.matching-pairs': 'Найди пару',
  'game.group-sort': 'Сортировка по группам',
  'game.anagram': 'Анаграмма',

  'footer.builtFor': 'Для учителей Узбекистана',

  'login.title': 'Вход',
  'login.subtitle':
    'Отправим ссылку для входа на вашу почту — пароль не нужен.',
  'login.email': 'Электронная почта',
  'login.emailPlaceholder': 'imya@shkola.uz',
  'login.sendLink': 'Отправить ссылку',
  'login.sending': 'Отправляем…',
  'login.google': 'Продолжить с Google',
  'login.or': 'или',
  'login.sent.title': 'Проверьте почту',
  'login.sent.body':
    'Мы отправили ссылку для входа. Нажмите на неё, чтобы войти.',
  'login.error.invalidEmail': 'Неверный адрес электронной почты.',
  'login.error.sendFailed':
    'Не удалось отправить ссылку. Попробуйте немного позже.',
  'login.error.oauthFailed': 'Не удалось войти через Google.',

  'dashboard.title': 'Мои задания',
  'dashboard.new': 'Новое задание',
  'dashboard.empty.title': 'Заданий пока нет',
  'dashboard.empty.body':
    'Создайте первое задание — это займёт пару минут.',
  'dashboard.empty.cta': 'Создать первое задание',
  'dashboard.error.title': 'Не удалось загрузить задания',
  'dashboard.error.body': 'Проверьте соединение и попробуйте снова.',
}

const dict: Record<Locale, Record<TKey, string>> = { uz, ru }

export function t(key: TKey, locale: Locale = defaultLocale): string {
  return dict[locale][key]
}

/** Bind a locale once, then call `tt('some.key')` inside a component. */
export function translator(locale: Locale) {
  return (key: TKey): string => dict[locale][key]
}

export function isLocale(value: string | undefined): value is Locale {
  return value === 'uz' || value === 'ru'
}

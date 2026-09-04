/**
 * Every user-facing string in the app lives here. No hardcoded text in JSX.
 *
 * `uz` is the source of truth: `ru` is typed as Record<TKey, string>, so
 * TypeScript fails the build the moment a key is added to uz and forgotten in ru.
 *
 * Placeholders are written `{name}` and filled by passing params to `t`.
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
  'common.cancel': 'Bekor qilish',
  'common.back': 'Orqaga',

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
  'dashboard.untitled': 'Nomsiz mashq',
  'dashboard.itemCount': '{n} ta element',
  'dashboard.edit': 'Tahrirlash',
  'dashboard.play': 'O‘ynash',

  'create.title': 'Yangi mashq',
  'create.subtitle':
    'Kontent turini tanlang. Uni keyin mos keladigan istalgan o‘yin bilan o‘ynatasiz.',
  'create.failed': 'Mashq yaratilmadi. Qayta urinib ko‘ring.',
  'schema.pairs.name': 'So‘z juftliklari',
  'schema.pairs.hint':
    'Atama va uning ta’rifi. Moslashtirish, kartochka va anagramma uchun.',
  'schema.mcq.name': 'Test savollari',
  'schema.mcq.hint': 'Savol va javob variantlari. Viktorina uchun.',

  'editor.titleLabel': 'Sarlavha',
  'editor.titlePlaceholder': 'Masalan: 5-sinf ingliz tili, 3-dars',
  'editor.content': 'Kontent',
  'editor.preview': 'Ko‘rinishi',
  'editor.addRow': 'Qator qo‘shish',
  'editor.remove': 'O‘chirish',
  'editor.moveUp': 'Yuqoriga surish',
  'editor.moveDown': 'Pastga surish',
  'editor.bulkPaste': 'Excel’dan joylashtirish',
  'editor.saving': 'Saqlanmoqda…',
  'editor.saved': 'Saqlandi',
  'editor.saveFailed': 'Saqlanmadi — qayta urinilmoqda',
  'editor.play': 'O‘ynash',
  'editor.emptyPreview': 'Ko‘rish uchun kamida bitta qator kiriting.',
  'editor.term': 'Atama',
  'editor.definition': 'Ta’rif',
  'editor.question': 'Savol',
  'editor.option': 'Variant {n}',
  'editor.correctAnswer': 'To‘g‘ri javob',
  'editor.markCorrect': 'To‘g‘ri deb belgilash',
  'editor.addOption': 'Variant qo‘shish',
  'editor.removeOption': 'Variantni o‘chirish',
  'editor.rowLabel': '{n}-qator',
  'editor.notFound': 'Mashq topilmadi',
  'editor.notFoundBody': 'Bu mashq o‘chirilgan yoki sizga tegishli emas.',

  'paste.title': 'Excel’dan joylashtirish',
  'paste.pairsHint':
    'Har qatorda avval atama, keyin ta’rif. Excel’dagi ikkita ustunni nusxalab, shu yerga joylashtiring.',
  'paste.mcqHint':
    'Har qatorda avval savol, keyin to‘g‘ri javob, keyin noto‘g‘ri variantlar.',
  'paste.placeholder': 'Shu yerga joylashtiring…',
  'paste.append': 'Qo‘shish',
  'paste.replace': 'Butunlay almashtirish',
  'paste.summary': '{found} ta qator topildi, {skipped} tasi o‘tkazib yuborildi.',
  'paste.nothing': 'Hech qanday to‘liq qator topilmadi.',

  'play.progress': '{current} / {total}',
  'play.score': 'Ball: {score}',
  'play.correct': 'To‘g‘ri!',
  'play.wrong': 'Noto‘g‘ri',
  'play.next': 'Keyingi',
  'play.check': 'Tekshirish',
  'play.finish': 'Yakunlash',
  'play.restart': 'Qaytadan o‘ynash',
  'play.done.title': 'Tugadi!',
  'play.done.score': '{score} / {max} ball',
  'play.done.time': '{sec} soniyada',
  'play.empty.title': 'Bu mashq hali bo‘sh',
  'play.empty.body': 'Egasi hali kontent qo‘shmagan.',
  'play.invalid.title': 'Kontent o‘qib bo‘lmadi',
  'play.invalid.body': 'Mashq kontenti buzilgan. Egasi uni tahrirlab tuzatishi kerak.',
  'play.notFound.title': 'Mashq topilmadi',
  'play.notFound.body': 'Havola noto‘g‘ri, yoki bu mashq hammaga ochiq emas.',
  'play.chooseGame': 'O‘yinni tanlang',

  'matchup.instruction': 'Ta’rifni to‘g‘ri atama yoniga tashlang.',
  'matchup.dropHere': 'Bu yerga tashlang',
  'matchup.pool': 'Ta’riflar',
  'matchup.remaining': 'Qoldi: {n}',
  'schema.groups.name': 'Kategoriyalar',
  'schema.groups.hint': 'Guruh nomlari va ularga tegishli elementlar. Guruhlarga ajratish uchun.',

  'editor.groupName': 'Guruh nomi',
  'editor.groupItems': 'Elementlar — har qatorda bittadan',
  'editor.addGroup': 'Guruh qo‘shish',
  'editor.groupLabel': '{n}-guruh',
  'paste.groupsHint':
    'Har qatorda avval guruh nomi, keyin unga tegishli elementlar. Bir guruh nomi bir necha marta uchrasa, elementlar birlashtiriladi.',

  'settings.title': 'Sozlamalar',
  'settings.timer': 'Vaqt chegarasi',
  'settings.timerOff': 'Yo‘q',
  'settings.timerValue': '{n} soniya',
  'settings.shuffle': 'Tartibni aralashtirish',
  'settings.showAnswers': 'To‘g‘ri javobni ko‘rsatish',
  'settings.theme': 'Ranglar',
  'theme.default': 'Odatiy',
  'theme.warm': 'Iliq',
  'theme.cool': 'Salqin',

  'play.timeLeft': '{sec} s',
  'play.timeUp': 'Vaqt tugadi',

  'flash.tapToFlip': 'Javobni ko‘rish uchun bosing',
  'flash.knew': 'Bildim',
  'flash.didnt': 'Bilmadim',
  'flash.known': 'Bilganlar: {n}',

  'memory.instruction': 'Ikkita katakchani oching va juftini toping.',
  'memory.found': 'Topilgan juftlar: {found} / {total}',

  'groupsort.instruction': 'Har bir elementni to‘g‘ri guruhga tashlang.',
  'groupsort.pool': 'Elementlar',

  'anagram.instruction': 'Harflarni surib, to‘g‘ri so‘zni yig‘ing.',
  'anagram.hint': 'Yordam: {hint}',
  'anagram.progress': 'So‘z {current} / {total}',
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
  'common.cancel': 'Отмена',
  'common.back': 'Назад',

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
  'dashboard.empty.body': 'Создайте первое задание — это займёт пару минут.',
  'dashboard.empty.cta': 'Создать первое задание',
  'dashboard.error.title': 'Не удалось загрузить задания',
  'dashboard.error.body': 'Проверьте соединение и попробуйте снова.',
  'dashboard.untitled': 'Без названия',
  'dashboard.itemCount': 'Элементов: {n}',
  'dashboard.edit': 'Редактировать',
  'dashboard.play': 'Играть',

  'create.title': 'Новое задание',
  'create.subtitle':
    'Выберите тип материала. Потом сыграете в него любой подходящей игрой.',
  'create.failed': 'Не удалось создать задание. Попробуйте ещё раз.',
  'schema.pairs.name': 'Пары слов',
  'schema.pairs.hint':
    'Термин и его определение. Для сопоставления, карточек и анаграммы.',
  'schema.mcq.name': 'Тестовые вопросы',
  'schema.mcq.hint': 'Вопрос и варианты ответа. Для викторины.',

  'editor.titleLabel': 'Название',
  'editor.titlePlaceholder': 'Например: 5 класс, английский, урок 3',
  'editor.content': 'Материал',
  'editor.preview': 'Предпросмотр',
  'editor.addRow': 'Добавить строку',
  'editor.remove': 'Удалить',
  'editor.moveUp': 'Переместить вверх',
  'editor.moveDown': 'Переместить вниз',
  'editor.bulkPaste': 'Вставить из Excel',
  'editor.saving': 'Сохраняем…',
  'editor.saved': 'Сохранено',
  'editor.saveFailed': 'Не сохранено — повторяем',
  'editor.play': 'Играть',
  'editor.emptyPreview': 'Добавьте хотя бы одну строку, чтобы увидеть игру.',
  'editor.term': 'Термин',
  'editor.definition': 'Определение',
  'editor.question': 'Вопрос',
  'editor.option': 'Вариант {n}',
  'editor.correctAnswer': 'Правильный ответ',
  'editor.markCorrect': 'Отметить правильным',
  'editor.addOption': 'Добавить вариант',
  'editor.removeOption': 'Удалить вариант',
  'editor.rowLabel': 'Строка {n}',
  'editor.notFound': 'Задание не найдено',
  'editor.notFoundBody': 'Оно удалено или принадлежит другому пользователю.',

  'paste.title': 'Вставить из Excel',
  'paste.pairsHint':
    'В каждой строке сначала термин, затем определение. Скопируйте два столбца из Excel и вставьте сюда.',
  'paste.mcqHint':
    'В каждой строке сначала вопрос, затем правильный ответ, затем неправильные варианты.',
  'paste.placeholder': 'Вставьте сюда…',
  'paste.append': 'Добавить',
  'paste.replace': 'Заменить полностью',
  'paste.summary': 'Найдено строк: {found}, пропущено: {skipped}.',
  'paste.nothing': 'Не найдено ни одной полной строки.',

  'play.progress': '{current} / {total}',
  'play.score': 'Очки: {score}',
  'play.correct': 'Правильно!',
  'play.wrong': 'Неправильно',
  'play.next': 'Далее',
  'play.check': 'Проверить',
  'play.finish': 'Завершить',
  'play.restart': 'Играть снова',
  'play.done.title': 'Готово!',
  'play.done.score': '{score} / {max} очков',
  'play.done.time': 'за {sec} секунд',
  'play.empty.title': 'Задание пока пустое',
  'play.empty.body': 'Автор ещё не добавил материал.',
  'play.invalid.title': 'Не удалось прочитать материал',
  'play.invalid.body':
    'Материал повреждён. Автору нужно исправить его в редакторе.',
  'play.notFound.title': 'Задание не найдено',
  'play.notFound.body': 'Ссылка неверна, или задание закрыто для всех.',
  'play.chooseGame': 'Выберите игру',

  'matchup.instruction': 'Перетащите определение к нужному термину.',
  'matchup.dropHere': 'Перетащите сюда',
  'matchup.pool': 'Определения',
  'matchup.remaining': 'Осталось: {n}',
  'schema.groups.name': 'Категории',
  'schema.groups.hint':
    'Названия групп и относящиеся к ним элементы. Для сортировки по группам.',

  'editor.groupName': 'Название группы',
  'editor.groupItems': 'Элементы — по одному в строке',
  'editor.addGroup': 'Добавить группу',
  'editor.groupLabel': 'Группа {n}',
  'paste.groupsHint':
    'В каждой строке сначала название группы, затем её элементы. Если название повторяется, элементы объединяются.',

  'settings.title': 'Настройки',
  'settings.timer': 'Ограничение времени',
  'settings.timerOff': 'Нет',
  'settings.timerValue': '{n} секунд',
  'settings.shuffle': 'Перемешивать порядок',
  'settings.showAnswers': 'Показывать правильный ответ',
  'settings.theme': 'Цвета',
  'theme.default': 'Обычные',
  'theme.warm': 'Тёплые',
  'theme.cool': 'Холодные',

  'play.timeLeft': '{sec} с',
  'play.timeUp': 'Время вышло',

  'flash.tapToFlip': 'Нажмите, чтобы увидеть ответ',
  'flash.knew': 'Знал',
  'flash.didnt': 'Не знал',
  'flash.known': 'Знал: {n}',

  'memory.instruction': 'Открывайте по две карточки и находите пары.',
  'memory.found': 'Найдено пар: {found} / {total}',

  'groupsort.instruction': 'Перетащите каждый элемент в нужную группу.',
  'groupsort.pool': 'Элементы',

  'anagram.instruction': 'Переставьте буквы и соберите слово.',
  'anagram.hint': 'Подсказка: {hint}',
  'anagram.progress': 'Слово {current} / {total}',
}

const dict: Record<Locale, Record<TKey, string>> = { uz, ru }

export type TParams = Record<string, string | number>

function fill(template: string, params?: TParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export function t(key: TKey, locale: Locale = defaultLocale, params?: TParams): string {
  return fill(dict[locale][key], params)
}

/** Bind a locale once, then call `tt('some.key')` inside a component. */
export function translator(locale: Locale) {
  return (key: TKey, params?: TParams): string => fill(dict[locale][key], params)
}

export type Translate = ReturnType<typeof translator>

export function isLocale(value: string | undefined): value is Locale {
  return value === 'uz' || value === 'ru'
}

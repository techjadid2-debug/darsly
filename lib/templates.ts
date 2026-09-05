import type { TKey } from '@/lib/i18n'
import type {
  GroupsContent,
  McqContent,
  PairsContent,
  SchemaType,
  SequenceContent,
} from '@/lib/schemas'

/**
 * Ready-made starter content. Ids are stable strings rather than generated
 * uuids so loading the same template twice yields identical content.
 */

export type Template =
  | { id: string; nameKey: TKey; schemaType: 'pairs'; content: PairsContent }
  | { id: string; nameKey: TKey; schemaType: 'mcq'; content: McqContent }
  | { id: string; nameKey: TKey; schemaType: 'groups'; content: GroupsContent }
  | { id: string; nameKey: TKey; schemaType: 'sequence'; content: SequenceContent }

const pairs = (id: string, rows: ReadonlyArray<[string, string]>): PairsContent => ({
  items: rows.map(([term, definition], index) => ({
    id: `${id}-${index}`,
    term,
    definition,
  })),
})

export const templates: readonly Template[] = [
  {
    id: 'en-basics',
    nameKey: 'template.en-basics',
    schemaType: 'pairs',
    content: pairs('en', [
      ['olma', 'apple'],
      ['kitob', 'book'],
      ['suv', 'water'],
      ['non', 'bread'],
      ['maktab', 'school'],
      ['o‘qituvchi', 'teacher'],
      ['do‘st', 'friend'],
      ['oila', 'family'],
      ['shahar', 'city'],
      ['kun', 'day'],
    ]),
  },
  {
    id: 'geometry',
    nameKey: 'template.geometry',
    schemaType: 'pairs',
    content: pairs('geo', [
      ['uchburchak', 'uchta tomoni va uchta burchagi bo‘lgan shakl'],
      ['kvadrat', 'to‘rt tomoni teng bo‘lgan to‘rtburchak'],
      ['aylana', 'markazdan bir xil uzoqlikdagi nuqtalar to‘plami'],
      ['radius', 'markazdan aylanagacha bo‘lgan masofa'],
      ['diametr', 'markazdan o‘tuvchi eng uzun vatar'],
      ['perimetr', 'shakl tomonlari uzunliklarining yig‘indisi'],
      ['yuza', 'shakl egallagan sathning o‘lchami'],
    ]),
  },
  {
    id: 'cell',
    nameKey: 'template.cell',
    schemaType: 'pairs',
    content: pairs('cell', [
      ['yadro', 'hujayraning irsiy axborotini saqlaydi'],
      ['mitoxondriya', 'hujayrani energiya bilan ta’minlaydi'],
      ['xloroplast', 'fotosintez sodir bo‘ladigan organoid'],
      ['ribosoma', 'oqsil sintezini amalga oshiradi'],
      ['sitoplazma', 'organoidlar joylashgan suyuq muhit'],
      ['vakuola', 'suv va oziq moddalarni saqlaydi'],
    ]),
  },
  {
    id: 'food-groups',
    nameKey: 'template.food-groups',
    schemaType: 'groups',
    content: {
      groups: [
        { name: 'Mevalar', items: ['olma', 'anor', 'uzum', 'o‘rik', 'shaftoli'] },
        {
          name: 'Sabzavotlar',
          items: ['sabzi', 'piyoz', 'kartoshka', 'bodring', 'pomidor'],
        },
        { name: 'Donli ekinlar', items: ['bug‘doy', 'guruch', 'arpa', 'makkajo‘xori'] },
      ],
    },
  },
  {
    id: 'math-quiz',
    nameKey: 'template.math-quiz',
    schemaType: 'mcq',
    content: {
      items: [
        {
          id: 'm-0',
          question: '7 × 8 = ?',
          options: ['56', '54', '48', '63'],
          correct_index: 0,
        },
        {
          id: 'm-1',
          question: '144 sonining kvadrat ildizi nechaga teng?',
          options: ['12', '14', '16', '24'],
          correct_index: 0,
        },
        {
          id: 'm-2',
          question: '3/4 kasri necha foizga teng?',
          options: ['75%', '60%', '70%', '80%'],
          correct_index: 0,
        },
        {
          id: 'm-3',
          question: '15 sonining 20% i nechaga teng?',
          options: ['3', '5', '2,5', '4'],
          correct_index: 0,
        },
        {
          id: 'm-4',
          question: 'Uchburchak ichki burchaklari yig‘indisi nechaga teng?',
          options: ['180°', '90°', '270°', '360°'],
          correct_index: 0,
        },
      ],
    },
  },
  {
    id: 'water',
    nameKey: 'template.water',
    schemaType: 'sequence',
    content: {
      items: [
        { id: 'w-0', text: 'Suv 100 gradusda qaynaydi', blanks: [1] },
        { id: 'w-1', text: 'Suv 0 gradusda muzlaydi', blanks: [1] },
        { id: 'w-2', text: 'Yomg‘ir bulutdan yerga tushadi', blanks: [1] },
        { id: 'w-3', text: 'Quyosh nuri suvni bug‘ga aylantiradi', blanks: [3] },
        { id: 'w-4', text: 'Daryolar suvni dengizga olib boradi', blanks: [2] },
      ],
    },
  },
]

export function templatesFor(schemaType: SchemaType): Template[] {
  return templates.filter((template) => template.schemaType === schemaType)
}

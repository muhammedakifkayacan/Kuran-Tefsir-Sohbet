import { TajweedRule } from '../types';

export const TAJWEED_RULES: TajweedRule[] = [
  {
    id: 'med',
    title: 'Med Kuralları (Uzatma)',
    category: 'Med',
    description: 'Harfi uzatarak okuma kuralıdır. Asli Med (1 elif) ve Fer’i Med (Med-di Muttasıl, Munfasıl, Lâzım, Ârız, Lîn) olmak üzere ayrılır.',
    colorClass: 'bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700',
    examples: [
      {
        arabic: 'جَآءَ',
        transliteration: 'Jâ’e',
        explanation: 'Med-di Muttasıl: Med harfi ile hemze aynı kelimede gelmiştir (4 elif uzatılır).'
      },
      {
        arabic: 'فِىٓ أَيَّامٍ',
        transliteration: 'Fî eyyâm',
        explanation: 'Med-di Munfasıl: Med harfi bir kelimede, hemze ayrı kelimede gelmiştir (2-4 elif uzatılır).'
      },
      {
        arabic: 'ٱلضَّآلِّينَ',
        transliteration: 'Ed-Dâllîn',
        explanation: 'Med-di Lâzım: Med harfinden sonra sükûn-u lâzım (şedde veya cezm) gelmiştir (4 elif vaciptir).'
      }
    ]
  },
  {
    id: 'ixfa',
    title: 'İxfâ (Gizleme & Hışım)',
    category: 'Sakin Nun & Tenvin',
    description: 'Sakin nun veya tenvinden sonra 15 İxfâ harfinden biri geldiğinde (ت ث ج د ذ ز س ش ص ض ط ظ ف ق ك), ses genize (burun boşluğuna) verilerek gizlenip 1.5 elif miktarı tutularak okunur.',
    colorClass: 'bg-teal-500/10 text-teal-600 border-teal-300 dark:border-teal-700',
    examples: [
      {
        arabic: 'مِن قَبْلِ',
        transliteration: 'Min kabil',
        explanation: 'Sakin nun dan sonra Kaf harfi geldiği için genizden hışım sesiyle okunur.'
      },
      {
        arabic: 'عَن صَلَاتِهِمْ',
        transliteration: '‘An salâtihim',
        explanation: 'Sakin nun dan sonra Sad harfi geldiği için tutarak gizlenir.'
      }
    ]
  },
  {
    id: 'izhar',
    title: 'İzhâr (Açık Okuma)',
    category: 'Sakin Nun & Tenvin',
    description: 'Sakin nun veya tenvinden sonra boğaz harfleri (ء هـ ع ح غ خ) geldiğinde, ses tutulmadan ve gizlenmeden net ve açık olarak okunur.',
    colorClass: 'bg-blue-500/10 text-blue-600 border-blue-300 dark:border-blue-700',
    examples: [
      {
        arabic: 'أَنْعَمْتَ',
        transliteration: 'En‘amte',
        explanation: 'Sakin nun dan sonra Ayn harfi geldiği için nun net okunur.'
      },
      {
        arabic: 'مِنْ حَكِيمٍ',
        transliteration: 'Min hakîm',
        explanation: 'Sakin nun dan sonra Ha harfi geldiği için uzatılmadan direkt okunur.'
      }
    ]
  },
  {
    id: 'idgam',
    title: 'İdgam (Katma & Birleştirme)',
    category: 'Sakin Nun & Tenvin',
    description: 'Sakin nun veya tenvinden sonra ilgili harfler geldiğinde birinci harf ikinciye katılarak okunur.\n• Maal Gunne (ي م ن و): Tutarak ve geniz sesiyle katılır.\n• Bila Gunne (ل ر): Tutmadan direkt katılır.',
    colorClass: 'bg-indigo-500/10 text-indigo-600 border-indigo-300 dark:border-indigo-700',
    examples: [
      {
        arabic: 'مَن يَقُولُ',
        transliteration: 'Mey yakûlu',
        explanation: 'İdgam-ı Maal Gunne: Sakin nun Ye harfine dönüştürülüp tutularak okunur.'
      },
      {
        arabic: 'مِن رَّبِّهِمْ',
        transliteration: 'Mir rabbihim',
        explanation: 'İdgam-ı Bila Gunne: Sakin nun Ra harfine dönüşür, tutulmadan "Mir rabbihim" denir.'
      }
    ]
  },
  {
    id: 'iqlab',
    title: 'İqlâb (Çevirme)',
    category: 'Sakin Nun & Tenvin',
    description: 'Sakin nun veya tenvinden sonra Ba (ب) harfi geldiğinde, sakin nun sese dönüşerek "Mim" (م) gibi okunur ve 1.5 elif tutulur.',
    colorClass: 'bg-rose-500/10 text-rose-600 border-rose-300 dark:border-rose-700',
    examples: [
      {
        arabic: 'مِن بَعْدِ',
        transliteration: 'Mim ba‘di',
        explanation: 'Sakin nun dan sonra Ba geldiği için Mim olarak tutulup söylenir.'
      }
    ]
  },
  {
    id: 'qalqala',
    title: 'Kalkale (Vurgulu Patlatma)',
    category: 'Mahreç & Kuvvet',
    description: 'Kutbu Cedd (ق ط ب ج د) harfleri sakin (cezmli veya durak halinde) olduklarında, mahreçlerinden kuvvetle vurularak patlatılarak okunur.',
    colorClass: 'bg-orange-500/10 text-orange-600 border-orange-300 dark:border-orange-700',
    examples: [
      {
        arabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
        transliteration: 'Ehad',
        explanation: 'Durak halinde Dal harfi vurgulu bir ses patlaması ile durulur.'
      },
      {
        arabic: 'ٱلْفَلَقِ',
        transliteration: 'El-Felak',
        explanation: 'Kaf harfi boğazın üst kısmından patlatılarak söylenir.'
      }
    ]
  }
];

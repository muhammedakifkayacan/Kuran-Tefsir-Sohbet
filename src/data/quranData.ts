import { Surah, Reciter } from '../types';

export const RECITERS: Reciter[] = [
  {
    id: 'mishary',
    name: 'Mişari Râşid el-Afâsî',
    subtext: 'Net, orta hızda tilavet',
    baseUrl: 'https://everyayah.com/data/Alafasy_128kbps/',
  },
  {
    id: 'baset',
    name: 'Abdulbaset Abdussamed',
    subtext: 'Makamlı & Yavaş tilavet',
    baseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps/',
  },
  {
    id: 'maher',
    name: 'Maher Al-Muaiqly',
    subtext: 'Kabe İmamı - Akıcı tilavet',
    baseUrl: 'https://everyayah.com/data/MaherAlMuaiqly128kbps/',
  },
  {
    id: 'sudais',
    name: 'Abdul Rahman Al-Sudais',
    subtext: 'Net ve coşkulu tilavet',
    baseUrl: 'https://everyayah.com/data/Abdurrahmaan_As-Sudais_192kbps/',
  },
];

export const QURAN_SURAHS: Surah[] = [
  {
    id: 1,
    nameArabic: 'الفَاتِحَة',
    nameTurkish: 'Fâtiha Sûresi',
    nameEnglish: 'Al-Fatiha',
    versesCount: 7,
    revelationType: 'Mekke',
    juzNumber: 1,
    startPage: 1,
    verses: [
      {
        number: 1,
        arabic: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        transliteration: 'Bismillâhir-rahmânir-rahîm.',
        translation: 'Rahmân ve Rahîm olan Allah’ın adıyla.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
        juz: 1,
        page: 1,
        tajweedMarkup: {
          text: 'بِسْمِ ٱللَّهِ <span class="text-amber-600 font-bold">ٱلرَّحْمَٰنِ</span> <span class="text-emerald-600 font-bold">ٱلرَّحِيمِ</span>',
          rules: [
            { word: 'ٱلرَّحْمَٰنِ', rule: 'med', note: 'Med-di Tabii (1 elif miktarı uzatılır)' },
            { word: 'ٱلرَّحِيمِ', rule: 'med', note: 'Med-di Ârız (Durdulduğunda 2-4 elif uzatılır)' }
          ]
        }
      },
      {
        number: 2,
        arabic: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَالَمِينَ',
        transliteration: 'Elhamdu lillâhi rabbil-‘âlemîn.',
        translation: 'Hamd, âlemlerin Rabbi olan Allah’a mahsustur.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001002.mp3',
        juz: 1,
        page: 1,
        tajweedMarkup: {
          text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ <span class="text-amber-600 font-bold">ٱلْعَالَمِينَ</span>',
          rules: [
            { word: 'ٱلْعَالَمِينَ', rule: 'med', note: 'Med-di Ârız ve Med-di Tabii' }
          ]
        }
      },
      {
        number: 3,
        arabic: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
        transliteration: 'Er-rahmânir-rahîm.',
        translation: 'O, Rahmân’dır, Rahîm’dir.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001003.mp3',
        juz: 1,
        page: 1,
        tajweedMarkup: {
          text: '<span class="text-amber-600 font-bold">ٱلرَّحْمَٰنِ</span> <span class="text-emerald-600 font-bold">ٱلرَّحِيمِ</span>',
          rules: [
            { word: 'ٱلرَّحِيمِ', rule: 'med', note: 'Med-di Ârız' }
          ]
        }
      },
      {
        number: 4,
        arabic: 'مَٰلِكِ يَوْمِ ٱلدِّينِ',
        transliteration: 'Mâliki yevmid-dîn.',
        translation: 'Din (hesap ve ceza) gününün mâlikidir.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001004.mp3',
        juz: 1,
        page: 1,
        tajweedMarkup: {
          text: '<span class="text-amber-600 font-bold">مَٰلِكِ</span> يَوْمِ <span class="text-emerald-600 font-bold">ٱلدِّينِ</span>',
          rules: [
            { word: 'مَٰلِكِ', rule: 'med', note: 'Med-di Tabii' },
            { word: 'ٱلدِّينِ', rule: 'med', note: 'Med-di Ârız' }
          ]
        }
      },
      {
        number: 5,
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        transliteration: 'İyyâke na‘budu ve iyyâke neste‘în.',
        translation: 'Yalnız sana kulluk eder ve yalnız senden yardım dileriz.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001005.mp3',
        juz: 1,
        page: 1,
        tajweedMarkup: {
          text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ <span class="text-emerald-600 font-bold">نَسْتَعِينُ</span>',
          rules: [
            { word: 'نَسْتَعِينُ', rule: 'med', note: 'Med-di Ârız' }
          ]
        }
      },
      {
        number: 6,
        arabic: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ',
        transliteration: 'İhdines-sirâtal-mustakîm.',
        translation: 'Bizi dosdoğru yola ilet.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001006.mp3',
        juz: 1,
        page: 1,
        tajweedMarkup: {
          text: 'ٱهْدِنَا <span class="text-amber-600 font-bold">ٱلصِّرَٰطَ</span> <span class="text-emerald-600 font-bold">ٱلْمُسْتَقِيمَ</span>',
          rules: [
            { word: 'ٱلصِّرَٰطَ', rule: 'med', note: 'Med-di Tabii, Sad harfi kalın okunur' },
            { word: 'ٱلْمُسْتَقِيمَ', rule: 'med', note: 'Med-di Ârız, Kaf harfi kalın mahreçli' }
          ]
        }
      },
      {
        number: 7,
        arabic: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ',
        transliteration: 'Sirâtallezîne en‘amte ‘aleyhim gayril-magdûbi ‘aleyhim ve led-dâllîn.',
        translation: 'Nimet verdiğin kimselerin yoluna; gazaba uğramışların ve sapmışların yoluna değil.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/001007.mp3',
        juz: 1,
        page: 1,
        tajweedMarkup: {
          text: 'صِرَٰطَ ٱلَّذِينَ <span class="text-blue-600 font-bold">أَنْعَمْتَ</span> عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا <span class="text-purple-600 font-bold">ٱلضَّآلِّينَ</span>',
          rules: [
            { word: 'أَنْعَمْتَ', rule: 'izhar', note: 'İzhâr-ı Halkî (Sakin nun dan sonra ayn harfi gelmiştir, net okunur)' },
            { word: 'ٱلضَّآلِّينَ', rule: 'med', note: 'Med-di Lâzım (4 elif miktarı zorunlu uzatılır)' }
          ]
        }
      }
    ]
  },
  {
    id: 36,
    nameArabic: 'يس',
    nameTurkish: 'Yâsîn Sûresi',
    nameEnglish: 'Ya-Sin',
    versesCount: 5,
    revelationType: 'Mekke',
    juzNumber: 22,
    startPage: 440,
    verses: [
      {
        number: 1,
        arabic: 'يسٓ',
        transliteration: 'Yâsîn.',
        translation: 'Yâsîn.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/036001.mp3',
        juz: 22,
        page: 440,
        tajweedMarkup: {
          text: '<span class="text-purple-600 font-bold">يسٓ</span>',
          rules: [{ word: 'يسٓ', rule: 'med', note: 'Hurûf-u Mukattaa (Yâ 2 elif, Sîn 4 elif uzatılır)' }]
        }
      },
      {
        number: 2,
        arabic: 'وَٱلْقُرْءَانِ ٱلْحَكِيمِ',
        transliteration: 'Vel-kur’ânil-hakîm.',
        translation: 'Hikmet dolu Kur’an’a andolsun ki,',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/036002.mp3',
        juz: 22,
        page: 440,
        tajweedMarkup: {
          text: 'وَٱلْقُرْءَانِ <span class="text-emerald-600 font-bold">ٱلْحَكِيمِ</span>',
          rules: [{ word: 'ٱلْحَكِيمِ', rule: 'med', note: 'Med-di Ârız' }]
        }
      },
      {
        number: 3,
        arabic: 'إِنَّكَ لَمِنَ ٱلْمُرْسَلِينَ',
        transliteration: 'İnneke leminal-murselîn.',
        translation: 'Şüphesiz sen gönderilmiş peygamberlerdensin.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/036003.mp3',
        juz: 22,
        page: 440,
        tajweedMarkup: {
          text: '<span class="text-rose-600 font-bold">إِنَّكَ</span> لَمِنَ <span class="text-emerald-600 font-bold">ٱلْمُرْسَلِينَ</span>',
          rules: [{ word: 'إِنَّكَ', rule: 'ixfa', note: 'Şeddeli Nun - Gunne (1.5 elif tutulur)' }]
        }
      },
      {
        number: 4,
        arabic: 'عَلَىٰ صِرَٰطٍ مُّسْتَقِيمٍ',
        transliteration: '‘Alâ sirâtim mustakîm.',
        translation: 'Dosdoğru bir yol üzerindesin.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/036004.mp3',
        juz: 22,
        page: 440,
        tajweedMarkup: {
          text: 'عَلَىٰ <span class="text-indigo-600 font-bold">صِرَٰطٍ مُّسْتَقِيمٍ</span>',
          rules: [{ word: 'صِرَٰطٍ مُّسْتَقِيمٍ', rule: 'idgam', note: 'İdgam-ı Maal Gunne (Tenvinden sonra mim gelmiştir, tutarak birleştirilir)' }]
        }
      },
      {
        number: 5,
        arabic: 'تَنزِيلَ ٱلْعَزِيزِ ٱلرَّحِيمِ',
        transliteration: 'Tenzîlel-‘azîzir-rahîm.',
        translation: '(Bu Kur’an) Azîz ve Rahîm olan Allah’ın indirmesidir.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/036005.mp3',
        juz: 22,
        page: 440,
        tajweedMarkup: {
          text: '<span class="text-teal-600 font-bold">تَنزِيلَ</span> ٱلْعَزِيزِ <span class="text-emerald-600 font-bold">ٱلرَّحِيمِ</span>',
          rules: [{ word: 'تَنزِيلَ', rule: 'ixfa', note: 'İxfâ (Sakin nun dan sonra ze gelmiştir, gizleyerek genizden okunur)' }]
        }
      }
    ]
  },
  {
    id: 67,
    nameArabic: 'المُلْك',
    nameTurkish: 'Mülk Sûresi (Tebâreke)',
    nameEnglish: 'Al-Mulk',
    versesCount: 5,
    revelationType: 'Mekke',
    juzNumber: 29,
    startPage: 562,
    verses: [
      {
        number: 1,
        arabic: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَىْءٍ قَدِيرٌ',
        transliteration: 'Tebârekellezî biyadihil-mulku ve huve ‘alâ kulli şey’in kadîr.',
        translation: 'Mülk elinde olan Allah ne yücedir! O, her şeye hakkıyla gücü yetendir.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/067001.mp3',
        juz: 29,
        page: 562,
        tajweedMarkup: {
          text: 'تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ وَهُوَ عَلَىٰ كُلِّ <span class="text-teal-600 font-bold">شَىْءٍ قَدِيرٌ</span>',
          rules: [
            { word: 'شَىْءٍ قَدِيرٌ', rule: 'ixfa', note: 'İxfâ (Tenvinden sonra kaf harfi gelmiştir, hışım sesiyle gizlenir)' },
            { word: 'قَدِيرٌ', rule: 'qalqala', note: 'Durdulduğunda Dal harfi ve Ra inceltilir' }
          ]
        }
      },
      {
        number: 2,
        arabic: 'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ٱلْعَزِيزُ ٱلْغَفُورُ',
        transliteration: 'Ellezî xalakal-mevte vel-hayâte li-yeblevekum eyyukum ahsanu ‘amelâ, ve huvel-‘azîzul-gafûr.',
        translation: 'O ki, hanginizin daha güzel davranışta bulunacağını sınamak için ölümü ve hayatı yarattı. O, Azîz’dir, Gafûr’dur.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/067002.mp3',
        juz: 29,
        page: 562,
        tajweedMarkup: {
          text: 'ٱلَّذِى خَلَقَ ٱلْمَوْتَ وَٱلْحَيَوٰةَ <span class="text-orange-600 font-bold">لِيَبْلُوَكُمْ</span> أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ ٱلْعَزِيزُ <span class="text-emerald-600 font-bold">ٱلْغَفُورُ</span>',
          rules: [{ word: 'لِيَبْلُوَكُمْ', rule: 'qalqala', note: 'Kalkale (Sakin Ba harfi vurularak patlatılır)' }]
        }
      },
      {
        number: 3,
        arabic: 'ٱلَّذِى خَلَقَ سَبْعَ سَمَٰوَٰتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِى خَلْقِ ٱلرَّحْمَٰنِ مِن تَفَٰوُتٍ ۖ فَٱرْجِعِ ٱلْبَصَر هَلْ تَرَىٰ مِن فُطُورٍ',
        transliteration: 'Ellezî xalaka seb‘a semâvâtin tibâkâ, mâ terâ fî xalkir-rahmâni min tefâvut, ferji‘il-basara hel terâ min futûr.',
        translation: 'O, yedi göğü tabaka tabaka yaratandır. Rahmân’ın yaratışında hiçbir düzensizlik göremezsin. Gözünü çevir de bak, bir çatlak görebiliyor musun?',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/067003.mp3',
        juz: 29,
        page: 562,
        tajweedMarkup: {
          text: 'ٱلَّذِى خَلَقَ <span class="text-orange-600 font-bold">سَبْعَ</span> سَمَٰوَٰتٍ <span class="text-teal-600 font-bold">طِبَاقًا ۖ مَّا</span> تَرَىٰ فِى خَلْقِ ٱلرَّحْمَٰنِ <span class="text-teal-600 font-bold">مِن تَفَٰوُتٍ</span>',
          rules: [
            { word: 'سَبْعَ', rule: 'qalqala', note: 'Kalkale (Sakin Ba)' },
            { word: 'طِبَاقًا ۖ مَّا', rule: 'idgam', note: 'İdgam-ı Maal Gunne' },
            { word: 'مِن تَفَٰوُتٍ', rule: 'ixfa', note: 'İxfâ (Sakin nun + Te)' }
          ]
        }
      },
      {
        number: 4,
        arabic: 'ثُمَّ ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ يَنقَلِبْ إِلَيْكَ ٱلْبَصَرُ خَاسِئًا وَهُوَ حَسِيرٌ',
        transliteration: 'Summer-ji‘il-basara kerreteyni yenkalib ileykel-basaru xâsi’ev ve huve hasîr.',
        translation: 'Sonra gözünü tekrar tekrar çevir bak; göz aradığını bulamadan bitkin ve yorgun olarak sana dönecektir.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/067004.mp3',
        juz: 29,
        page: 562,
        tajweedMarkup: {
          text: '<span class="text-rose-600 font-bold">ثُمَّ</span> ٱرْجِعِ ٱلْبَصَرَ كَرَّتَيْنِ <span class="text-teal-600 font-bold">يَنقَلِبْ</span> إِلَيْكَ ٱلْبَصَرُ <span class="text-indigo-600 font-bold">خَاسِئًا وَهُوَ</span> حَسِيرٌ',
          rules: [
            { word: 'ثُمَّ', rule: 'ixfa', note: 'Şeddeli Mim - Gunne' },
            { word: 'يَنقَلِبْ', rule: 'ixfa', note: 'İxfâ ve sonda Kaf/Ba durak harfi' }
          ]
        }
      },
      {
        number: 5,
        arabic: 'وَلَقَدْ زَيَّنَّا ٱلسَّمَآءَ ٱلدُّنْيَا بِمَصَٰبِيحَ وَجَعَلْنَٰهَا رُجُومًا لِّلشَّيَٰطِينِ ۖ وَأَعْتَدْنَا لَهُمْ عَذَابَ ٱلسَّعِيرِ',
        transliteration: 'Ve lekad zeyyennes-semâ’ed-dunyâ bimasâbîha ve je‘alnâhâ rucûmel lis-seyâtîni ve a‘tednâ lehum ‘azâbes-se‘îr.',
        translation: 'Andolsun biz, en yakın göğü kandillerle donattık ve onları şeytanlara atılan mermiler yaptık...',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/067005.mp3',
        juz: 29,
        page: 562,
        tajweedMarkup: {
          text: 'وَلَقَدْ زَيَّنَّا <span class="text-amber-600 font-bold">ٱلسَّمَآءَ</span> ٱلدُّنْيَا بِمَصَٰبِيحَ وَجَعَلْنَٰهَا <span class="text-blue-600 font-bold">رُجُومًا لِّلشَّيَٰطِينِ</span>',
          rules: [
            { word: 'ٱلسَّمَآءَ', rule: 'med', note: 'Med-di Muttasıl (4 elif uzatılır)' },
            { word: 'رُجُومًا لِّلشَّيَٰطِينِ', rule: 'idgam', note: 'İdgam-ı Bila Gunne (Tenvinden sonra Lam gelmiştir, tutmadan katılır)' }
          ]
        }
      }
    ]
  },
  {
    id: 112,
    nameArabic: 'الإِخْلَاص',
    nameTurkish: 'İhlâs Sûresi',
    nameEnglish: 'Al-Ikhlas',
    versesCount: 4,
    revelationType: 'Mekke',
    juzNumber: 30,
    startPage: 604,
    verses: [
      {
        number: 1,
        arabic: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ',
        transliteration: 'Kul huvallâhu ehad.',
        translation: 'De ki: O, Allah’tır, bir tektir.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/112001.mp3',
        juz: 30,
        page: 604,
        tajweedMarkup: {
          text: 'قُلْ هُوَ ٱللَّهُ <span class="text-orange-600 font-bold">أَحَدٌ</span>',
          rules: [{ word: 'أَحَدٌ', rule: 'qalqala', note: 'Kalkale (Dal harfi vurgulanır)' }]
        }
      },
      {
        number: 2,
        arabic: 'ٱللَّهُ ٱلصَّمَدُ',
        transliteration: 'Allâhus-samed.',
        translation: 'Allah Samed’dir (Her şey O’na muhtaçtır, O hiçbir şeye muhtaç değildir).',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/112002.mp3',
        juz: 30,
        page: 604,
        tajweedMarkup: {
          text: 'ٱللَّهُ <span class="text-orange-600 font-bold">ٱلصَّمَدُ</span>',
          rules: [{ word: 'ٱلصَّمَدُ', rule: 'qalqala', note: 'Kalkale' }]
        }
      },
      {
        number: 3,
        arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
        transliteration: 'Lem yelid ve lem yûled.',
        translation: 'O, doğurmamış ve doğurulmamıştır.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/112003.mp3',
        juz: 30,
        page: 604,
        tajweedMarkup: {
          text: 'لَمْ <span class="text-orange-600 font-bold">يَلِدْ</span> وَلَمْ <span class="text-orange-600 font-bold">يُولَدْ</span>',
          rules: [{ word: 'يَلِدْ / يُولَدْ', rule: 'qalqala', note: 'İki tane Kalkale (Sakin Dal)' }]
        }
      },
      {
        number: 4,
        arabic: 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌ',
        transliteration: 'Ve lem yekun lehû kufuven ehad.',
        translation: 'Hiçbir şey O’na denk değildir.',
        audioUrl: 'https://everyayah.com/data/Alafasy_128kbps/112004.mp3',
        juz: 30,
        page: 604,
        tajweedMarkup: {
          text: 'وَلَمْ <span class="text-blue-600 font-bold">يَكُن لَّهُۥ</span> كُفُوًا <span class="text-orange-600 font-bold">أَحَدٌ</span>',
          rules: [
            { word: 'يَكُن لَّهُۥ', rule: 'idgam', note: 'İdgam-ı Bila Gunne (Sakin nun + Lam)' },
            { word: 'أَحَدٌ', rule: 'qalqala', note: 'Kalkale' }
          ]
        }
      }
    ]
  }
];

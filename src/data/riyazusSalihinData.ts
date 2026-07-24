export interface RiyazusBook {
  id: number;
  title: string;
  description: string;
  chapterCount: number;
}

export interface RiyazusHadith {
  id: number;
  bookId: number;
  bookTitle: string;
  babNumber: number;
  babName: string; // e.g. "İhlas ve Niyet"
  category: string;
  arabic: string;
  turkish: string;
  ravi: string; // e.g. "Hz. Ömer (r.a.)"
  source: string; // e.g. "Buhârî, İman 41; Müslim, İmâre 155"
  explanation?: string;
}

export const RIYAZUS_SALIHIN_BOOKS: RiyazusBook[] = [
  { id: 1, title: '1. Kitap: Müttakîler ve İhlas (Müddet-i Ömür ve Ahlak)', description: 'Niyet, Tövbe, Sabır, Sıdk, Murakabe, Takva, Yakin ve Tevekkül', chapterCount: 30 },
  { id: 2, title: '2. Kitap: Edep ve Görgü Kuralları (Kitâbü’l-Edeb)', description: 'Haya, Sır Saklama, Sözünde Durma, Güler Yüz, Mütevazılık', chapterCount: 25 },
  { id: 3, title: '3. Kitap: Yeme İçme Âdâbı (Kitâbü’t-Taâm)', description: 'Besmele, Sağ Elle Yemek, Yemeğe Hürmet, Şükür ve İkram', chapterCount: 18 },
  { id: 4, title: '4. Kitap: Giyim Kuşam Âdâbı (Kitâbü’l-Libâs)', description: 'Sade Giyinmek, İsraftan Kaçınmak, Elbise Duaları', chapterCount: 12 },
  { id: 5, title: '5. Kitap: Uyku ve Yatış Âdâbı (Kitâbü’n-Newm)', description: 'Abdestli Yatmak, Sağ Tarafına Yatmak, Uyku Zikirleri', chapterCount: 8 },
  { id: 6, title: '6. Kitap: Selamlaşma Âdâbı (Kitâbü’s-Selâm)', description: 'Selamı Yaymak, İzin İsteyerek Girmek, Tokalaşmak', chapterCount: 15 },
  { id: 7, title: '7. Kitap: Hasta Ziyareti ve Cenaze (Kitâbü’l-Marîz)', description: 'Hastanın Halini Sormak, Şifa Duası, Ölümü Hatırlamak', chapterCount: 22 },
  { id: 8, title: '8. Kitap: Yolculuk Âdâbı (Kitâbü’s-Sefer)', description: 'Perşembe Günü Yola Çıkmak, Ulaşım Aracı Duası, Dönüş', chapterCount: 14 },
  { id: 9, title: '9. Kitap: Faziletler ve İbadetler (Kitâbü’l-Fezâil)', description: 'Kur’an, Abdest, Ezan, Namaz, Cuma, Zekat, Oruç, Hac', chapterCount: 52 },
  { id: 10, title: '10. Kitap: İ’tikâf ve Ramazan (Kitâbü’l-İ’tikâf)', description: 'Ramazan’ın Son On Günü, Kadir Gecesi, Mescide Kapanmak', chapterCount: 6 },
  { id: 11, title: '11. Kitap: Hac ve Umre (Kitâbü’l-Hacc)', description: 'İstitaat, İhram, Kâbe’yi Tavaf, Arafat ve Zikirler', chapterCount: 10 },
  { id: 12, title: '12. Kitap: Cihad ve Ribat (Kitâbü’l-Cihâd)', description: 'Allah Yolunda Mücadele, Şehitlik, Cesaret ve Niyet', chapterCount: 28 },
  { id: 13, title: '13. Kitap: İlim ve Öğretim (Kitâbü’l-İlm)', description: 'İlim Öğrenmenin Fazileti, Âlimlerin Üstünlüğü, İhlas', chapterCount: 10 },
  { id: 14, title: '14. Kitap: Hamd ve Şükür (Kitâbü’l-Hamd)', description: 'Nimete Şükretmek, Elhamdülillah Demek, Rıza Göstermek', chapterCount: 8 },
  { id: 15, title: '15. Kitap: Salavat-ı Şerife (Kitâbü’s-Salât)', description: 'Peygamberimiz’e (s.a.v.) Salavat Getirmenin Mükafatı', chapterCount: 5 },
  { id: 16, title: '16. Kitap: Zikirler ve Evrad (Kitâbü’l-Ezkâr)', description: 'Sabah Akşam Zikirleri, Tesbihat, İstighfar', chapterCount: 20 },
  { id: 17, title: '17. Kitap: Dualar ve Münacatlar (Kitâbü’d-Da’avât)', description: 'Peygamber Efendimiz’in Kapsamlı ve Cevamiu’l-Kelim Duaları', chapterCount: 16 },
  { id: 18, title: '18. Kitap: Yasaklar ve Haramlar (Kitâbü’l-Manhiyyât)', description: 'Gıybet, Yalan, Hased, Kul Hakkı, Zulum ve Kibir', chapterCount: 40 },
];

export const RIYAZUS_SALIHIN_HADITHS: RiyazusHadith[] = [
  // 1. Kitap Hadisleri
  {
    id: 1,
    bookId: 1,
    bookTitle: '1. Kitap: Müttakîler ve İhlas',
    babNumber: 1,
    babName: '1. Bâb: İhlas ve Niyet',
    category: 'İhlas & Niyet',
    arabic: 'إنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    turkish: 'Ameller ancak niyetlere göredir; herkesin niyeti ne ise eline geçecek olan ancak odur. Kimin hicreti Allah ve Resûlü içinse, onun hicreti Allah ve Resûlü’nedir. Kim de elde edeceği bir dünyalık veya evleneceği bir kadın için hicret etmişse, onun hicreti de hicret ettiği şeyedir.',
    ravi: 'Mü’minlerin Emîri Hz. Ömer b. el-Hattâb (r.a.)',
    source: 'Buhârî, İman 41; Müslim, İmâre 155',
    explanation: 'İslam dininin temel direği sayılan bu hadis-i şerif; amellerin kabulünün ve sevabının sırf niyetin ihlasına ve Allah rızasına bağlı olduğunu beyan eder.',
  },
  {
    id: 2,
    bookId: 1,
    bookTitle: '1. Kitap: Müttakîler ve İhlas',
    babNumber: 2,
    babName: '2. Bâb: Tövbe ve İstigfar',
    category: 'Tövbe',
    arabic: 'يَا أَيُّهَا النَّاسُ تُوبُوا إِلَى اللَّهِ وَاسْتَغْفِرُوهُ، فَإِنِّي أَتُوبُ فِي الْيَوْمِ مِائَةَ مَرَّةٍ',
    turkish: 'Ey insanlar! Allah’a tövbe edin ve O’ndan bağışlanma dileyin. Yemin olsun ki ben günde yüz defa tövbe ediyorum.',
    ravi: 'Egar b. Yessâr el-Müzenî (r.a.)',
    source: 'Müslim, Zikir 41',
    explanation: 'Peygamber Efendimiz (s.a.v.) günahsız olduğu halde ümmetine örnek olmak ve dergah-ı ilahiyeye sığınmak için sürekli tövbe ederdi.',
  },
  {
    id: 3,
    bookId: 1,
    bookTitle: '1. Kitap: Müttakîler ve İhlas',
    babNumber: 3,
    babName: '3. Bâb: Sabır ve Metanet',
    category: 'Sabır & Şükür',
    arabic: 'عَجَبًا لأَمْرِ الْمُؤْمِنِ، إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ، وَلَيْسَ ذَاكَ لأَحَدٍ إِلاَّ لِلْمُؤْمِنِ',
    turkish: 'Mü’minin durumu ne hoştur! Her hâli kendisi için hayırdır. Bu durum yalnız mü’mine hastır: Sevindirici bir şeyle karşılaşsa şükreder, bu onun için hayır olur. Bir zarar veya sıkıntıya uğrasa sabreder, bu da onun için hayır olur.',
    ravi: 'Suheyb b. Sinân (r.a.)',
    source: 'Müslim, Zühd 64',
    explanation: 'Mü’min insan şükür ve sabır kanatlarıyla her an kazançlıdır. Nimet de musibet de onun için cennet vesilesine dönüşür.',
  },
  {
    id: 4,
    bookId: 1,
    bookTitle: '1. Kitap: Müttakîler ve İhlas',
    babNumber: 4,
    babName: '4. Bâb: Doğruluk (Sıdk)',
    category: 'Doğruluk (Sıdk)',
    arabic: 'عَلَيْكُمْ بِالصِّدْقِ، فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ',
    turkish: 'Doğruluktan ayrılmayınız. Çünkü doğruluk insanı iyiliğe (birr), iyilik de cennete götürür. İnsan doğrulukta sebat eder ve doğruyu ararsa Allah katında doğrulardan (sıddîk) yazılır.',
    ravi: 'Abdullah b. Mes’ûd (r.a.)',
    source: 'Buhârî, Edeb 69; Müslim, Birr 105',
    explanation: 'Sıdk, kalbin ve dilin bir olmasıdır. Mü’minin şiarı yalan söylememek ve sadık dostlar edinmektir.',
  },
  {
    id: 5,
    bookId: 1,
    bookTitle: '1. Kitap: Müttakîler ve İhlas',
    babNumber: 5,
    babName: '5. Bâb: Murakabe (Allah’ı Her An Yanında Bilmek)',
    category: 'İhlas & Niyet',
    arabic: 'اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ، وَأَتْبِعِ السَّيِّئَةَ الْحَسَنَةَ تَمْحُهَا، وَخَالِقِ النَّاسَ بِخُلُقٍ حَسَنٍ',
    turkish: 'Nerede olursan ol Allah’a karşı gelmekten sakın! Yaptığın bir kötülüğün ardından hemen bir iyilik yap ki onu silsin. İnsanlarla da güzel geçin, onlara güzel ahlakla muamele et.',
    ravi: 'Ebu Zerr b. Cünâde ve Muâz b. Cebel (r.a.)',
    source: 'Tirmizî, Birr 55',
    explanation: 'Gizlide ve açıkta takva sahibi olmak, günah işlendiğinde hemen hasenat ile telafi etmek İslam ahlakının özüdür.',
  },
  {
    id: 6,
    bookId: 1,
    bookTitle: '1. Kitap: Müttakîler ve İhlas',
    babNumber: 6,
    babName: '6. Bâb: Tevekkül ve Yakin',
    category: 'Sabır & Şükür',
    arabic: 'لَوْ أَنَّكُمْ تَتَوَكَّلُونَ عَلَى اللَّهِ حَقَّ تَوَكُّلِهِ لَرَزَقَكُمْ كَمَا يَرْزُقُ الطَّيْرَ',
    turkish: 'Eğer siz Allah’a gereği gibi tevekkül etseydiniz, sabahleyin karınları aç çıkıp akşamleyin tok olarak yuvalarına dönen kuşları rızıklandırdığı gibi sizi de rızıklandırırdı.',
    ravi: 'Hz. Ömer b. el-Hattâb (r.a.)',
    source: 'Tirmizî, Zühd 33; İbn Mâce, Zühd 14',
    explanation: 'Tevekkül tembellik etmek değil, sebeplere sarıldıktan sonra neticeyi Yüce Allah’a bırakıp huzur bulmaktır.',
  },

  // 2. Kitap Hadisleri
  {
    id: 7,
    bookId: 2,
    bookTitle: '2. Kitap: Edep ve Görgü Kuralları',
    babNumber: 1,
    babName: '7. Bâb: Haya ve Edep',
    category: 'Ahlak & Edep',
    arabic: 'الْحَيَاءُ لاَ يَأْتِي إِلاَّ بِخَيْرٍ',
    turkish: 'Haya ancak hayır getirir. Haya imandandır, iman ise cennettedir.',
    ravi: 'İmrân b. Husayn (r.a.)',
    source: 'Buhârî, Edeb 77; Müslim, İman 60',
    explanation: 'Haya, ruhun çirkin şeylerden sakınması ve Allah’ın huzurunda mahcup olmaktan korkmasıdır.',
  },
  {
    id: 8,
    bookId: 2,
    bookTitle: '2. Kitap: Edep ve Görgü Kuralları',
    babNumber: 2,
    babName: '8. Bâb: Mütevazılık ve Alçak Gönüllülük',
    category: 'Ahlak & Edep',
    arabic: 'وَمَا تَوَاضَعَ أَحَدٌ لِلَّهِ إِلاَّ رَفَعَهُ اللَّهُ',
    turkish: 'Allah için mütevazı olan hiç kimse yoktur ki, Allah onu yüceltmiş olmasın.',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Müslim, Birr 69; Tirmizî, Birr 82',
    explanation: 'Kibir insanı alçaltır, tevazu ise insanı dergah-ı ilahide ve insanların gönlünde aziz kılar.',
  },

  // 3. Kitap Hadisleri
  {
    id: 9,
    bookId: 3,
    bookTitle: '3. Kitap: Yeme İçme Âdâbı',
    babNumber: 1,
    babName: '9. Bâb: Yemeğe Besmele ile Başlamak',
    category: 'Ahlak & Edep',
    arabic: 'سَمِّ اللَّهَ وَكُلْ بِيَمِينِكَ وَكُلْ مِمَّا يَلِيكَ',
    turkish: 'Allah’ın adını an (Besmele çek), sağ elinle ye ve önünden ye!',
    ravi: 'Ömer b. Ebi Seleme (r.a.)',
    source: 'Buhârî, Et’ime 2; Müslim, Eşribe 108',
    explanation: 'Sofra edebi insana şükrü öğretir, yemeği bereketlendirir ve şeytanın şerik olmasını engeller.',
  },

  // 6. Kitap Hadisleri
  {
    id: 10,
    bookId: 6,
    bookTitle: '6. Kitap: Selamlaşma Âdâbı',
    babNumber: 1,
    babName: '10. Bâb: Selamı Yaymak',
    category: 'Merhamet & Kardeşlik',
    arabic: 'لاَ تَدْخُلُونَ الْجَنَّةَ حَتَّى تُؤْمِنُوا وَلاَ تُؤْمِنُوا حَتَّى تَحَابُّوا أَوْلاَ أَدُلُّكُمْ عَلَى شَيْءٍ إِذَا فَعَلْتُمُوهُ تَحَابَبْتُمْ أَفْشُوا السَّلاَمَ بَيْنَكُمْ',
    turkish: 'İman etmedikçe cennete giremezsiniz; birbirinizi sevmedikçe de tam iman etmiş olamazsınız. Yaptığınız takdirde birbirinizi seveceğiniz bir şeyi size haber vereyim mi? Aranızda selamı yayınız!',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Müslim, İman 93; Tirmizî, İsti’zân 1',
    explanation: 'Selam, Müslümanların emniyet ve sevgi parolasıdır. Kalpleri yumuşatır, muhabbeti artırır.',
  },

  // 9. Kitap Hadisleri (Fezâil)
  {
    id: 11,
    bookId: 9,
    bookTitle: '9. Kitap: Faziletler ve İbadetler',
    babNumber: 1,
    babName: '11. Bâb: Kur’an Öğrenmek ve Öğretmek',
    category: 'Namaz & İbadet',
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    turkish: 'Sizin en hayırlınız Kur’an’ı öğrenen ve öğreteninizdir.',
    ravi: 'Hz. Osman b. Affân (r.a.)',
    source: 'Buhârî, Fezâilü’l-Kur’ân 21',
    explanation: 'Kur’an-ı Kerim ile hemhal olmak mü’minin en şerefli meşguliyetidir.',
  },
  {
    id: 12,
    bookId: 9,
    bookTitle: '9. Kitap: Faziletler ve İbadetler',
    babNumber: 2,
    babName: '12. Bâb: Beş Vakit Namazın Fazileti',
    category: 'Namaz & İbadet',
    arabic: 'أَرَأَيْتُمْ لَوْ أَنَّ نَهَرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ فِيهِ كُلَّ يَوْمٍ خَمْسًا، مَا تَقُولُ ذَلِكَ يُبْقِي مِنْ دَرَنِهِ؟',
    turkish: 'Sizden birinizin kapısı önünden bir nehir aksa ve o kimsede bu nehirde günde beş defa yıkansa, üzerinde hiç kir kalır mı? İşte beş vakit namaz da böyledir; Allah onunla günahları silip temizler.',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Buhârî, Mevâkît 6; Müslim, Mesâcid 283',
    explanation: 'Namaz ruhun temizliği, kulun Rabbiyle günde beş vakit buluşup arınmasıdır.',
  },

  // 12. Kitap Hadisleri (Cihad)
  {
    id: 13,
    bookId: 12,
    bookTitle: '12. Kitap: Cihad ve Ribat',
    babNumber: 1,
    babName: '13. Bâb: Cihadın Fazileti',
    category: 'Namaz & İbadet',
    arabic: 'الْجَنَّةُ تَحْتَ ظِلاَلِ السُّيُوفِ',
    turkish: 'Bilesiniz ki cennet kılıçların gölgeleri altındadır.',
    ravi: 'Abdullah b. Ebi Evfâ (r.a.)',
    source: 'Buhârî, Cihâd 22; Müslim, Cihâd 20',
    explanation: 'Hak ve adalet uğrunda, vatan ve namus müdafaasında dik durmak cennet vesilesidir.',
  },

  // 13. Kitap Hadisleri (İlim)
  {
    id: 14,
    bookId: 13,
    bookTitle: '13. Kitap: İlim ve Öğretim',
    babNumber: 1,
    babName: '14. Bâb: İlim Yolculuğu',
    category: 'Ahlak & Edep',
    arabic: 'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ',
    turkish: 'Kim ilim öğrenmek için bir yola girerse, Allah ona cennete giden yolu kolaylaştırır.',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Müslim, Zikir 38; Tirmizî, İlim 2',
    explanation: 'İlim talep etmek her Müslümana farzdır. İlim tahsil eden kimseye melekler kanatlarını serer.',
  },

  // 15. Kitap Hadisleri (Salavat)
  {
    id: 15,
    bookId: 15,
    bookTitle: '15. Kitap: Salavat-ı Şerife',
    babNumber: 1,
    babName: '15. Bâb: Salavat Getirmenin Fazileti',
    category: 'Namaz & İbadet',
    arabic: 'مَنْ صَلَّى عَلَيَّ وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا',
    turkish: 'Kim bana bir defa salâtüselâm getirirse, Allah ona karşılık ten defa rahmet eder.',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Müslim, Salât 70; Tirmizî, Vitir 21',
    explanation: 'Peygamberimiz’e salavat getirmek duaların kabulüne, günahların bağışlanmasına ve ilahi rahmete vesiledir.',
  },

  // 16. Kitap Hadisleri (Zikir)
  {
    id: 16,
    bookId: 16,
    bookTitle: '16. Kitap: Zikirler ve Evrad',
    babNumber: 1,
    babName: '16. Bâb: Dilde Hafif Mizan’da Ağır Zikirler',
    category: 'Namaz & İbadet',
    arabic: 'كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ ثَقِيلَتَانِ فِي الْمِيزَانِ حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ',
    turkish: 'Dile hafif, mizanda ağır, Rahmân olan Allah’a sevgili iki kelime vardır: Subhânallâhi ve bihamdihî, Subhânallâhi’l-Azîm (Allah’ı noksan sıfatlardan tenzih eder ve O’na hamdederim. Yüce Allah’ı tenzih ederim).',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Buhârî, Da’avât 65; Müslim, Zikir 31',
    explanation: 'Riyazü’s-Sâlihîn kitabının son hadis-i şerifidir. Az amelle çok mükafat kazandıran zikirlerin en güzel örneğidir.',
  },

  // 18. Kitap Hadisleri (Yasaklar)
  {
    id: 17,
    bookId: 18,
    bookTitle: '18. Kitap: Yasaklar ve Haramlar',
    babNumber: 1,
    babName: '17. Bâb: Gıybet ve Dedikodu Yasağı',
    category: 'Ahlak & Edep',
    arabic: 'أَتَدْرُونَ مَا الْغِيبَةُ؟ قَالُوا: اللَّهُ وَرَسُولُهُ أَعْلَمُ. قَالَ: ذِكْرُكَ أَخَاكَ بِمَا يَكْرَهُ',
    turkish: 'Gıybetin ne olduğunu bilir misiniz? Ashab: "Allah ve Resûlü daha iyi bilir" dediler. Peygamberimiz: "Kardeşini hoşlanmadığı bir şeyle anmandır" buyurdu. "Ya dediğim şey onda varsa?" denilince: "Eğer dediğin şey onda varsa gıybet etmiş olursun; yoksa ona iftira etmiş olursun!" buyurdu.',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Müslim, Birr 70; Tirmizî, Birr 51',
    explanation: 'Dilin afetlerinden korumak kul hakkına riayettir. Müslüman, başkasının ayıp ve kusurunu örter.',
  },
];

export interface RiyazusHadith {
  id: number;
  babName: string; // Chapter name e.g. "İhlas ve Niyet Niyeti Halis Kılmak"
  category: 'İhlas & Niyet' | 'Sabır & Şükür' | 'Doğruluk (Sıdk)' | 'Ahlak & Edep' | 'Namaz & İbadet' | 'Merhamet & Kardeşlik' | 'Cömertlik & İnfak';
  arabic: string;
  turkish: string;
  ravi: string; // e.g. "Hz. Ömer radıyallahu anh"
  source: string; // e.g. "Buhârî, Bed'ü'l-Vahy 1; Müslim, İmâre 155"
  explanation?: string;
}

export const RIYAZUS_SALIHIN_HADITHS: RiyazusHadith[] = [
  {
    id: 1,
    babName: '1. Bâb: İhlas ve Niyet',
    category: 'İhlas & Niyet',
    arabic: 'إنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    turkish: 'Ameller ancak niyetlere göredir; herkesin niyeti ne ise eline geçecek olan ancak odur. Kimin hicreti Allah ve Resûlü içinse, onun hicreti Allah ve Resûlü’nedir. Kim de elde edeceği bir dünyalık veya evleneceği bir kadın için hicret etmişse, onun hicreti de hicret ettiği şeyedir.',
    ravi: 'Mü’minlerin Emîri Ebe Hafs Ömer ibnü’l-Hattâb (r.a.)',
    source: 'Buhârî, İman 41; Müslim, İmâre 155',
    explanation: 'İslam dininin temel direği sayılan bu hadis-i şerif; amellerin kabulünün ve sevabının sırf niyetin ihlasına ve Allah rızasına bağlı olduğunu beyan eder.',
  },
  {
    id: 2,
    babName: '2. Bâb: Sabır ve Metanet',
    category: 'Sabır & Şükür',
    arabic: 'عَجَبًا لأَمْرِ الْمُؤْمِنِ، إِنَّ أَمْرَهُ كُلَّهُ خَيْرٌ، وَلَيْسَ ذَاكَ لأَحَدٍ إِلاَّ لِلْمُؤْمِنِ',
    turkish: 'Mü’minin durumu ne hoştur! Her hâli kendisi için hayırdır. Bu durum yalnız mü’mine hastır: Sevindirici bir şeyle karşılaşsa şükreder, bu onun için hayır olur. Bir zarar veya sıkıntıya uğrasa sabreder, bu da onun için hayır olur.',
    ravi: 'Suheyb b. Sinân (r.a.)',
    source: 'Müslim, Zühd 64',
    explanation: 'Mü’min insan şükür ve sabır kanatlarıyla her an kazançlıdır. Nimet de musibet de onun için cennet vesilesine dönüşür.',
  },
  {
    id: 3,
    babName: '3. Bâb: Doğruluk (Sıdk)',
    category: 'Doğruluk (Sıdk)',
    arabic: 'عَلَيْكُمْ بِالصِّدْقِ، فَإِنَّ الصِّدْقَ يَهْدِي إِلَى الْبِرِّ، وَإِنَّ الْبِرَّ يَهْدِي إِلَى الْجَنَّةِ',
    turkish: 'Doğruluktan ayrılmayınız. Çünkü doğruluk insanı iyiliğe (birr), iyilik de cennete götürür. İnsan doğrulukta sebat eder ve doğruyu ararsa Allah katında doğrulardan (sıddîk) yazılır.',
    ravi: 'Abdullah b. Mes’ûd (r.a.)',
    source: 'Buhârî, Edeb 69; Müslim, Birr 105',
    explanation: 'Sıdk, kalbin ve dilin bir olmasıdır. Mü’minin şiarı yalan söylememek ve sadık dostlar edinmektir.',
  },
  {
    id: 4,
    babName: '4. Bâb: Güzel Ahlak ve Edep',
    category: 'Ahlak & Edep',
    arabic: 'إِنَّ مِنْ خِيَارِكُمْ أَحْسَنَكُمْ أَخْلاَقًا',
    turkish: 'Sizin en hayırlınız, ahlakça en güzel olanınızdır.',
    ravi: 'Abdullah b. Amr b. el-Âs (r.a.)',
    source: 'Buhârî, Menâkıb 23; Müslim, Fezâil 68',
    explanation: 'Ahlak, imanın olgunluk tezahürüdür. Peygamber Efendimiz (s.a.v.) güzel ahlakı tamamlamak üzere gönderilmiştir.',
  },
  {
    id: 5,
    babName: '5. Bâb: Namaz ve Göz Nuru İbadetler',
    category: 'Namaz & İbadet',
    arabic: 'أَرَأَيْتُمْ لَوْ أَنَّ نَهَرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ فِيهِ كُلَّ يَوْمٍ خَمْسًا، مَا تَقُولُ ذَلِكَ يُبْقِي مِنْ دَرَنِهِ؟',
    turkish: 'Sizden birinizin kapısı önünden bir nehir aksa ve o kimsede bu nehirde günde beş defa yıkansa, üzerinde hiç kir kalır mı? İşte beş vakit namaz da böyledir; Allah onunla günahları silip temizler.',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Buhârî, Mevâkît 6; Müslim, Mesâcid 283',
    explanation: 'Namaz ruhun temizliği, kulun Rabbiyle günde beş vakit buluşup arınmasıdır.',
  },
  {
    id: 6,
    babName: '6. Bâb: Merhamet ve Müslüman Kardeşliği',
    category: 'Merhamet & Kardeşlik',
    arabic: 'مَثَلُ الْمُؤْمِنِينَ فِي تَوَادِّهِمْ وَتَرَاحُمِهِمْ وَتَعَاطُفِهِمْ مَثَلُ الْجَسَدِ',
    turkish: 'Mü’minler birbirlerini sevmede, birbirlerine merhamet etmede ve şefkat göstermede bir beden gibidir. Bedenin bir organı rahatsızlansa, diğer organlar da uykusuzluk ve yüksek ateşle ona katılır.',
    ravi: 'Nu’mân b. Beşîr (r.a.)',
    source: 'Buhârî, Edeb 27; Müslim, Birr 66',
    explanation: 'İslam toplumu tek vücuttur. Bir Müslümanın dertlenmesi, diğer Müslümanların da uykusunu kaçırmalıdır.',
  },
  {
    id: 7,
    babName: '7. Bâb: Cömertlik ve Allah Yolunda İnfak',
    category: 'Cömertlik & İnfak',
    arabic: 'مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ',
    turkish: 'Sadaka vermek maldan hiçbir şey eksiltmez. Allah, af ve bağışlamasından ötürü kulunun ancak izzetini artırır. Allah için mütevazı olanı da Allah yüceltir.',
    ravi: 'Ebu Hüreyrە (r.a.)',
    source: 'Müslim, Birr 69; Tirmizî, Birr 82',
    explanation: 'Cömertlik malın bereketidir. Veren el alan elden üstündür ve verilen sadaka Allah katında kat kat çoğaltılır.',
  },
  {
    id: 8,
    babName: '8. Bâb: İlim ve Kur’an Öğrenmek',
    category: 'Ahlak & Edep',
    arabic: 'خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ',
    turkish: 'Sizin en hayırlınız Kur’an’ı öğrenen ve öğreteninizdir.',
    ravi: 'Osman b. Affân (r.a.)',
    source: 'Buhârî, Fezâilü’l-Kur’ân 21; Tirmizî, Fezâilü’l-Kur’ân 15',
    explanation: 'Kur’an-ı Kerim ile meşgul olmak, onun tilavetini, tefsirini ve ahkamını yaşayıp aktarmak şereflerin en büyüğüdür.',
  },
];

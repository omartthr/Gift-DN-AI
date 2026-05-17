// Gift DN-AI — Quiz bank, gift catalog, community feed

export const TONE_BG: Record<string, string> = {
  sage: "#A8B391",
  rose: "#E0B0A4",
  clay: "#C99877",
  sky: "#A8B5C2",
  cream: "#E8DDC2",
  coral: "#E48262",
};

export type QuizQuestion = {
  id: string;
  q: string;
  type: "text" | "single" | "multi";
  options: string[];
  reason: string;
};

export const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  tr: [
    { id: "vibe", q: "Hediyeyi alacağın kişinin tarzını üç kelimeyle tarif eder misin?", type: "text", options: ["Minimal & sade", "Renkli & oyuncu", "Klasik & zarif", "Doğal & rahat"], reason: "Estetik tercih, ürün kategorisini ciddi şekilde daraltıyor. Bir hediye 'doğru' hissetsin diye stil eşleşmesi önemli." },
    { id: "occasion", q: "Bu hediye özel bir gün için mi, yoksa 'sebep yok' hediyesi mi?", type: "single", options: ["Doğum günü", "Yıldönümü", "Sebep yok", "Teşekkür", "Yeni başlangıç"], reason: "Bağlam, mesajın tonunu belirliyor. 'Sebep yok' hediyeleri genelde daha kişisel ve küçük; özel günler daha sembolik." },
    { id: "interests", q: "Son zamanlarda neyle vakit geçiriyor?", type: "multi", options: ["Okumak", "Yemek pişirmek", "Spor / dışarısı", "Müzik", "Cilt bakımı", "Bahçecilik", "Yolculuk", "El işi"], reason: "İlgi alanları bütün önerinin temeli. Birden fazla seçim daha iyi bir bağlam haritası çıkarıyor." },
    { id: "have", q: "Daha önce verdiğin ve gerçekten sevilen bir hediye var mı?", type: "text", options: ["El yapımı bir defter", "Konser bileti", "Bir kitap", "Birlikte bir akşam yemeği"], reason: "Geçmiş başarılar 'bu kişiye ne uyar?' sorusunun en güvenilir göstergesi. AI bunu pattern çıkarmak için kullanır." },
    { id: "avoid", q: "Kaçınılması gereken bir şey var mı? (alerji, hassasiyet, sevmediği şey)", type: "text", options: ["Hayır, açığım", "Kokulu ürünler değil", "Mücevher değil", "Yiyecek değil"], reason: "Yanlış hediyeyi elemek, doğru olanı bulmak kadar önemli." },
    { id: "love_lang", q: "Sence onun 'sevgi dili' nedir?", type: "single", options: ["Sözlü ifade", "Birlikte vakit", "Küçük jestler", "Dokunma / yakınlık", "Hediye"], reason: "Bir hediye nasıl 'okunur'? Bunu bilmek ambalajdan içeriğine kadar her şeyi etkiler." },
    { id: "novel", q: "Sürpriz mi, güvenli mi gitmek istersin?", type: "single", options: ["Sürpriz — beni şaşırt", "Biraz cesur ama güvenli", "Bildiği bir şey, daha iyisi"], reason: "Yaratıcılık seviyesi. Bu, önerilerin ne kadar 'risk alacağını' belirliyor." },
  ],
  en: [
    { id: "vibe", q: "Describe their style in three words.", type: "text", options: ["Minimal & quiet", "Colorful & playful", "Classic & elegant", "Natural & easy"], reason: "Aesthetic preference seriously narrows the product category. Style fit makes a gift feel right." },
    { id: "occasion", q: "Is this for a special day, or a 'no reason' gift?", type: "single", options: ["Birthday", "Anniversary", "No reason", "Thank you", "Fresh start"], reason: "Context shapes the message. 'No reason' gifts tend to be small and personal; special days lean symbolic." },
    { id: "interests", q: "What have they been spending time on lately?", type: "multi", options: ["Reading", "Cooking", "Sports / outdoors", "Music", "Skincare", "Gardening", "Travel", "Crafts"], reason: "Interests are the backbone of any recommendation. Multiple picks paint a clearer map." },
    { id: "have", q: "A gift you've given them before that really landed?", type: "text", options: ["A handmade notebook", "Concert tickets", "A book", "Dinner together"], reason: "Past wins are the most reliable signal for what will work again. The AI uses this to extract pattern." },
    { id: "avoid", q: "Anything to avoid? (allergies, dislikes, sensitivities)", type: "text", options: ["No, open to anything", "No fragrances", "No jewelry", "No food"], reason: "Eliminating wrong choices is as important as finding the right one." },
    { id: "love_lang", q: "What do you think their 'love language' is?", type: "single", options: ["Words of affirmation", "Quality time", "Small gestures", "Touch / closeness", "Gifts"], reason: "How a gift gets 'read' shapes everything from wrapping to the gift itself." },
    { id: "novel", q: "Surprise them, or play it safe?", type: "single", options: ["Surprise — surprise me", "A bit bold, still safe", "Something they know, but better"], reason: "How much risk should the suggestions take? This sets the creativity dial." },
  ],
};

export type GiftResult = {
  rank: number;
  name: string;
  query: string;
  tone: string;
  desc: string;
  why: string;
  price: string;
  store: string;
  stock: string;
  link?: string;
  image?: string;
};

export const GIFT_RESULTS: Record<string, GiftResult[]> = {
  tr: [
    { rank: 1, name: "El Yapımı Seramik Çay Seti", query: "el yapımı seramik çay demlik", tone: "sage", desc: "Sade formlu, mat sırlı bir demlik ve iki fincan. Türk üreticisi.", why: "Anketten 'evde sakin ritüeller' temasını çıkardım. Hem doğal hem klasik tonuna uyuyor. El yapımı oluşu, daha önce sevilen 'defter' tarzı kişisel hediyelerle örtüşüyor.", price: "₺ 1.480", store: "İlbey Atölye", stock: "Stokta · 2 adet", link: "https://example.com/tea-set", image: "https://images.unsplash.com/photo-1576092762791-dd9e2220c4c7?auto=format&fit=crop&q=80&w=800" },
    { rank: 2, name: "Yün Battaniye, Doğal Boya", query: "yün battaniye doğal boya", tone: "rose", desc: "Anadolu yünü, kök boya. 130×180 cm.", why: "'Doğal & rahat' tarzıyla doğrudan örtüşüyor. Hediye sebebi 'sebep yok' olduğu için sembolikten çok günlük kullanılır bir şey önerdim.", price: "₺ 2.250", store: "Karya", stock: "Stokta · 4 adet", link: "https://example.com/blanket", image: "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?auto=format&fit=crop&q=80&w=800" },
    { rank: 3, name: "Şiir Antolojisi, Birinci Baskı", query: "ikinci el şiir kitabı", tone: "clay", desc: "1996 baskısı, sertifikalı sahaflıktan.", why: "'Okumak' ilgisi ve 'küçük jestler' sevgi dili bir araya gelince, bir kitap ama özel bir kitap mantıklı geldi. Birinci baskı, hediyenin 'düşünülmüş' olduğunu gösteriyor.", price: "₺ 680", store: "Hazan Sahaf", stock: "Stokta · 1 adet", link: "https://example.com/book", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" },
  ],
  en: [
    { rank: 1, name: "Handmade Ceramic Tea Set", query: "handmade ceramic teapot", tone: "sage", desc: "Matte-glazed pot and two cups with simple form. Made in Türkiye.", why: "The quiz pointed to quiet, at-home rituals. It fits both 'natural' and 'classic' notes. Being handmade echoes the personal vibe of past wins like a handmade notebook.", price: "₺ 1,480", store: "İlbey Atelier", stock: "In stock · 2 left", link: "https://example.com/tea-set", image: "https://images.unsplash.com/photo-1576092762791-dd9e2220c4c7?auto=format&fit=crop&q=80&w=800" },
    { rank: 2, name: "Wool Blanket, Plant-Dyed", query: "wool blanket plant dyed", tone: "rose", desc: "Anatolian wool, madder root dye. 130×180 cm.", why: "Direct fit with 'natural & easy'. Since the occasion is 'no reason', I steered toward an everyday object over something symbolic.", price: "₺ 2,250", store: "Karya", stock: "In stock · 4 left", link: "https://example.com/blanket", image: "https://images.unsplash.com/photo-1580327344181-c1163234e5a0?auto=format&fit=crop&q=80&w=800" },
    { rank: 3, name: "Poetry Anthology, First Edition", query: "first edition poetry book", tone: "clay", desc: "1996 printing, certified rare-books dealer.", why: "'Reading' as an interest plus 'small gestures' as love language makes a book — but a special book — the right move. The first-edition framing signals the gift was thought about.", price: "₺ 680", store: "Hazan Rare Books", stock: "In stock · 1 left", link: "https://example.com/book", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800" },
  ],
};

export type CommunityPost = {
  id: string;
  tone: string;
  productName: string;
  store: string;
  forTr: string;
  forEn: string;
  textTr: string;
  textEn: string;
  author: string;
  anon: boolean;
  likes: number;
  h: number;
};

export const COMMUNITY_FEED: CommunityPost[] = [
  { id: "p1", tone: "sage", productName: "Sumak Tabakli Yemek Seti", store: "Karaca Home", forTr: "Annem için", forEn: "For my mom", textTr: "Akşam yemekleri artık küçük bir ritüel oldu. AI bunu anlatınca ben de gülmüştüm ama haklı çıktı.", textEn: "Dinner became a small ritual for her. Skeptical at first — turns out the AI was right.", author: "Selin K.", anon: false, likes: 142, h: 320 },
  { id: "p2", tone: "rose", productName: "Mum Yapım Kiti", store: "Atölye Ev", forTr: "Sevgilim için", forEn: "For my partner", textTr: "Birlikte yapma sebebi olsun istedim. Üç hafta sonra hâlâ konuşuyoruz.", textEn: "Wanted us to do something together. Three weeks later we're still talking about it.", author: "Anonim", anon: true, likes: 98, h: 260 },
  { id: "p3", tone: "clay", productName: "İkinci El Plaklar, 3'lü", store: "Plak Plak", forTr: "Arkadaşım için", forEn: "For my friend", textTr: "Üçü de 90'lar Türk pop. Açar açmaz sessizleşip dinledi, sonra bana sarıldı.", textEn: "All three 90s Turkish pop. He went quiet, listened, then hugged me.", author: "Mert A.", anon: false, likes: 211, h: 380 },
  { id: "p4", tone: "sky", productName: "Deri Yazı Kutusu", store: "Selçukoğlu", forTr: "Babam için", forEn: "For my dad", textTr: "Babamın 'fazla şık' diye sevmediği şeyleri sevdiğini öğrendim.", textEn: "Turns out dad does like the 'too fancy' things — he just never says so.", author: "Burak Y.", anon: false, likes: 76, h: 220 },
  { id: "p5", tone: "rose", productName: "Şal, Bursa İpeği", store: "İpek Yolu", forTr: "Anneannem için", forEn: "For my grandmother", textTr: "85 yaşında, hâlâ aynalı dolapta ütülenmiş kalıyor — 'özel günlere'.", textEn: "She's 85. Still folded in the mirrored wardrobe — saved for 'special days'.", author: "Anonim", anon: true, likes: 312, h: 340 },
  { id: "p6", tone: "sage", productName: "Bahçe Aletleri Seti", store: "Çiçekçi Ali", forTr: "Kardeşim için", forEn: "For my sister", textTr: "Yeni balkonu için. İlk geldiği gün üç saat orada kaldı.", textEn: "For her new balcony. She stayed out there three hours the day it arrived.", author: "Ezgi T.", anon: false, likes: 64, h: 240 },
  { id: "p7", tone: "clay", productName: "Türk Kahvesi Cezve Seti", store: "Kahvedan", forTr: "İş arkadaşım için", forEn: "For a coworker", textTr: "Veda hediyesi. Pazartesi gönderdi: 'Sabah ofise gelmek artık tuhaf.'", textEn: "A goodbye gift. He texted Monday: 'Coming to the office feels strange now.'", author: "Cem Ö.", anon: false, likes: 187, h: 280 },
  { id: "p8", tone: "sky", productName: "Mavi Kağıt Defter", store: "Sahaf Hazan", forTr: "Kendim için", forEn: "For myself", textTr: "İlk defa kendime aldım. AI çok iyi bildi.", textEn: "First time I treated myself. The AI got it weirdly right.", author: "Anonim", anon: true, likes: 421, h: 360 },
  { id: "p9", tone: "rose", productName: "Çocuk Kitabı Seti", store: "Redhouse", forTr: "Yeğenim için", forEn: "For my niece", textTr: "5 yaşında. Önce kapakları öptü, sonra okuduk.", textEn: "She's 5. Kissed the covers first, then we read.", author: "Deniz B.", anon: false, likes: 145, h: 240 },
  { id: "p10", tone: "sage", productName: "Şarap, Yerel Üretim", store: "Bağ&Bağ", forTr: "Komşum için", forEn: "For a neighbor", textTr: "Apartmanda yeni biri. 'Hoş geldin' kelimesi yeterli değildi.", textEn: "New to the building. 'Welcome' wasn't going to cut it.", author: "Anonim", anon: true, likes: 53, h: 220 },
  { id: "p11", tone: "clay", productName: "El Yapımı Sabun, 4'lü", store: "Lavanta", forTr: "Öğretmenim için", forEn: "For my teacher", textTr: "Yıl sonu. Sınıfça topladık. Yazılı bir nota ekledik.", textEn: "End of year. Whole class chipped in. We added a handwritten note.", author: "Anonim", anon: true, likes: 89, h: 260 },
  { id: "p12", tone: "sky", productName: "Ay Çizimi, Numaralı Baskı", store: "İstanbul Print", forTr: "Sevgilim için", forEn: "For my partner", textTr: "Tanıştığımız gece dolunay vardı. Bunu ona söylemedim, çerçeveyi açtığında anladı.", textEn: "The night we met, full moon. I didn't say so — she figured it out when she opened it.", author: "Tuna E.", anon: false, likes: 268, h: 320 },
];

export const RECIPIENTS = {
  tr: { partner: "Sevgili", mom: "Anne", dad: "Baba", friend: "Arkadaş", sibling: "Kardeş", coworker: "İş Arkadaşı", child: "Çocuk", other: "Diğer" },
  en: { partner: "Partner", mom: "Mom", dad: "Dad", friend: "Friend", sibling: "Sibling", coworker: "Coworker", child: "Child", other: "Other" },
};

export const BUDGETS = {
  tr: { b1: "0 – 500 ₺", b2: "500 – 1.000 ₺", b3: "1.000 – 3.000 ₺", b4: "3.000 – 10.000 ₺", b5: "10.000 ₺ +" },
  en: { b1: "₺0 – 500", b2: "₺500 – 1,000", b3: "₺1,000 – 3,000", b4: "₺3,000 – 10,000", b5: "₺10,000 +" },
};

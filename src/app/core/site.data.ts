const PHONE = '+918171176089';      // <-- put your real number here (keep the +91 format)
const EMAIL = 'negisuri010@gmail.com';
const PLACE = 'Kainyur, Thalisain, Pauri Garhwal, Uttarakhand 246285';
const WA = PHONE.replace(/\D/g, '');    // digits only, used for wa.me

export const SITE = {
  name: 'RAIBAR HOMESTAY', tagline: 'MOMENTS MATTER MOST',
  phone: PHONE, email: EMAIL,
  address: 'Nagar Panchayat Kainyur, Thalisain, Pauri Garhwal, Uttarakhand',
  whatsapp: WA,
  waLink: 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Hello RAIBAR HOMESTAY, I would like to know more about a stay.'),
  mailto: 'mailto:' + EMAIL,
  mapEmbed: 'https://www.google.com/maps?q=' + encodeURIComponent(PLACE) + '&output=embed',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(PLACE),
  directions: 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(PLACE),
  instagram: 'https://www.instagram.com/surendra_singh_negi_harshi?vrfl=Ym04OG1zemFlZHRq/',   // <-- paste your Instagram page link
    facebook: 'https://www.facebook.com/share/1KSzufJAbj/',     // <-- paste your Facebook page link
  reviewEndpoint: ''   // optional: a Formspree/EmailJS URL that emails you every new review

};

export interface Room { id: number; name: string; img: string; tags: string[]; price: number }
export const ROOMS: Room[] = [
  { id: 0, name: 'Valley Facing Room', img: 'images/p5.jpeg', price: 1000, tags: ['1 GUEST', 'BALCONY', 'SUNRISE VIEW',  'WIFI', 'HOT WATER'] },
  { id: 1, name: 'Garden Room', img: 'images/p6.png', price: 1000, tags: ['2 GUESTS', 'GARDEN SIT-OUT', 'MODERN',  'WIFI', 'HOT WATER'] }
];

export const HERO_SLIDES = ['images/p1.png', 'images/p4.png', 'images/p2.png', 'images/p3.png'];
export const HERO_WORDS = ['Explore', 'Eat well in', 'Rest easy in', 'Breathe deep in'];
export const GALLERY = [
  { src: 'images/p1.png', alt: 'Terrace at sunset' }, { src: 'images/p2.png', alt: 'The garden' },
  { src: 'images/p16.png', alt: 'Yoga and mornings' }, { src: 'images/p15.png', alt: 'Valley facing room' },
  { src: 'images/p9.jpeg', alt: 'Mountain views' }
];

export interface Temple { key: string; name: string; nameHi: string; img: string; desc: string; descHi: string }
export const TEMPLES: Record<string, Temple> = {
  bh: { key: 'bh', name: 'Bhairokhal Mandir', nameHi: 'भैरोखाल मंदिर', img: 'images/p12.jpeg',
    desc: 'Also called Kalbhairav Mandir, this is a highly respected shrine in the Tripalisain area of Pauri Garhwal. It is dedicated to Baba Kalbhairav, the fierce form of Lord Shiva, whom locals regard as the guardian and gatekeeper of the region.',
    descHi: 'उत्तराखंड के पौड़ी गढ़वाल जिले में त्रिपालीसैंण क्षेत्र का एक अत्यंत प्रतिष्ठित धार्मिक स्थल (कालभैरव मंदिर)। भगवान शिव के उग्र रूप बाबा कालभैरव को समर्पित यह मंदिर स्थानीय निवासियों की आस्था का प्रमुख केंद्र है, जिन्हें क्षेत्र का रक्षक या द्वारपाल माना जाता है।' },
  ar: { key: 'ar', name: 'Ardhnareshwar Mandir', nameHi: 'अर्धनारीश्वर मन्दिर', img: 'images/p11.jpeg',
    desc: 'Dedicated to the divine forms of Lord Shiva and Mata Parvati, this ancient temple is known for its architecture, peaceful atmosphere and deep spiritual energy.',
    descHi: 'भगवान शिव और माता पार्वती के दिव्य रूपों को समर्पित ये प्राचीन मंदिर अपनी वास्तुकला, शांत वातावरण और गहरी आध्यात्मिक ऊर्जा के लिए जाने जाते हैं।' },
  ta: { key: 'ta', name: 'Tarakund Mandir', nameHi: 'ताराकुण्ड मन्दिर', img: 'images/p14.jpeg',
    desc: 'A beautiful and peaceful trek to a high mountain peak, where the temple stands beside a sacred lake. It feels like heaven for nature and spiritual lovers.',
    descHi: 'पहाड़ों की ऊँची चोटी पर स्थित यह एक बेहद खूबसूरत और शांत ट्रैक है, जहाँ एक पवित्र झील के किनारे मंदिर स्थित है। प्रकृति और अध्यात्म प्रेमियों के लिए यह जन्नत जैसा है।' },
  ra: { key: 'ra', name: 'Rahu Mandir (Pathani)', nameHi: 'राहू मंदिर (पैठानी)', img: 'images/p13.jpeg',
    desc: 'Said to be the only Rahu temple in Asia and Uttarakhand, where Rahu Maharaj is worshipped along with Lord Shiva. It is believed that worship here frees one from Rahu dosh. The journey from our homestay is very easy.',
    descHi: 'एशिया और उत्तराखंड के इस एकमात्र राहु मंदिर में भगवान शिव के साथ राहु महाराज की पूजा होती है। मान्यता है कि यहाँ पूजा करने से राहु दोष से मुक्ति मिलती है। हमारे होमस्टे से इस दुर्लभ मंदिर की यात्रा बेहद सुगम है।' },
  ha: { key: 'ha', name: 'Hanseshwar Mahadev Mandir', nameHi: 'हंसेश्वर महादेव मंदिर', img: 'images/p18.jpeg',
    desc: 'Also known as the Hansuri Mandir, this is a revered shrine of Lord Shiva in Hansuri village, Pauri Garhwal. It is especially loved by the local community for its natural beauty and calm village setting.',
    descHi: 'हंसेश्वर महादेव, जिसे हंसुरी मंदिर के नाम से भी जाना जाता है, भगवान शिव को समर्पित एक पूजनीय तीर्थस्थल है, जो पौड़ी गढ़वाल के हंसुरी गांव में स्थित है। यह मंदिर अपनी प्राकृतिक सुंदरता और शांत ग्रामीण परिवेश के लिए स्थानीय समुदाय में विशेष रूप से प्रसिद्ध है।' },
  de: { key: 'de', name: 'Deeba Mandir', nameHi: 'दीवा मन्दिर', img: 'images/p9.jpeg',
    desc: 'Worshipped as protector deities of the region, the Deeba temples give a sweeping view of the mountains. Because of its unique culture and high location, the Deeba Mata temple is also a great trekking point.',
    descHi: 'क्षेत्र के रक्षक देवताओं के रूप में पूजे जाने वाले इन मंदिरों से पहाड़ों का विहंगम दृश्य दिखाई देता है। दीवा माता का मंदिर अपनी अनूठी संस्कृति और ऊँचाई पर स्थित होने के कारण पर्यटकों के लिए एक बेहतरीन ट्रेकिंग पॉइंट भी है।' },
  bi: { key: 'bi', name: 'Binsar Mahadev Mandir', nameHi: 'बिनसर महादेव मन्दिर', img: 'images/p17.jpeg',
    desc: 'A very ancient and sacred Shiva temple near Thalisain tehsil in Pauri Garhwal, about 2,480 m above sea level. It sits among dense deodar, pine and oak forests and gives pilgrims a deep sense of peace and natural beauty.',
    descHi: 'उत्तराखण्ड के पौड़ी गढ़वाल जिले में थलीसैंण तहसील के पास स्थित भगवान शिव को समर्पित एक अत्यंत प्राचीन और पवित्र मंदिर। यह समुद्र तल से लगभग 2480 मीटर की ऊँचाई पर देवदार, पाइन और ओक के घने जंगलों के बीच बसा है, जो श्रद्धालुओं को असीम शांति और प्राकृतिक सुंदरता का अनुभव कराता है।' },
  ka: { key: 'ka', name: 'Maa Kalinka Mandir', nameHi: 'माँ कालिंका मंदिर', img: 'images/p10.jpeg',
    desc: 'A famous, ancient Siddhpeeth of Maa Kali in Beeronkhal block, Pauri Garhwal, at about 1,200 m above sea level. It lies very close to the Garhwal–Kumaon (Almora) border.',
    descHi: 'पौड़ी गढ़वाल जिले के बीरोंखाल ब्लॉक में स्थित एक प्रसिद्ध और जागृत सिद्धपीठ। समुद्र तल से करीब 1200 मीटर की ऊँचाई पर बसा यह प्राचीन मंदिर माँ काली को समर्पित है और गढ़वाल-कुमाऊं (अल्मोड़ा) की सीमा के बेहद करीब स्थित है।' }
};

/** A group of temples the guest picks from. optional = may also choose "none". */
export interface Trip {
  id: number; days: number; daysHi: string; img: string; price: number;
  title: string; titleHi: string; desc: string; descHi: string;
  fixed: string[];            // temples always included
  options: string[];          // optional temples: guest can tick one, both, or none
  optionNote?: string;        // e.g. "10 km trek, not by road"
  optionNoteHi?: string;
}
export const templeCount = (t: Trip) => t.fixed.length;
export const hasOption = (t: Trip) => t.options.length > 0;

const TREK = 'Deeba Mandir and Binsar Mahadev Mandir are reached by a 10 km trek on foot, not by road. Choose one, or both if you like.';
const TREK_HI = 'दीवा मंदिर और बिनसर महादेव मंदिर सड़क मार्ग से नहीं, बल्कि लगभग 10 किमी के पैदल ट्रैक से पहुँचे जाते हैं। आप एक या चाहें तो दोनों चुन सकते हैं।';

export const TRIPS: Trip[] = [
  { id: 0, days: 2, daysHi: '2 दिन', price: 2999, img: 'images/p12.jpeg',
    title: '2-Day Road Trip', titleHi: '2 दिन की रोड ट्रिप',
    desc: 'Bhairokhal, Ardhnareshwar, Hanseshwar and Rahu Mandir by road, with Tarakund as an optional add-on.',
    descHi: 'सड़क मार्ग से भैरोखाल, अर्धनारीश्वर, हंसेश्वर और राहु मंदिर, साथ में विकल्प के रूप में ताराकुण्ड।',
    fixed: ['bh', 'ar', 'ha', 'ra'], options: ['ta'] },
  { id: 1, days: 5, daysHi: '5 दिन', price: 3999, img: 'images/p13.jpeg',
    title: '5-Day Long Trip', titleHi: '5 दिन की लंबी यात्रा',
    desc: 'Bhairokhal, Ardhnareshwar, Tarakund and Rahu Mandir, with Deeba and Binsar Mahadev as optional treks.',
    descHi: 'भैरोखाल, अर्धनारीश्वर, ताराकुण्ड और राहु मंदिर, साथ में दीवा और बिनसर महादेव के वैकल्पिक ट्रैक।',
    fixed: ['bh', 'ar', 'ta', 'ra'], options: ['de', 'bi'], optionNote: TREK, optionNoteHi: TREK_HI },
  { id: 2, days: 7, daysHi: '7 दिन', price: 4999, img: 'images/p10.jpeg',
    title: '7-Day Grand Trip', titleHi: '7 दिन की भव्य यात्रा',
    desc: 'Bhairokhal, Ardhnareshwar, Tarakund, Rahu Mandir and Maa Kalinka, with Deeba and Binsar Mahadev as optional treks.',
    descHi: 'भैरोखाल, अर्धनारीश्वर, ताराकुण्ड, राहु मंदिर और माँ कालिंका, साथ में दीवा और बिनसर महादेव के वैकल्पिक ट्रैक।',
    fixed: ['bh', 'ar', 'ta', 'ra', 'ka'], options: ['de', 'bi'], optionNote: TREK, optionNoteHi: TREK_HI }
];

export interface Review { id: string; name: string; rating: number; text: string; date: string; stay?: string; mine?: boolean }

/** Reviews YOU have approved (real guests only). Newest first is fine, the page sorts them.
 *  Copy this format for each one:
 *  { id: 'r1', name: 'Guest name', rating: 5, stay: 'Homestay stay', text: 'Their own words', date: '2026-09-14' }
 */
export const REVIEWS: Review[] = [];
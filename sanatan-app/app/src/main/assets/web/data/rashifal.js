/* Bhakti Daily — Rashifal (daily horoscope) data.
 *
 * IMANDAARI note: Ye "aaj ka rashifal" prerak margdarshan (positive guidance)
 * hai — koi guaranteed bhavishyavani nahi. Content har din + har rashi ke liye
 * date se deterministically chuna jata hai (rojana badalta, par random nahi).
 * "Upay" seedhe app ke paath se judta hai (bhakti + engagement).
 */
window.BHAKTI_RASHI = {
  // 12 rashi — swami graha se upay ka paath juda hai (sirf 'ready' paath).
  list: [
    { key:"mesh",     name:"मेष",     en:"Aries",       sym:"♈", dates:"21 मार्च – 19 अप्रैल",   graha:"मंगल",  accent:"#E53935", upay:["hanuman-chalisa","hanuman-mantra"] },
    { key:"vrishabh", name:"वृषभ",    en:"Taurus",      sym:"♉", dates:"20 अप्रैल – 20 मई",      graha:"शुक्र", accent:"#43A047", upay:["lakshmi-aarti","durga-aarti"] },
    { key:"mithun",   name:"मिथुन",   en:"Gemini",      sym:"♊", dates:"21 मई – 20 जून",         graha:"बुध",   accent:"#00897B", upay:["ganesh-mantra","ganesh-aarti"] },
    { key:"kark",     name:"कर्क",    en:"Cancer",      sym:"♋", dates:"21 जून – 22 जुलाई",      graha:"चंद्र", accent:"#5C6BC0", upay:["shiv-aarti","om-namah-shivaya"] },
    { key:"simha",    name:"सिंह",    en:"Leo",         sym:"♌", dates:"23 जुलाई – 22 अगस्त",    graha:"सूर्य", accent:"#FB8C00", upay:["gayatri","ram-mantra"] },
    { key:"kanya",    name:"कन्या",   en:"Virgo",       sym:"♍", dates:"23 अगस्त – 22 सितंबर",   graha:"बुध",   accent:"#00ACC1", upay:["ganesh-aarti","ganesh-mantra"] },
    { key:"tula",     name:"तुला",    en:"Libra",       sym:"♎", dates:"23 सितंबर – 22 अक्टूबर", graha:"शुक्र", accent:"#EC407A", upay:["lakshmi-aarti","durga-aarti"] },
    { key:"vrishchik",name:"वृश्चिक", en:"Scorpio",     sym:"♏", dates:"23 अक्टूबर – 21 नवंबर",  graha:"मंगल",  accent:"#8E24AA", upay:["hanuman-chalisa","hanuman-mantra"] },
    { key:"dhanu",    name:"धनु",     en:"Sagittarius", sym:"♐", dates:"22 नवंबर – 21 दिसंबर",   graha:"गुरु",  accent:"#F9A825", upay:["om-jai-jagdish","krishna-mantra"] },
    { key:"makar",    name:"मकर",     en:"Capricorn",   sym:"♑", dates:"22 दिसंबर – 19 जनवरी",   graha:"शनि",   accent:"#3949AB", upay:["shani-mantra","hanuman-chalisa"] },
    { key:"kumbh",    name:"कुंभ",    en:"Aquarius",    sym:"♒", dates:"20 जनवरी – 18 फरवरी",    graha:"शनि",   accent:"#1E88E5", upay:["shani-mantra","hanuman-chalisa"] },
    { key:"meen",     name:"मीन",     en:"Pisces",      sym:"♓", dates:"19 फरवरी – 20 मार्च",    graha:"गुरु",  accent:"#00838F", upay:["om-jai-jagdish","krishna-mantra"] }
  ],

  // ---- content pools (deterministic pick by date+rashi) ----
  saamanya: [
    "आज का दिन आपके लिए शुभ और ऊर्जावान रहेगा। आत्मविश्वास बनाए रखें।",
    "मन में सकारात्मकता रहेगी। रुके हुए काम आगे बढ़ेंगे।",
    "आज धैर्य आपका सबसे बड़ा साथी है — जल्दबाज़ी से बचें।",
    "ईश्वर की कृपा से आज कोई शुभ समाचार मिल सकता है।",
    "आज नए अवसर सामने आएँगे — खुले मन से स्वीकार करें।",
    "दिन की शुरुआत भक्ति से करें, पूरा दिन मंगलमय रहेगा।",
    "आज आपकी मेहनत रंग लाएगी, आत्मसंतुष्टि मिलेगी।",
    "छोटी बातों को दिल पर न लें — मन शांत रखें, दिन अच्छा बीतेगा।",
    "आज किसी बुज़ुर्ग या गुरु का आशीर्वाद लाभ देगा।",
    "आज दान-पुण्य का विशेष फल मिलेगा। ज़रूरतमंद की मदद करें।",
    "आज समय आपके पक्ष में है — आत्मविश्वास से निर्णय लें।",
    "मन थोड़ा व्यस्त रहेगा, पर शाम तक राहत और प्रसन्नता आएगी।"
  ],
  prem: [
    "जीवनसाथी से मधुर संवाद होगा, रिश्ते में मिठास बढ़ेगी।",
    "परिवार में प्रेम और सहयोग का वातावरण रहेगा।",
    "आज अपनों को समय दें — रिश्ते और मज़बूत होंगे।",
    "किसी पुराने मित्र से मुलाक़ात मन प्रसन्न करेगी।",
    "प्रेम संबंधों में समझदारी से काम लें, सब शुभ रहेगा।",
    "आज घर में कोई शुभ या मांगलिक चर्चा हो सकती है।",
    "अपनी बात प्रेम से रखें — गलतफ़हमी दूर होगी।",
    "साथी का सहयोग आपका उत्साह बढ़ाएगा।"
  ],
  karya: [
    "कार्यक्षेत्र में आपकी मेहनत की सराहना होगी।",
    "आज व्यापार/नौकरी में नया अवसर मिल सकता है।",
    "रुका हुआ धन या भुगतान आज मिल सकता है।",
    "सहकर्मियों का सहयोग मिलेगा, काम आसान होगा।",
    "आज सोच-समझकर निवेश करें, लाभ के योग हैं।",
    "नई योजना शुरू करने के लिए दिन शुभ है।",
    "अधिकारी/वरिष्ठ प्रसन्न रहेंगे, तरक्की के योग हैं।",
    "आज मेहनत थोड़ी ज़्यादा, पर परिणाम संतोषजनक रहेंगे।",
    "किसी के साथ साझेदारी लाभकारी सिद्ध होगी।",
    "आज आर्थिक स्थिति में सुधार के संकेत हैं।"
  ],
  swasthya: [
    "स्वास्थ्य उत्तम रहेगा — योग व प्राणायाम लाभ देंगे।",
    "आज हल्का भोजन लें, पाचन ठीक रहेगा।",
    "पर्याप्त जल पिएँ और आराम करें, ऊर्जा बनी रहेगी।",
    "मानसिक शांति के लिए आज ध्यान/जाप करें।",
    "सुबह की सैर आपको दिनभर तरोताज़ा रखेगी।",
    "थकान महसूस हो तो विश्राम को प्राथमिकता दें।",
    "आज सेहत का ध्यान रखें, दिनचर्या संतुलित रखें।",
    "सकारात्मक सोच से स्वास्थ्य और मन दोनों अच्छे रहेंगे।"
  ],
  colors: ["केसरिया","लाल","पीला","हरा","सफ़ेद","गुलाबी","नीला","सुनहरा","नारंगी","क्रीम"],
  disha: ["पूर्व","पश्चिम","उत्तर","दक्षिण","ईशान (उत्तर-पूर्व)","आग्नेय (दक्षिण-पूर्व)","वायव्य (उत्तर-पश्चिम)","नैऋत्य (दक्षिण-पश्चिम)"]
};

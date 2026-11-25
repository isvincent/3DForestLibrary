// ==========================================================================
// 森嶼書屋 · 心靈微光圖書館 — School Config, Islands, Animal Librarians & SEL Books
// 學校／圖書館管理者可直接修改下方 SITE_CONFIG 與 ISLANDS 中的館藏書單與索書號
// ==========================================================================

export const SITE_CONFIG = {
  schoolNameZh: "校園圖書館 · 閱讀與社會情緒學習專區",
  schoolNameEn: "CAMPUS LIBRARY · READING & SEL SANCTUARY",
  titleMainZh: "森嶼書屋",
  titleAccentZh: "心靈微光圖書館",
  titleMainEn: "Woodland Isles",
  titleAccentEn: "SEL Sanctuary Library",
  subtitleZh: "走訪六座主題閱讀島嶼與動物館員，在書頁與呼吸之間安放每一種心情。",
  subtitleEn: "Explore six reading islands and animal librarians to pair every emotion with a comforting book."
};

export const TIME_PRESETS = {
  dawn: {
    id: "dawn",
    clock: "06:30",
    labelZh: "清晨",
    labelEn: "Dawn",
    skyTop: "#dce8ec",
    skyBottom: "#f7e3cc",
    fogColor: "#e8dfd2",
    waterColor: "#93b8bc",
    waterDeep: "#6e989e",
    hemiSky: 0xfbe7d0,
    hemiGround: 0x6f7d65,
    hemiIntensity: 0.88,
    sunColor: 0xffcfa0,
    sunIntensity: 1.15,
    sunPos: [26, 22, 18],
    lanternGlow: 0.25
  },
  day: {
    id: "day",
    clock: "12:00",
    labelZh: "暖晝",
    labelEn: "Day",
    skyTop: "#b8d6da",
    skyBottom: "#eef3ec",
    fogColor: "#d9e6e4",
    waterColor: "#8fb6b8",
    waterDeep: "#679296",
    hemiSky: 0xffffff,
    hemiGround: 0x6e7f63,
    hemiIntensity: 0.96,
    sunColor: 0xfff5e0,
    sunIntensity: 1.38,
    sunPos: [22, 38, 24],
    lanternGlow: 0.06
  },
  dusk: {
    id: "dusk",
    clock: "17:30",
    labelZh: "夕照",
    labelEn: "Dusk",
    skyTop: "#6f7f9c",
    skyBottom: "#efb88b",
    fogColor: "#cfa894",
    waterColor: "#748f9c",
    waterDeep: "#4f6878",
    hemiSky: 0xffcaa0,
    hemiGround: 0x4d4a44,
    hemiIntensity: 0.78,
    sunColor: 0xff9e5e,
    sunIntensity: 1.12,
    sunPos: [-28, 16, 20],
    lanternGlow: 0.72
  },
  night: {
    id: "night",
    clock: "21:00",
    labelZh: "星夜",
    labelEn: "Night",
    skyTop: "#1d2b3a",
    skyBottom: "#354d63",
    fogColor: "#293c4e",
    waterColor: "#355366",
    waterDeep: "#1d313e",
    hemiSky: 0x9bb8e8,
    hemiGround: 0x3b443e,
    hemiIntensity: 0.78,
    sunColor: 0xa8c5ff,
    sunIntensity: 0.65,
    sunPos: [-18, 30, 22],
    lanternGlow: 1.0
  }
};

export const ISLANDS = [
  {
    id: "atrium",
    code: "00",
    pos: [0, 0, 0],
    radius: 8.6,
    groundColor: 0xeae0cc,
    rimColor: 0x4f735b,
    nameZh: "晨光總館 · 心情選書廳",
    nameEn: "Central Reading Atrium",
    selCompetencyZh: "全館導覽 · 心情選書起點",
    selCompetencyEn: "Library Hub · Mood Curation",
    descZh: "六座閱讀島嶼的中心樞紐。圓頂樺木閱覽廳收藏著跨領域繪本與文學，貓頭鷹館長歐利在選書桌前為每位讀者指引適合今天心情的島嶼。",
    descEn: "The timber-domed heart of the archipelago where Owl Librarian Ollie pairs your current mood with a quiet reading nook.",
    indoorTitleZh: "晨光圓頂總館閱覽室",
    indoorTitleEn: "Sunlit Timber Atrium",
    indoorWallColor: 0xf0e6d2,
    indoorFloorColor: 0xb9936c,
    librarian: {
      nameZh: "歐利 Ollie",
      nameEn: "Ollie the Owl",
      roleZh: "貓頭鷹總館長",
      roleEn: "Chief Owl Librarian",
      species: "owl",
      accentHex: "#4F735B",
      greetingZh: "歡迎來到森嶼書屋！今天心裡裝著什麼樣的天氣呢？挑一本書，慢慢呼吸就好。",
      greetingEn: "Welcome! Whatever weather you carry inside today, there is a warm page waiting for you.",
      tapQuotesZh: [
        "咕咕——不急著讀完每一頁，能被一句話觸動就很棒了。",
        "如果不知道從哪裡開始，點左上角的「心情選書」讓我幫你挑！",
        "夜晚點亮閱讀燈時，整座群島的窗戶都會發光喔。"
      ]
    },
    stations: [
      { titleZh: "心情選書羅盤桌", titleEn: "Mood Compass Desk", offset: [2.4, 1.3, 2.2] },
      { titleZh: "漂書出發鐘樓", titleEn: "Book-Drift Belltower", offset: [-2.8, 2.8, -1.6] },
      { titleZh: "樺木環形書牆", titleEn: "Birch Book Rotunda", offset: [0.2, 3.6, -2.4] }
    ],
    books: [
      {
        titleZh: "森嶼慢讀：給青少年的情緒圖書館指南",
        titleEn: "Mindful Reading in the Library",
        author: "閱讀推廣精選主題",
        tagZh: "閱讀療癒入門",
        callNumber: "[索書號待填]",
        excerptZh: "「圖書館不只是尋找標準答案的地方，更是允許自己暫停、提問與重新整理心情的避風港。」"
      },
      {
        titleZh: "心的百寶箱：認識自己的第一堂課",
        titleEn: "Atlas of the Heart",
        author: "布芮尼・布朗 Brené Brown",
        tagZh: "情緒詞彙地圖",
        callNumber: "[索書號待填]",
        excerptZh: "「當我們能準確叫出情緒的名字，它就不再是一團令人害怕的迷霧，而是可以被理解的訊號。」"
      },
      {
        titleZh: "書頁間的四季散步",
        titleEn: "Seasons Between Pages",
        author: "館員主題書展",
        tagZh: "跨域共讀",
        callNumber: "[索書號待填]",
        excerptZh: "「有時候，一本剛好翻開的小說，比千言萬語更能陪你度過一個安靜的午後。」"
      }
    ],
    reflectionPromptZh: "走進圖書館的這一刻，如果用一種「天氣」形容你現在的心情，會是什麼呢？"
  },
  {
    id: "cove",
    code: "01",
    pos: [-15.2, 0, -6.2],
    radius: 7.4,
    groundColor: 0xe3e7d7,
    rimColor: 0x679296,
    nameZh: "靜心水岸 · 覺察書席",
    nameEn: "Self-Awareness Cove",
    selCompetencyZh: "SEL 自我覺察 · Self-Awareness",
    selCompetencyEn: "Self-Awareness",
    descZh: "臨水而建的木棧暖泉書席，水面漂浮著微光蓮燈。水豚卡皮靜靜泡在溫水池畔看書，陪你練習觀察內在感受，不批判每一份低潮或疲憊。",
    descEn: "A tranquil waterside deck with floating lotus lanterns where Capybara Capy helps you notice and name emotions gently.",
    indoorTitleZh: "水岸和風靜讀茶室",
    indoorTitleEn: "Waterside Cedar Nook",
    indoorWallColor: 0xe8eadc,
    indoorFloorColor: 0xc2ab88,
    librarian: {
      nameZh: "卡皮 Capy",
      nameEn: "Capy the Capybara",
      roleZh: "水豚情緒覺察員",
      roleEn: "Capybara Mindfulness Guide",
      species: "capybara",
      accentHex: "#679296",
      greetingZh: "累了的話，先在木棧邊坐下來吧。難過、煩躁或發呆，在這裡都是被允許的喔。",
      greetingEn: "Sit by the water for a moment. Tiredness, sadness, or daydreaming are all welcome here.",
      tapQuotesZh: [
        "呼嚕……頂著一顆小柑橘看書，心情也會跟著慢下來。",
        "發現自己「今天有點累」，本身就是很棒的自我覺察。",
        "情緒就像湖面的波紋，看清它，它就會慢慢平靜。"
      ]
    },
    stations: [
      { titleZh: "暖泉木棧書席", titleEn: "Warm Spring Deck", offset: [-1.8, 1.2, 1.8] },
      { titleZh: "水鏡情緒蓮燈", titleEn: "Lotus Reflection Pool", offset: [2.3, 0.9, 1.5] },
      { titleZh: "靜心軟墊閱讀角", titleEn: "Soft Cushion Nook", offset: [0.0, 1.8, -2.0] }
    ],
    books: [
      {
        titleZh: "蛤蟆先生去看心理師",
        titleEn: "Counselling for Toads",
        author: "羅伯・狄保德 Robert de Board",
        tagZh: "辨識內在狀態",
        callNumber: "[索書號待填]",
        excerptZh: "「沒有人能讓你感到不快樂，除非你自己允許；而理解自己的第一步，是誠實看見內心的感受。」"
      },
      {
        titleZh: "也許你該找人聊聊",
        titleEn: "Maybe You Should Talk to Someone",
        author: "蘿莉・葛利布 Lori Gottlieb",
        tagZh: "接納脆弱",
        callNumber: "[索書號待填]",
        excerptZh: "「我們往往以為把痛苦藏起來就能變堅強，卻忘了被看見的傷口才有機會溫柔癒合。」"
      },
      {
        titleZh: "小王子",
        titleEn: "The Little Prince",
        author: "安東尼・聖修伯里 Saint-Exupéry",
        tagZh: "傾聽本心",
        callNumber: "[索書號待填]",
        excerptZh: "「真正重要的東西，只用眼睛是看不見的，必須用心才能看清。」"
      }
    ],
    reflectionPromptZh: "今天哪一個瞬間讓你的心情產生了波動？試著不評價對錯，單純寫下那個感覺："
  },
  {
    id: "treehouse",
    code: "02",
    pos: [-11.6, 0, 12.6],
    radius: 7.5,
    groundColor: 0xdce4cf,
    rimColor: 0x4f735b,
    nameZh: "呼吸樹屋 · 安定閣樓",
    nameEn: "Self-Management Treehouse",
    selCompetencyZh: "SEL 自我管理 · Self-Management",
    selCompetencyEn: "Self-Management",
    descZh: "築在千年大樹枝枒間的木造書閣，中央懸浮著一顆隨呼吸節律舒張的暖琥珀光球。小熊巴尼陪你在考前緊繃或思緒超載時，找回安定的步調。",
    descEn: "An elevated woodland treehouse loft with a synchronized breathing orb where Bear Barnaby helps calm racing thoughts.",
    indoorTitleZh: "千年木閣樓呼吸書房",
    indoorTitleEn: "Canopy Breathing Loft",
    indoorWallColor: 0xe9dfc9,
    indoorFloorColor: 0xa67e58,
    hasBreathingCoach: true,
    librarian: {
      nameZh: "巴尼 Barnaby",
      nameEn: "Barnaby the Bear",
      roleZh: "小熊正念領讀員",
      roleEn: "Bear Calmness Companion",
      species: "bear",
      accentHex: "#4F735B",
      greetingZh: "腦袋轉個不停嗎？跟著樹屋上的琥珀光球吸氣四秒、吐氣六秒，把肩膀輕輕放下來。",
      greetingEn: "Mind racing fast? Follow our amber breathing orb—inhale for four, exhale for six.",
      tapQuotesZh: [
        "吸氣聞見森林木香，吐氣把緊繃慢慢交給微風。",
        "一次只專注讀完眼前這一段，事情就會變得踏實許多。",
        "休息不是偷懶，而是為了讓心重新長出力氣。"
      ]
    },
    stations: [
      { titleZh: "正念呼吸同步光球", titleEn: "Breathing Sync Orb", offset: [2.1, 2.5, 1.4] },
      { titleZh: "樹冠木造藏書閣", titleEn: "Canopy Book Loft", offset: [-1.4, 3.4, -1.2] },
      { titleZh: "微風閱讀吊床", titleEn: "Woodland Reading Bench", offset: [-2.2, 1.2, 2.0] }
    ],
    books: [
      {
        titleZh: "原子習慣",
        titleEn: "Atomic Habits",
        author: "詹姆斯・克利爾 James Clear",
        tagZh: "建立安定節奏",
        callNumber: "[索書號待填]",
        excerptZh: "「當生活感覺失控時，每天兩分鐘的微小閱讀或深呼吸，就是替自己穩住重心的船錨。」"
      },
      {
        titleZh: "焦慮的人",
        titleEn: "Anxious People",
        author: "弗雷德里克・巴克曼 Fredrik Backman",
        tagZh: "與不安共處",
        callNumber: "[索書號待填]",
        excerptZh: "「我們每個人都在盡力撐過今天；允許自己偶爾笨拙，焦慮就少了一半的重量。」"
      },
      {
        titleZh: "正念的奇蹟",
        titleEn: "The Miracle of Mindfulness",
        author: "一行禪師 Thich Nhat Hanh",
        tagZh: "呼吸與專注",
        callNumber: "[索書號待填]",
        excerptZh: "「把注意力溫柔地帶回當下的呼吸，過去的懊悔與未來的擔憂便暫時安靜下來。」"
      }
    ],
    reflectionPromptZh: "當你覺得壓力很大時，哪一個小小的動作（深呼吸、泡杯熱茶、翻幾頁書）最能幫自己安定下來？"
  },
  {
    id: "glasshouse",
    code: "03",
    pos: [14.4, 0, -7.6],
    radius: 7.5,
    groundColor: 0xe8e5d3,
    rimColor: 0x739476,
    nameZh: "暖陽溫室 · 同理書房",
    nameEn: "Social Awareness Glasshouse",
    selCompetencyZh: "SEL 社會覺察 · Social Awareness",
    selCompetencyEn: "Social Awareness",
    descZh: "陽光穿透玻璃屋頂灑落在蕨類植栽與共讀木桌上。垂耳兔米米最喜歡透過小說與紀實故事，帶讀者走進不同人的生命風景，練習溫柔的換位思考。",
    descEn: "A sunlit botanical conservatory where Lop Bunny Mimi curates stories that cultivate empathy and diverse perspectives.",
    indoorTitleZh: "植物陽光溫室共讀間",
    indoorTitleEn: "Botanical Reading Conservatory",
    indoorWallColor: 0xedf0e4,
    indoorFloorColor: 0xc5b293,
    librarian: {
      nameZh: "米米 Mimi",
      nameEn: "Mimi the Lop Bunny",
      roleZh: "垂耳兔故事同理師",
      roleEn: "Bunny Empathy Curator",
      species: "rabbit",
      accentHex: "#739476",
      greetingZh: "每一本故事書都是一扇窗，讓我們看見別人沒說出口的努力與溫柔。",
      greetingEn: "Every story is a clear window into someone else's quiet courage and unseen struggles.",
      tapQuotesZh: [
        "動動長耳朵聽一聽，同一個故事從不同角色看出去會完全不一樣喔！",
        "閱讀讓我們在一生之中，溫柔地體驗千百種人生。",
        "理解不等於勉強認同，而是願意看見對方的脈絡。"
      ]
    },
    stations: [
      { titleZh: "玻璃陽光植物書房", titleEn: "Sunlit Glass Conservatory", offset: [0.0, 3.2, -1.2] },
      { titleZh: "多元視角故事桌", titleEn: "Perspective Reading Table", offset: [-2.2, 1.3, 1.9] },
      { titleZh: "療癒香草花圃", titleEn: "Botanical Herb Bed", offset: [2.4, 1.1, 1.6] }
    ],
    books: [
      {
        titleZh: "奇蹟男孩",
        titleEn: "Wonder",
        author: "R. J. 帕拉秋 R. J. Palacio",
        tagZh: "選擇善良與同理",
        callNumber: "[索書號待填]",
        excerptZh: "「如果在『正確』與『善良』之間必須做出選擇，請選擇善良——因為每個人都在打一場你看不見的仗。」"
      },
      {
        titleZh: "解憂雜貨店",
        titleEn: "Miracles of the Namiya General Store",
        author: "東野圭吾 Keigo Higashino",
        tagZh: "傾聽生命處境",
        callNumber: "[索書號待填]",
        excerptZh: "「每一封看似微不足道的煩惱信背後，都是一顆認真想要好好生活的心。」"
      },
      {
        titleZh: "82年生的金智英",
        titleEn: "Kim Jiyoung, Born 1982",
        author: "趙南柱 Cho Nam-Joo",
        tagZh: "社會觀察與換位",
        callNumber: "[索書號待填]",
        excerptZh: "「當我們願意看見日常習以為常背後的隱形重量，真正的理解與改變才開始發生。」"
      }
    ],
    reflectionPromptZh: "最近有沒有哪一本書、一部作品或身邊某個人的故事，讓你看見了以前沒想過的觀點？"
  },
  {
    id: "courtyard",
    code: "04",
    pos: [13.2, 0, 11.8],
    radius: 7.5,
    groundColor: 0xede1ce,
    rimColor: 0xd88c3a,
    nameZh: "營火庭園 · 共讀茶席",
    nameEn: "Relationship Courtyard",
    selCompetencyZh: "SEL 人際技巧 · Relationship Skills",
    selCompetencyEn: "Relationship Skills",
    descZh: "溫暖躍動的營火與原木圍椅構成自在的共讀聚落。小狐狸緋緋在茶席旁準備了書信與對話小卡，陪你練習真誠表達、傾聽朋友，並守護健康的界線。",
    descEn: "A warm campfire circle and book-sharing pavilion where Fox Fifi helps practice sincere listening, gratitude, and healthy boundaries.",
    indoorTitleZh: "暖爐木屋共讀交誼廳",
    indoorTitleEn: "Hearthside Reading Lounge",
    indoorWallColor: 0xf2e4d0,
    indoorFloorColor: 0xb0845e,
    librarian: {
      nameZh: "緋緋 Fifi",
      nameEn: "Fifi the Fox",
      roleZh: "小狐狸對話領航員",
      roleEn: "Fox Connection Host",
      species: "fox",
      accentHex: "#E6A145",
      greetingZh: "營火已經升好囉！好的人際關係不需要討好，而是既能溫暖連結，也能自在做自己。",
      greetingEn: "The hearth is warm! Healthy connection means speaking kindly while keeping comfortable boundaries.",
      tapQuotesZh: [
        "不知道怎麼開口道謝或道歉時，借一句書裡的話當開頭也很棒！",
        "真正的傾聽，是先放下急著給建議的心，單純陪在對方身邊。",
        "說「我現在需要一點安靜時間」也是溫柔而成熟的溝通喔。"
      ]
    },
    stations: [
      { titleZh: "溫暖營火圍讀圈", titleEn: "Warm Campfire Circle", offset: [0.0, 1.4, 0.8] },
      { titleZh: "心意漂書交換亭", titleEn: "Book-Sharing Pavilion", offset: [-2.3, 2.6, -1.6] },
      { titleZh: "傾聽與界線茶席", titleEn: "Tea & Dialogue Table", offset: [2.3, 1.3, -1.4] }
    ],
    books: [
      {
        titleZh: "非暴力溝通：愛的語言",
        titleEn: "Nonviolent Communication",
        author: "馬歇爾・盧森堡 Marshall B. Rosenberg",
        tagZh: "真誠表達與傾聽",
        callNumber: "[索書號待填]",
        excerptZh: "「區分『觀察』與『評論』，說出真實的感受與具體的請求，讓對話成為橋梁而非高牆。」"
      },
      {
        titleZh: "山茶花文具店",
        titleEn: "The Kamogawa Food Detectives / Stationery Shop",
        author: "小川糸 Ito Ogawa",
        tagZh: "書信與心意傳遞",
        callNumber: "[索書號待填]",
        excerptZh: "「有些當面說不出口的感謝與和解，化作文字慢慢書寫時，心意反而更清澈溫柔。」"
      },
      {
        titleZh: "被討厭的勇氣",
        titleEn: "The Courage to Be Disliked",
        author: "岸見一郎、古賀史健",
        tagZh: "課題分離與界線",
        callNumber: "[索書號待填]",
        excerptZh: "「溫柔不是背負別人的情緒課題，而是清楚界線之後，依然選擇尊重與信任。」"
      }
    ],
    reflectionPromptZh: "如果今天可以寫一張短短的書籤送給一位朋友（或未來的自己），你想寫下哪一句話？"
  },
  {
    id: "lighthouse",
    code: "05",
    pos: [1.4, 0, -17.4],
    radius: 7.3,
    groundColor: 0xe6e4da,
    rimColor: 0x526b7a,
    nameZh: "觀星燈塔 · 領航書閣",
    nameEn: "Responsible Decision Lighthouse",
    selCompetencyZh: "SEL 負責任的決定 · Responsible Decision",
    selCompetencyEn: "Responsible Decision-Making",
    descZh: "矗立在群島北端水岸的木石燈塔與觀星露台。小鹿諾亞守著星盤與哲學書架，陪你在升學、社團或生活兩難中，釐清價值觀並做出對自己與他人負責的選擇。",
    descEn: "A northern beacon tower and stargazing terrace where Deer Noah guides thoughtful reflection on values and choices.",
    indoorTitleZh: "觀星燈塔頂層書閣",
    indoorTitleEn: "Stargazer Beacon Study",
    indoorWallColor: 0xe9e7df,
    indoorFloorColor: 0x9e8267,
    librarian: {
      nameZh: "諾亞 Noah",
      nameEn: "Noah the Deer",
      roleZh: "小鹿領航思考員",
      roleEn: "Deer Compass Keeper",
      species: "deer",
      accentHex: "#526B7A",
      greetingZh: "起霧的時候不用急著奔跑。看看燈塔的光，想想什麼對你真正重要，再踏出下一步。",
      greetingEn: "No need to rush in the fog. Check your inner compass, weigh gently, and take one steady step.",
      tapQuotesZh: [
        "沒有「零缺點」的完美決定，只有願意為選擇投入心力的自己。",
        "做決定前問問自己：這個選擇是否照顧到了自己，也不傷害他人？",
        "迷路也是探索地圖的一部分，燈塔一直都在這裡亮著。"
      ]
    },
    stations: [
      { titleZh: "領航燈塔藏書閣", titleEn: "Beacon Book Tower", offset: [-1.4, 4.8, -1.2] },
      { titleZh: "星盤價值觀測台", titleEn: "Star-Compass Terrace", offset: [2.2, 1.5, 1.4] },
      { titleZh: "未來期許書籤牆", titleEn: "Future Bookmark Stand", offset: [-2.1, 1.4, 1.8] }
    ],
    books: [
      {
        titleZh: "你想活出怎樣的人生",
        titleEn: "How Do You Live?",
        author: "吉野源三郎 Genzaburo Yoshino",
        tagZh: "獨立思考與承擔",
        callNumber: "[索書號待填]",
        excerptZh: "「真正珍貴的不是順著別人的期待走，而是在經歷猶豫與犯錯後，親自思考出問心無愧的答案。」"
      },
      {
        titleZh: "牧羊少年奇幻之旅",
        titleEn: "The Alchemist",
        author: "保羅・科爾賀 Paulo Coelho",
        tagZh: "傾聽價值羅盤",
        callNumber: "[索書號待填]",
        excerptZh: "「害怕受苦往往比受苦本身更折磨人；當你清楚心中的方向，每一步探索都不會白費。」"
      },
      {
        titleZh: "深夜圖書館",
        titleEn: "The Midnight Library",
        author: "麥特・海格 Matt Haig",
        tagZh: "放下後悔與選擇當下",
        callNumber: "[索書號待填]",
        excerptZh: "「我們不必看清整條人生的終點才能出發，只需要活好眼前這一頁真實的可能性。」"
      }
    ],
    reflectionPromptZh: "最近你正面臨什麼大大小小的選擇？如果拿掉「怕別人失望」的顧慮，你最在意的核心價值是什麼？"
  }
];

export const MOOD_PRESETS = [
  {
    id: "anxious",
    swatch: "#4F735B",
    titleZh: "考前緊繃・思緒停不下來",
    titleEn: "Tense & Overwhelmed",
    descZh: "待辦事項太多、心浮氣躁，想讓大腦慢下來深呼吸。",
    descEn: "Too many tasks and racing thoughts; ready to breathe and steady the pace.",
    islandId: "treehouse",
    destLabelZh: "前往 02 呼吸樹屋 · 小熊巴尼"
  },
  {
    id: "low",
    swatch: "#679296",
    titleZh: "有點低落・想被溫柔接住",
    titleEn: "Low Energy & Tired",
    descZh: "說不上來為什麼累或悶悶的，想安靜泡在書頁裡充電。",
    descEn: "Feeling heavy or drained; looking for gentle acceptance without judgment.",
    islandId: "cove",
    destLabelZh: "前往 01 靜心水岸 · 水豚卡皮"
  },
  {
    id: "empathy",
    swatch: "#739476",
    titleZh: "覺得孤單・想在故事裡找共鳴",
    titleEn: "Seeking Resonance & Warmth",
    descZh: "想透過溫暖的小說與人物故事，感受被理解的連結。",
    descEn: "Longing to feel understood through heartfelt stories and human perspectives.",
    islandId: "glasshouse",
    destLabelZh: "前往 03 暖陽溫室 · 垂耳兔米米"
  },
  {
    id: "relationship",
    swatch: "#E6A145",
    titleZh: "人際卡關・不知道怎麼開口",
    titleEn: "Friendship & Boundary Knots",
    descZh: "在意朋友或家人的想法，想練習表達感受與舒服的界線。",
    descEn: "Navigating friendships, misunderstandings, or healthy personal boundaries.",
    islandId: "courtyard",
    destLabelZh: "前往 04 營火庭園 · 小狐狸緋緋"
  },
  {
    id: "lost",
    swatch: "#526B7A",
    titleZh: "對未來迷惘・做決定好難",
    titleEn: "At a Crossroads",
    descZh: "站在選擇的岔路口，想找回自己的價值羅盤與勇氣。",
    descEn: "Facing choices about future paths and searching for clarity and courage.",
    islandId: "lighthouse",
    destLabelZh: "前往 05 觀星燈塔 · 小鹿諾亞"
  },
  {
    id: "curious",
    swatch: "#B9936C",
    titleZh: "平靜放鬆・想隨意逛逛找靈感",
    titleEn: "Calm & Curious",
    descZh: "心情不錯，想從中央總館出發漫遊整座森嶼書屋！",
    descEn: "Feeling peaceful and ready to wander across the reading archipelago.",
    islandId: "atrium",
    destLabelZh: "前往 00 晨光總館 · 貓頭鷹歐利"
  }
];

export const BOOK_FLOWS = [
  {
    id: "flow-1",
    from: "atrium",
    to: "cove",
    cargoZh: "療癒繪本《小王子》",
    cargoEn: "The Little Prince",
    courierColor: 0xd8b384,
    noteZh: "總館將心情繪本送往「靜心水岸」，陪伴讀者安頓情緒"
  },
  {
    id: "flow-2",
    from: "atrium",
    to: "treehouse",
    cargoZh: "正念呼吸練習卡",
    cargoEn: "Breathing Guide Cards",
    courierColor: 0x8fb096,
    noteZh: "總館將呼吸練習卡送往「呼吸樹屋」，支援考前減壓閱讀"
  },
  {
    id: "flow-3",
    from: "atrium",
    to: "glasshouse",
    cargoZh: "多元視角小說箱",
    cargoEn: "Empathy Story Box",
    courierColor: 0xe6c39c,
    noteZh: "總館與「暖陽溫室」交換共讀書箱，開啟換位思考書展"
  },
  {
    id: "flow-4",
    from: "atrium",
    to: "courtyard",
    cargoZh: "暖心漂書明信片",
    cargoEn: "Gratitude Bookmarks",
    courierColor: 0xe39b56,
    noteZh: "讀者手寫的感謝書籤正送往「營火庭園」共讀茶席"
  },
  {
    id: "flow-5",
    from: "atrium",
    to: "lighthouse",
    cargoZh: "生涯探索書單",
    cargoEn: "Compass Reading List",
    courierColor: 0x8da6b5,
    noteZh: "總館將哲學與生涯選書送往「觀星燈塔」領航書閣"
  },
  {
    id: "flow-6",
    from: "cove",
    to: "treehouse",
    cargoZh: "情緒覺察→安定呼吸",
    cargoEn: "Awareness to Calm",
    courierColor: 0xa6c4bc,
    noteZh: "覺察當下感受後，將心情筆記傳遞至樹屋進行正念安定"
  }
];

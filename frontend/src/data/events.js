// Mock/seed event data, ported from the original static prototype.
// Once the backend's /api/running-order, /api/dashboard, etc. endpoints are
// fleshed out beyond their current stub `getStatus` handlers, replace this
// with calls through src/services/api.js instead of importing this directly.

export function createSeedEvents() {
  return [
    {
      id: 1, name: "Majlis Santapan Diraja Johor",
      type: "Annual Royal Banquet — State Protocol Grade I",
      date: "15 Jun 2026", venue: "Istana Besar", status: "live", docs: 4,
      running_order: [
        { time: "18:00–18:15", dur: "15m", activity: "Guest Assembly & Registration", loc: "Main Foyer", role: "Ground Usher / Reception", status: "passed" },
        { time: "18:15–18:30", dur: "15m", activity: "VIP Arrival & Escort to Hall", loc: "South Portico", role: "Protocol Officer", status: "passed" },
        { time: "18:30–18:45", dur: "15m", activity: "DYMM Sultan Arrival — State Honours", loc: "Grand Entrance", role: "Protocol Officer & VVIP Escort", status: "on-air" },
        { time: "18:45–19:00", dur: "15m", activity: "Recitation of Doa", loc: "Main Dewan", role: "Emcee / Religious Affairs", status: "next" },
        { time: "19:00–19:30", dur: "30m", activity: "Royal Address", loc: "Main Dewan", role: "Stage Manager / Teleprompter", status: "pending" },
        { time: "19:30–21:00", dur: "90m", activity: "State Banquet Dinner", loc: "Main Dewan", role: "All Protocol Officers", status: "pending" },
      ],
      vips: [
        { name: "DYMM Sultan Ibrahim", title: "Sultan of Johor", category: "royalty", rank: 1, status: "arrived" },
        { name: "YAB Menteri Besar Johor", title: "Chief Minister of Johor", category: "vvip", rank: 2, status: "confirmed" },
        { name: "YB Datuk Onn Ibrahim", title: "State Secretary", category: "vip", rank: 3, status: "confirmed" },
        { name: "Tan Sri Razali Hassan", title: "Chairman, IRDA", category: "vip", rank: 4, status: "invited" },
        { name: "YBhg. Dato' Faizal", title: "Director General, SUKJ", category: "official", rank: 5, status: "confirmed" },
        { name: "Puan Sri Rohani Ahmad", title: "Head, Royal Protocol", category: "official", rank: 6, status: "confirmed" },
      ],
      sources: [
        { name: "Johor_State_Protocol_G…", size: "2.4 MB", status: "parsed", type: "pdf" },
        { name: "VVIP_SeatingPriorities…", size: "48 KB", status: "parsed", type: "pdf" },
        { name: "Royal_Aide_Briefing_No…", size: "1.1 MB", status: "processing", type: "pdf" },
        { name: "Convoy_Arrival_Schedul…", size: "92 KB", status: "parsed", type: "pdf" },
      ],
      seating: {
        rows: [
          [{ label: "DYMM\nSultan", cat: "royalty" }, { label: "Raja\nPermaisuri", cat: "royalty" }, { label: "Tengku\nMahkota", cat: "royalty" }],
          [{ label: "Menteri\nBesar", cat: "vvip" }, { label: "YB\nDatuk", cat: "vip" }, { label: "", cat: "empty" }, { label: "Tan Sri\nRazali", cat: "vip" }, { label: "YB\nSetiausaha", cat: "vip" }],
          [{ label: "Dir.\nGen.", cat: "official" }, { label: "Official", cat: "official" }, { label: "", cat: "empty" }, { label: "", cat: "empty" }, { label: "Official", cat: "official" }, { label: "Dir.\nGen.", cat: "official" }],
        ],
      },
      traffic: {
        route: ["Istana Bukit Serene", "Jalan Skudai", "Jalan Air Molek", "Istana Besar"],
        eta_mins: 22, distance: "14.3 km", convoy_size: 7,
      },
      ai_context: "You are an AI assistant for the Majlis Santapan Diraja Johor, a live royal state banquet at Istana Besar on 15 June 2026. The event is currently ON AIR — Sultan has just arrived. Running order is in progress. Answer concisely and assist with protocol, timing adjustments, VIP arrangements, and emergency decisions.",
    },
    {
      id: 2, name: "Hari Keputeraan Sultan Ibrahim",
      type: "Royal Birthday Parade & Public Address Ceremony",
      date: "22 Jun 2026", venue: "Dataran Bandaraya JB", status: "draft", docs: 2,
      running_order: [
        { time: "08:00–08:30", dur: "30m", activity: "Guard of Honour Assembly", loc: "Dataran Bandaraya", role: "Military Protocol", status: "pending" },
        { time: "08:30–09:00", dur: "30m", activity: "Public Assembly & Seating", loc: "Grandstand", role: "Ushers / Ground Team", status: "pending" },
        { time: "09:00–09:15", dur: "15m", activity: "Royal Procession", loc: "Main Road", role: "Protocol Officer", status: "pending" },
        { time: "09:15–09:45", dur: "30m", activity: "Inspection of Guard", loc: "Dataran", role: "Sultan & Military Cmdr", status: "pending" },
        { time: "09:45–10:15", dur: "30m", activity: "Royal Birthday Address", loc: "Main Stage", role: "Stage Manager", status: "pending" },
        { time: "10:15–10:45", dur: "30m", activity: "Cultural Performances", loc: "Main Stage", role: "Arts & Cultural Unit", status: "pending" },
      ],
      vips: [
        { name: "DYMM Sultan Ibrahim", title: "Sultan of Johor", category: "royalty", rank: 1, status: "confirmed" },
        { name: "YAM Tengku Mahkota", title: "Crown Prince of Johor", category: "royalty", rank: 2, status: "confirmed" },
        { name: "YAB Menteri Besar", title: "Chief Minister", category: "vvip", rank: 3, status: "invited" },
      ],
      sources: [
        { name: "Birthday_Parade_Brief…", size: "820 KB", status: "parsed", type: "pdf" },
        { name: "Traffic_Diversion_Plan…", size: "1.4 MB", status: "parsed", type: "docx" },
      ],
      seating: {
        rows: [
          [{ label: "DYMM\nSultan", cat: "royalty" }, { label: "Tengku\nMahkota", cat: "royalty" }],
          [{ label: "Menteri\nBesar", cat: "vvip" }, { label: "", cat: "empty" }, { label: "YB\nDatuk", cat: "vip" }],
        ],
      },
      traffic: { route: ["Istana Bukit Serene", "Jalan Tun Abdul Razak", "Dataran Bandaraya JB"], eta_mins: 18, distance: "9.2 km", convoy_size: 11 },
      ai_context: "You are an AI assistant for Hari Keputeraan Sultan Ibrahim on 22 June 2026 at Dataran Bandaraya JB. This is currently a draft event in planning phase. Help with parade logistics, VIP protocol, guard of honour arrangements, and ceremony scheduling.",
    },
    {
      id: 3, name: "International Tech Summit 2026",
      type: "Ministerial-Grade Regional Technology Forum — ASEAN Delegates",
      date: "10 Jul 2026", venue: "Persada Johor International Convention Centre", status: "draft", docs: 1,
      running_order: [
        { time: "08:30–09:00", dur: "30m", activity: "Delegate Registration", loc: "Main Lobby", role: "Registration Desk Team", status: "pending" },
        { time: "09:00–09:30", dur: "30m", activity: "Ministerial Arrival & Escort", loc: "VIP Entrance", role: "Protocol Officer", status: "pending" },
        { time: "09:30–10:00", dur: "30m", activity: "Opening Ceremony", loc: "Main Hall", role: "Emcee", status: "pending" },
        { time: "10:00–11:30", dur: "90m", activity: "Keynote: AI & Regional Economy", loc: "Main Hall", role: "Stage Manager", status: "pending" },
        { time: "11:30–12:00", dur: "30m", activity: "Panel Discussion", loc: "Main Hall", role: "Moderator", status: "pending" },
      ],
      vips: [
        { name: "YB Minister of Digital", title: "Minister, MOSTI", category: "vvip", rank: 1, status: "invited" },
        { name: "ASEAN Tech Director", title: "ASEAN Secretariat", category: "vip", rank: 2, status: "invited" },
        { name: "Dr. Lim Wei Keong", title: "CEO, Johor Digital Economy", category: "official", rank: 3, status: "confirmed" },
      ],
      sources: [
        { name: "Tech_Summit_Programme…", size: "540 KB", status: "parsed", type: "pdf" },
      ],
      seating: {
        rows: [
          [{ label: "Minister\nMOSTI", cat: "vvip" }, { label: "ASEAN\nDirector", cat: "vip" }, { label: "Dr.\nLim", cat: "official" }],
          [{ label: "", cat: "empty" }, { label: "Delegate", cat: "official" }, { label: "Delegate", cat: "official" }, { label: "Delegate", cat: "official" }],
        ],
      },
      traffic: { route: ["KLIA2", "Lebuhraya Utara-Selatan", "Persada JICC"], eta_mins: 35, distance: "52 km", convoy_size: 3 },
      ai_context: "You are an AI assistant for the International Tech Summit 2026 at Persada Johor ICC on 10 July 2026. This is a ministerial-grade ASEAN technology forum in planning stage. Help with delegate management, session scheduling, and ministerial protocol.",
    },
    {
      id: 4, name: "Majlis Konvokesyen UTM",
      type: "University Convocation Ceremony — Chancellor Presiding",
      date: "3 Aug 2026", venue: "Dewan Sultan Iskander", status: "completed", docs: 6,
      running_order: [
        { time: "08:00–08:30", dur: "30m", activity: "Academic Procession Assembly", loc: "Foyer", role: "Academic Registrar", status: "passed" },
        { time: "08:30–09:00", dur: "30m", activity: "Chancellor Arrival", loc: "Main Entrance", role: "Protocol Officer", status: "passed" },
        { time: "09:00–09:30", dur: "30m", activity: "Opening of Convocation", loc: "Dewan", role: "Emcee / Registrar", status: "passed" },
        { time: "09:30–12:00", dur: "150m", activity: "Conferment of Degrees", loc: "Dewan", role: "Chancellor & Dean", status: "passed" },
        { time: "12:00–12:15", dur: "15m", activity: "Closing & Recession", loc: "Dewan", role: "Emcee", status: "passed" },
      ],
      vips: [
        { name: "DYMM Sultan Ibrahim", title: "Chancellor, UTM", category: "royalty", rank: 1, status: "arrived" },
        { name: "Prof. Dr. Ahmad Fauzi", title: "Vice-Chancellor, UTM", category: "vvip", rank: 2, status: "arrived" },
        { name: "YB Minister of Edu.", title: "Minister, MOE", category: "vip", rank: 3, status: "arrived" },
      ],
      sources: [
        { name: "Convocation_Runsheet…", size: "1.1 MB", status: "parsed", type: "pdf" },
        { name: "Degree_Recipients_List…", size: "3.8 MB", status: "parsed", type: "pdf" },
        { name: "Academic_Protocol_Gu…", size: "740 KB", status: "parsed", type: "pdf" },
        { name: "Chancellor_Briefing…", size: "890 KB", status: "parsed", type: "pdf" },
        { name: "Venue_FloorPlan_DSI…", size: "2.1 MB", status: "parsed", type: "pdf" },
        { name: "AV_Technical_Rider…", size: "340 KB", status: "parsed", type: "docx" },
      ],
      seating: {
        rows: [
          [{ label: "Chancellor\nSultan", cat: "royalty" }, { label: "VC\nProf.", cat: "vvip" }],
          [{ label: "Minister\nMOE", cat: "vip" }, { label: "Dean\nEngg", cat: "official" }, { label: "Dean\nSci", cat: "official" }],
          [{ label: "Registrar", cat: "official" }, { label: "", cat: "empty" }, { label: "Bursar", cat: "official" }],
        ],
      },
      traffic: { route: ["Istana Bukit Serene", "Lebuhraya Pasir Gudang", "UTM Campus"], eta_mins: 28, distance: "18.7 km", convoy_size: 5 },
      ai_context: "You are an AI assistant for the Majlis Konvokesyen UTM, which has been completed on 3 August 2026. Help review the event, answer questions about what occurred, and assist with post-event documentation and reporting.",
    },
  ];
}

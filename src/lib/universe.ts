import type { StockMeta, Exchange, Region, Sector } from "./types";
import { INDIAN_STOCKS } from "./indianStocks";

export const VIRTUAL_UNIVERSE_SIZE = 90_000_000_000_000;

const US_STOCKS: [string, string, Sector][] = [
  ["AAPL", "Apple Inc", "Technology"], ["MSFT", "Microsoft Corp", "Technology"],
  ["GOOGL", "Alphabet Inc", "Technology"], ["AMZN", "Amazon.com Inc", "ECommerce"],
  ["META", "Meta Platforms Inc", "Communication"], ["NVDA", "NVIDIA Corp", "Semiconductors"],
  ["TSLA", "Tesla Inc", "EV"], ["JPM", "JPMorgan Chase & Co", "Finance"],
  ["V", "Visa Inc", "Finance"], ["JNJ", "Johnson & Johnson", "Healthcare"],
  ["WMT", "Walmart Inc", "Retail"], ["MA", "Mastercard Inc", "Finance"],
  ["PG", "Procter & Gamble Co", "Consumer"], ["UNH", "UnitedHealth Group", "Healthcare"],
  ["HD", "Home Depot Inc", "Retail"], ["DIS", "Walt Disney Co", "Media"],
  ["BAC", "Bank of America Corp", "Finance"], ["XOM", "Exxon Mobil Corp", "Energy"],
  ["PFE", "Pfizer Inc", "Pharma"], ["KO", "Coca-Cola Co", "Consumer"],
  ["PEP", "PepsiCo Inc", "Food"], ["INTC", "Intel Corp", "Semiconductors"],
  ["CSCO", "Cisco Systems Inc", "Technology"], ["ORCL", "Oracle Corp", "Technology"],
  ["ADBE", "Adobe Inc", "Technology"], ["NFLX", "Netflix Inc", "Media"],
  ["CRM", "Salesforce Inc", "Technology"], ["AMD", "Advanced Micro Devices", "Semiconductors"],
  ["AVGO", "Broadcom Inc", "Semiconductors"], ["COST", "Costco Wholesale Corp", "Retail"],
  ["TMO", "Thermo Fisher Scientific", "Healthcare"], ["ABT", "Abbott Laboratories", "Healthcare"],
  ["NKE", "Nike Inc", "Consumer"], ["MRK", "Merck & Co Inc", "Pharma"],
  ["QCOM", "Qualcomm Inc", "Semiconductors"], ["TXN", "Texas Instruments", "Semiconductors"],
  ["IBM", "IBM Corp", "Technology"], ["GS", "Goldman Sachs Group", "Finance"],
  ["MS", "Morgan Stanley", "Finance"], ["CVX", "Chevron Corp", "Energy"],
  ["BA", "Boeing Co", "Aerospace"], ["CAT", "Caterpillar Inc", "Industrial"],
  ["GE", "General Electric Co", "Industrial"], ["F", "Ford Motor Co", "Automotive"],
  ["GM", "General Motors Co", "Automotive"], ["C", "Citigroup Inc", "Finance"],
  ["WFC", "Wells Fargo & Co", "Finance"], ["PYPL", "PayPal Holdings", "Fintech"],
  ["UBER", "Uber Technologies", "Travel"], ["ABNB", "Airbnb Inc", "RealEstate"],
  ["SHOP", "Shopify Inc", "ECommerce"], ["SQ", "Block Inc", "Fintech"],
  ["SNOW", "Snowflake Inc", "CloudComputing"], ["PLTR", "Palantir Technologies", "AI"],
  ["CRWD", "CrowdStrike Holdings", "Cybersecurity"], ["NET", "Cloudflare Inc", "Cybersecurity"],
  ["ZM", "Zoom Video Communications", "Technology"], ["COIN", "Coinbase Global", "Fintech"],
  ["HOOD", "Robinhood Markets", "Fintech"], ["DASH", "DoorDash Inc", "ECommerce"],
  ["PLUG", "Plug Power Inc", "RenewableEnergy"], ["ENPH", "Enphase Energy Inc", "RenewableEnergy"],
  ["FSLR", "First Solar Inc", "RenewableEnergy"], ["MRVL", "Marvell Technology", "Semiconductors"],
  ["MU", "Micron Technology", "Semiconductors"], ["LRCX", "Lam Research Corp", "Semiconductors"],
  ["AMAT", "Applied Materials", "Semiconductors"], ["KLAC", "KLA Corp", "Semiconductors"],
  ["ADI", "Analog Devices Inc", "Semiconductors"], ["NXPI", "NXP Semiconductors", "Semiconductors"],
  ["GILD", "Gilead Sciences Inc", "Pharma"], ["AMGN", "Amgen Inc", "Pharma"],
  ["LLY", "Eli Lilly & Co", "Pharma"], ["ABBV", "AbbVie Inc", "Pharma"],
  ["MCD", "McDonald's Corp", "Food"], ["SBUX", "Starbucks Corp", "Food"],
  ["CMG", "Chipotle Mexican Grill", "Food"], ["LOW", "Lowe's Companies", "Retail"],
  ["TGT", "Target Corp", "Retail"], ["TJX", "TJX Companies Inc", "Retail"],
  ["LMT", "Lockheed Martin Corp", "Defense"], ["RTX", "RTX Corp", "Defense"],
  ["NOC", "Northrop Grumman Corp", "Defense"], ["GD", "General Dynamics Corp", "Defense"],
  ["UPS", "United Parcel Service", "Logistics"], ["FDX", "FedEx Corp", "Logistics"],
  ["UNP", "Union Pacific Corp", "Logistics"], ["DAL", "Delta Air Lines", "Travel"],
  ["UAL", "United Airlines Holdings", "Travel"], ["LUV", "Southwest Airlines", "Travel"],
  ["MAR", "Marriott International", "Travel"], ["BKNG", "Booking Holdings", "Travel"],
  ["SPGI", "S&P Global Inc", "Finance"], ["MCO", "Moody's Corp", "Finance"],
  ["ICE", "Intercontinental Exchange", "Finance"], ["CME", "CME Group Inc", "Finance"],
  ["NDAQ", "Nasdaq Inc", "Finance"], ["MDT", "Medtronic plc", "Healthcare"],
  ["ISRG", "Intuitive Surgical Inc", "Healthcare"], ["SYK", "Stryker Corp", "Healthcare"],
  ["BSX", "Boston Scientific Corp", "Healthcare"], ["NEM", "Newmont Corp", "Mining"],
  ["FCX", "Freeport-McMoRan Inc", "Mining"], ["NUE", "Nucor Corp", "Steel"],
  ["SHW", "Sherwin-Williams Co", "Materials"], ["PPG", "PPG Industries Inc", "Materials"],
  ["LYB", "LyondellBasell Industries", "Materials"], ["ECL", "ECOLAB Inc", "Materials"],
  ["APD", "Air Products & Chemicals", "Materials"], ["NEM2", "Newmont Goldcorp", "Mining"],
  ["RIO", "Rio Tinto Group", "Mining"], ["BHP", "BHP Group Ltd", "Mining"],
  ["MMM", "3M Co", "Industrial"], ["HON", "Honeywell International", "Industrial"],
  ["ROK", "Rockwell Automation", "Industrial"], ["PH", "Parker-Hannifin Corp", "Industrial"],
  ["ITW", "Illinois Tool Works", "Industrial"], ["EMR", "Emerson Electric", "Industrial"],
  ["DOV", "Dover Corp", "Industrial"], ["ETN", "Eaton Corp", "Industrial"],
  ["FLS", "Flowserve Corp", "Industrial"], ["GWW", "W.W. Grainger Inc", "Industrial"],
  ["FAST", "Fastenal Co", "Industrial"], ["XYL", "Xylem Inc", "Industrial"],
  ["PNR", "Pentair plc", "Industrial"], ["SPXC", "SPX Technologies", "Industrial"],
  ["B", "Baker Hughes Co", "Energy"], ["SLB", "Schlumberger NV", "Energy"],
  ["HAL", "Halliburton Co", "Energy"], ["NOV", "NOV Inc", "Energy"],
  ["WMB", "Williams Companies", "Energy"], ["KMI", "Kinder Morgan", "Energy"],
  ["EPAM", "EPAM Systems", "Technology"], ["GLOB", "Globant SA", "Technology"],
  ["WIT", "Wipro Ltd ADR", "Technology"], ["INFY2", "Infosys ADR", "Technology"],
  ["VECO", "Veeco Instruments", "Semiconductors"], ["ONTI", "Onto Innovation", "Semiconductors"],
  ["UCTT", "Ultra Clean Holdings", "Semiconductors"], ["ACMR", "ACM Research", "Semiconductors"],
  ["CAMT", "Camtek Ltd", "Semiconductors"], ["KRNT", "Kornit Digital", "Industrial"],
  ["PLAB", "Photronics Inc", "Semiconductors"], ["OSIS", "OSI Systems", "Technology"],
  ["FN", "Fabrinet", "Industrial"], ["IPG", "IPG Photonics", "Industrial"],
  ["COHR", "Coherent Corp", "Industrial"], ["LITE", "Lumentum Holdings", "Industrial"],
  ["AAOI", "Applied Optoelectronics", "Industrial"], ["NLTX", "Neoleukin Therapeutics", "Biotech"],
  ["VRDN", "Veraderm Sciences", "Pharma"], ["DNLI", "Denali Therapeutics", "Biotech"],
  ["SRNE", "Sorrento Therapeutics", "Biotech"], ["RCKT", "Rocket Pharmaceuticals", "Biotech"],
  ["PTGX", "Protagonist Therapeutics", "Biotech"], ["ARWR", "Arrowhead Pharmaceuticals", "Biotech"],
  ["DRNA", "Dicerna Pharmaceuticals", "Biotech"], ["ALNY", "Alnylam Pharmaceuticals", "Biotech"],
  ["BMRN", "BioMarin Pharmaceutical", "Biotech"], ["BLUE", "bluebird bio", "Biotech"],
  ["CRSP", "CRISPR Therapeutics", "Biotech"], ["EDIT", "Editas Medicine", "Biotech"],
  ["NTLA", "Intellia Therapeutics", "Biotech"], ["BEAM", "Beam Therapeutics", "Biotech"],
  ["PRME", "Prime Medicine", "Biotech"], ["VRTX", "Vertex Pharmaceuticals", "Pharma"],
  ["BMY", "Bristol-Myers Squibb", "Pharma"], ["SNY", "Sanofi ADR", "Pharma"],
  ["NVS", "Novartis ADR", "Pharma"], ["AZN", "AstraZeneca ADR", "Pharma"],
  ["GSK", "GSK plc ADR", "Pharma"], ["ROG", "Roche ADR", "Pharma"],
];

const GLOBAL_STOCKS: [string, string, Sector, Region, Exchange][] = [
  ["TM", "Toyota Motor Corp", "Automotive", "Japan", "TSE"],
  ["SNE", "Sony Group Corp", "Technology", "Japan", "TSE"],
  ["NTDOY", "Nintendo Co Ltd", "Gaming", "Japan", "TSE"],
  ["005930", "Samsung Electronics", "Semiconductors", "Korea", "KRX"],
  ["TSM", "Taiwan Semiconductor", "Semiconductors", "Taiwan", "TPEX"],
  ["HSBC", "HSBC Holdings plc", "Finance", "HongKong", "HKEX"],
  ["TTE", "TotalEnergies SE", "Energy", "Europe", "EURONEXT"],
  ["SHEL", "Shell plc", "Energy", "Europe", "LSE"],
  ["SAP", "SAP SE", "Technology", "Germany", "XETR"],
  ["SIE", "Siemens AG", "Industrial", "Germany", "XETR"],
  ["AIR", "Airbus SE", "Aerospace", "Europe", "EURONEXT"],
  ["MC", "LVMH Moet Hennessy", "Consumer", "France", "EURONEXT"],
  ["OR", "L'Oreal SA", "Consumer", "France", "EURONEXT"],
  ["NESN", "Nestle SA", "Food", "Switzerland", "SIX"],
  ["NOVN", "Novartis AG", "Pharma", "Switzerland", "SIX"],
  ["ROG", "Roche Holding AG", "Pharma", "Switzerland", "SIX"],
  ["ASML", "ASML Holding NV", "Semiconductors", "Europe", "EURONEXT"],
  ["ING", "ING Groep NV", "Finance", "Netherlands", "EURONEXT"],
  ["CBA", "Commonwealth Bank of Australia", "Finance", "Australia", "ASX"],
  ["CSL", "CSL Limited", "Healthcare", "Australia", "ASX"],
  ["BABA", "Alibaba Group", "ECommerce", "China", "HKEX"],
  ["TCEHY", "Tencent Holdings", "Technology", "China", "HKEX"],
  ["PDD", "PDD Holdings Inc", "ECommerce", "China", "NASDAQ"],
  ["JD", "JD.com Inc", "ECommerce", "China", "NASDAQ"],
  ["BIDU", "Baidu Inc", "Technology", "China", "NASDAQ"],
  ["NIO", "NIO Inc", "EV", "China", "NYSE"],
  ["XPEV", "XPeng Inc", "EV", "China", "NYSE"],
  ["LI", "Li Auto Inc", "EV", "China", "NASDAQ"],
  ["SE", "Sea Limited", "ECommerce", "Singapore", "SGX"],
  ["DBS", "DBS Group Holdings", "Finance", "Singapore", "SGX"],
  ["VALE", "Vale SA", "Mining", "Brazil", "BVMF"],
  ["PETR4", "Petrobras", "Energy", "Brazil", "BVMF"],
  ["ABEV", "Ambev SA", "Consumer", "Brazil", "BVMF"],
  ["ITUB", "Itau Unibanco", "Finance", "Brazil", "BVMF"],
  ["2222", "Saudi Aramco", "Energy", "SaudiArabia", "TADAWUL"],
  ["THYAO", "Turkish Airlines", "Travel", "Turkey", "BIST"],
  ["BBCA", "Bank Central Asia", "Finance", "Indonesia", "IDX"],
  ["PTT", "PTT Public Co", "Energy", "Thailand", "SET"],
  ["MBB", "Maybank", "Finance", "Malaysia", "KLSE"],
  ["JFC", "Jollibee Foods", "Food", "Philippines", "PSE"],
  ["VNM", "Vinamilk", "Food", "Vietnam", "HOSE"],
  ["600519", "Kweichow Moutai", "Consumer", "China", "SSE"],
  ["601318", "Ping An Insurance", "Finance", "China", "SSE"],
  ["601398", "ICBC", "Finance", "China", "SSE"],
  ["002594", "BYD Co Ltd", "EV", "China", "SSE"],
  ["5880", "AIA Group Ltd", "Finance", "HongKong", "HKEX"],
  ["9988", "Alibaba Group", "ECommerce", "China", "HKEX"],
  ["3690", "Meituan", "ECommerce", "China", "HKEX"],
  ["1810", "Xiaomi Corp", "Technology", "China", "HKEX"],
  ["2317", "Foxconn Technology", "Semiconductors", "Taiwan", "TPEX"],
  ["2454", "MediaTek Inc", "Semiconductors", "Taiwan", "TPEX"],
];

const REGIONS: { region: Region; prefix: string; roots: string[] }[] = [
  { region: "India", prefix: "IN", roots: ["Bharat", "Indic", "Hindustan", "Arya", "Vedic", "Navya", "Surya", "Prithvi", "Akash", "Vayu", "Agni", "Jal", "Tej", "Ojas", "Tapas"] },
  { region: "USA", prefix: "US", roots: ["Ameri", "Global", "Prime", "Apex", "Vertex", "Summit", "Pioneer", "Frontier", "Liberty", "Eagle", "Hawk", "Falcon", "Condor", "Raven", "Phoenix"] },
  { region: "Europe", prefix: "EU", roots: ["Euro", "Nordic", "Alpine", "Rhein", "Iberia", "Gaul", "Britan", "Hiber", "Vene", "Lombard", "Tuscan", "Norman", "Celtic", "Saxon", "Viking"] },
  { region: "Japan", prefix: "JP", roots: ["Nihon", "Zen", "Sakura", "Fuji", "Kanto", "Kansai", "Tokai", "Hokkai", "Kyushu", "Shikoku", "Tohoku", "Chubu", "Setouchi", "Sanin", "Sanjo"] },
  { region: "China", prefix: "CN", roots: ["Hua", "Long", "Tian", "Shen", "Jin", "Yu", "Xiang", "Hai", "Jiang", "Shan", "He", "Yun", "Feng", "Xue", "Yue"] },
  { region: "HongKong", prefix: "HK", roots: ["Hong", "Kowloon", "Victoria", "Pearl", "Orient", "Jade", "Dragon", "Lotus", "Bauhinia", "Harbor", "Central", "Admiralty", "Wanchai", "Tsim", "Mong"] },
  { region: "Australia", prefix: "AU", roots: ["Aussie", "Outback", "Coral", "Kangaroo", "Wallaby", "Koala", "Emu", "Platypus", "Kookaburra", "Boomerang", "Didgeridoo", "Billabong", "Bushland", "Reef", "Sunset"] },
  { region: "Canada", prefix: "CA", roots: ["Maple", "Northwind", "Aurora", "Frontier", "Tundra", "Beaver", "Moose", "Loon", "Canuck", "TrueNorth", "StrongFree", "Rocky", "Pacific", "Atlantic", "Prairie"] },
  { region: "Korea", prefix: "KR", roots: ["Han", "Kyo", "Sae", "Jin", "Myung", "Dong", "Seoul", "Busan", "Incheon", "Daegu", "Gwangju", "Daejeon", "Ulsan", "Jeju", "Suwon"] },
  { region: "Taiwan", prefix: "TW", roots: ["Tai", "Formosa", "Yushan", "Taroko", "SunMoon", "Kenting", "Alishan", "Penghu", "Kinmen", "Matsu", "Taitung", "Hualien", "Nantou", "Chiayi", "Pingtung"] },
  { region: "Singapore", prefix: "SG", roots: ["Singa", "Merlion", "Lion", "Marina", "Sentosa", "Orchard", "Raffles", "Bukit", "Tanjong", "Changi", "Jurong", "Woodlands", "Tampines", "Pasir", "Punggol"] },
  { region: "Brazil", prefix: "BR", roots: ["Brasil", "Amazon", "Carnival", "Samba", "Tropical", "Cerrado", "Pantanal", "Ipanema", "Copacabana", "Tijuca", "Iguacu", "Caatinga", "Pampas", "Atlantis", "Cristal"] },
  { region: "Mexico", prefix: "MX", roots: ["Mexica", "Aztec", "Maya", "Olme", "Tolte", "Zapote", "Mixte", "Tarasco", "Chichime", "Purepe", "Huicho", "Tarahuma", "Yaqui", "Mayo", "Opata"] },
  { region: "SouthAfrica", prefix: "ZA", roots: ["Ubuntu", "Buntu", "Madiba", "Springbok", "Protea", "Jacaranda", "Baobab", "Acacia", "Savanna", "Veld", "Karoo", "Highveld", "Lowveld", "Bushveld", "Coastal"] },
  { region: "SaudiArabia", prefix: "SA", roots: ["Saudi", "Najd", "Hijaz", "Asir", "EmptyQuarter", "RubAlKhali", "Dahna", "Hejaz", "Tiham", "Nejd", "Yamama", "Qassim", "Hail", "Jizan", "Najran"] },
  { region: "UAE", prefix: "AE", roots: ["Emir", "Dubai", "AbuDhabi", "Sharjah", "Ajman", "Fujair", "RasAl", "UmmAl", "Liwa", "AlAin", "Ruwais", "Jebel", "Khalifa", "Yas", "Saadiyat"] },
  { region: "Turkey", prefix: "TR", roots: ["Turk", "Anatolia", "Bosphorus", "Marmara", "Aegean", "Med", "BlackSea", "Cappadocia", "Pamukkale", "Konya", "Antalya", "Izmir", "Bursa", "Edirne", "Trabzon"] },
  { region: "Indonesia", prefix: "ID", roots: ["Nusa", "Garuda", "Komodo", "Bali", "Java", "Sumatra", "Kalimantan", "Sulawesi", "Papua", "Maluku", "Lombok", "Flores", "Sumbawa", "Sumba", "Timor"] },
  { region: "Thailand", prefix: "TH", roots: ["Thai", "Siam", "Chao", "Mekong", "ChaoPhraya", "Andaman", "Gulf", "Krabi", "Phuket", "Chiang", "Isan", "Lanna", "Sukho", "Ayut", "Lop"] },
  { region: "Malaysia", prefix: "MY", roots: ["Malay", "Borneo", "Sarawak", "Sabah", "Selangor", "Johor", "Penang", "Perak", "Kedah", "Kelantan", "Terengganu", "Pahang", "Negeri", "Melaka", "Perlis"] },
  { region: "Philippines", prefix: "PH", roots: ["Pili", "Luzon", "Visayas", "Mindanao", "Palawan", "Sulu", "Panay", "Negros", "Cebu", "Bohol", "Leyte", "Samar", "Masbate", "Catanduanes", "Marinduque"] },
  { region: "Vietnam", prefix: "VN", roots: ["Viet", "Hanoi", "Saigon", "Mekong", "Red", "Halong", "Perfume", "Hue", "Danang", "Nha", "Dalat", "Phan", "Cantho", "Haiphong", "Quang"] },
  { region: "Bangladesh", prefix: "BD", roots: ["Bengal", "Padma", "Meghna", "Jamuna", "Ganges", "Sundar", "Chittagong", "Sylhet", "Rajshahi", "Khulna", "Barisal", "Rangpur", "Mymen", "Comilla", "Dinajpur"] },
  { region: "SriLanka", prefix: "LK", roots: ["Lanka", "Ceylon", "Serendib", "Pearl", "Colombo", "Kandy", "Galle", "Jaffna", "Anura", "Polon", "Sigiri", "Dambulla", "Trinco", "Negombo", "Matara"] },
  { region: "Egypt", prefix: "EG", roots: ["Nile", "Cairo", "Giza", "Alex", "Sphinx", "Pharaoh", "Pyramid", "Oasis", "Sahara", "Suez", "Aswan", "Luxor", "Thebes", "Memphis", "Saqqara"] },
  { region: "Russia", prefix: "RU", roots: ["Rus", "Siberia", "Ural", "Volga", "Don", "Lena", "Ob", "Yenisei", "Amur", "Kamchatka", "Baikal", "Caucasus", "Tundra", "Taiga", "Steppe"] },
  { region: "Poland", prefix: "PL", roots: ["Polska", "Vistula", "Warsaw", "Krakow", "Gdansk", "Wroclaw", "Poznan", "Lodz", "Lublin", "Bialystok", "Szczecin", "Katowice", "Torun", "Lubusz", "Podlasie"] },
  { region: "Sweden", prefix: "SE", roots: ["Svea", "Nord", "Malm", "Stock", "Gote", "Uppsa", "Lund", "Link", "Vaster", "Ore", "Helsing", "Norr", "Lapland", "Baltic", "Bothnian"] },
  { region: "Spain", prefix: "ES", roots: ["Iberia", "Madrid", "Barca", "Sevilla", "Valencia", "Bilbao", "Malaga", "Granada", "Cordoba", "Toledo", "Sarago", "Vallad", "Murcia", "Palma", "Vigo"] },
  { region: "Italy", prefix: "IT", roots: ["Roma", "Milano", "Napoli", "Torino", "Firenze", "Venezia", "Genova", "Bologna", "Verona", "Pisa", "Siena", "Lucca", "Perugia", "Bari", "Palermo"] },
  { region: "Germany", prefix: "DE", roots: ["Germania", "Rhein", "Elbe", "Danube", "Bavaria", "Saxony", "Prussia", "Hesse", "Ruhr", "Schwarzwald", "Bayer", "Frankfurt", "Munich", "Hamburg", "Cologne"] },
  { region: "France", prefix: "FR", roots: ["Gaul", "Seine", "Loire", "Rhone", "Brittany", "Normandy", "Provence", "Corsica", "Burgundy", "Champagne", "Aquitaine", "Languedoc", "Picardy", "Anjou", "Orleans"] },
  { region: "Netherlands", prefix: "NL", roots: ["Dutch", "Amstel", "Rhine", "Maas", "Scheldt", "Fries", "Holland", "Zeeland", "Utrecht", "Gelder", "Limburg", "Brabant", "Overijs", "Drenthe", "Gronin"] },
  { region: "Switzerland", prefix: "CH", roots: ["Helvetia", "Alps", "Rhine", "Rhone", "Ticino", "Inn", "Bern", "Zurich", "Geneva", "Basel", "Lucerne", "Lugano", "StMoritz", "Davos", "Interlaken"] },
];

const SECTORS_LIST: Sector[] = [
  "Technology", "AI", "Finance", "Healthcare", "Energy", "Consumer", "Industrial", "Materials",
  "Utilities", "RealEstate", "Communication", "Semiconductors", "EV", "Fintech", "Biotech",
  "Robotics", "CloudComputing", "Cybersecurity", "QuantumComputing", "RenewableEnergy",
  "ECommerce", "EdTech", "AgriTech", "SpaceTech", "Logistics", "Media", "Gaming", "Travel",
  "Food", "Retail", "Automotive", "Aerospace", "Defense", "Pharma", "Chemicals", "Construction",
  "Mining", "Steel", "Textiles", "Telecom",
];

const SUFFIXES = ["Corp", "Inc", "Ltd", "Group", "Holdings", "Industries", "Technologies", "Systems", "Global", "International", "Ventures", "Partners", "Solutions", "Dynamics", "Enterprises"];

function buildStocks(): StockMeta[] {
  const stocks: StockMeta[] = [];
  for (const s of INDIAN_STOCKS) {
    stocks.push({ symbol: s.sym, name: s.name, exchange: "NSE", region: "India", sector: s.sec });
  }
  for (const [sym, name, sec] of US_STOCKS) {
    stocks.push({ symbol: sym, name, exchange: sym.length <= 4 ? "NASDAQ" : "NYSE", region: "USA", sector: sec });
  }
  for (const [sym, name, sec, reg, ex] of GLOBAL_STOCKS) {
    stocks.push({ symbol: sym, name, exchange: ex, region: reg, sector: sec });
  }
  let aiCount = 0;
  const aiSectors: Sector[] = ["AI", "Robotics", "CloudComputing", "Cybersecurity", "QuantumComputing", "Biotech", "Semiconductors", "EV", "RenewableEnergy", "Fintech"];
  for (const r of REGIONS) {
    for (const root of r.roots) {
      for (const suf of SUFFIXES) {
        if (aiCount >= 1050) break;
        const sym = `${r.prefix}-AI${aiCount}`;
        const name = `${root} AI ${suf}`;
        stocks.push({ symbol: sym, name, exchange: "VIRTUAL", region: r.region, sector: aiSectors[aiCount % aiSectors.length], isAI: true });
        aiCount++;
      }
      if (aiCount >= 1050) break;
    }
    if (aiCount >= 1050) break;
  }
  return stocks;
}

export const REAL_STOCKS: StockMeta[] = buildStocks();
export const TOTAL_STOCKS = VIRTUAL_UNIVERSE_SIZE;
export const TOTAL_AI_COMPANIES = 1050;

const symbolMap = new Map<string, StockMeta>();
for (const s of REAL_STOCKS) symbolMap.set(s.symbol, s);

export function getMeta(symbol: string): StockMeta | undefined { return symbolMap.get(symbol); }

export function searchStocks(query: string, limit = 20): StockMeta[] {
  const q = query.toUpperCase();
  const results: StockMeta[] = [];
  for (const s of REAL_STOCKS) {
    if (s.symbol.includes(q) || s.name.toUpperCase().includes(q)) {
      results.push(s);
      if (results.length >= limit) return results;
    }
  }
  return results;
}

export function getStockPage(offset: number, limit: number): StockMeta[] {
  if (offset < REAL_STOCKS.length) return REAL_STOCKS.slice(offset, offset + limit);
  const page: StockMeta[] = [];
  for (let i = 0; i < limit; i++) page.push(getMetaByIndex(offset + i));
  return page;
}

export function getMetaByIndex(idx: number): StockMeta {
  if (idx < REAL_STOCKS.length) return REAL_STOCKS[idx];
  const vIdx = idx - REAL_STOCKS.length;
  const regionIdx = vIdx % REGIONS.length;
  const r = REGIONS[regionIdx];
  const secIdx = (vIdx >> 5) % SECTORS_LIST.length;
  const sec = SECTORS_LIST[secIdx];
  const sym = `V${vIdx}`;
  const name = `${r.roots[vIdx % r.roots.length]} ${SUFFIXES[vIdx % SUFFIXES.length]}`;
  return { symbol: sym, name, exchange: "VIRTUAL", region: r.region, sector: sec, isVirtual: true, index: idx };
}

export const ALL_REGIONS: Region[] = REGIONS.map((r) => r.region);
export const ALL_SECTORS: Sector[] = SECTORS_LIST;

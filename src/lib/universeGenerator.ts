import type { StockMeta, Region, Sector, Exchange } from './types';

// Programmatic universe generator — produces 30,000+ stocks across all regions
// with 500+ AI companies. Deterministic from index.

const REGIONS_DATA: { region: Region; exchange: Exchange; currency: string; prefixes: string[]; nameRoots: string[] }[] = [
  { region: 'United States', exchange: 'NASDAQ', currency: 'USD', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Technologies','Systems','Networks','Software','Holdings','Group','Industries','Capital','Ventures','Partners','Labs','Solutions','Dynamics','Electronics','Robotics','Analytics','Compute','Digital','Cyber','Quantum','Cloud','Data','AI','Smart','Future','Next','Prime','Apex','Nova','Vertex','Pinnacle','Summit','Horizon','Vanguard','Pioneer','Frontier','Catalyst','Innovate','Matrix','Fusion','Nexus','Core','Edge','Peak','Rise','Forge','Spark','Pulse','Wave','Beam','Shift','Link','Grid','Node','Hub','Port','Gate','Bridge','Path','Track','Line','Flow','Stream','Force','Drive','Motion','Power','Energy','Volt','Charge','Spark','Glow','Flare','Blaze','Flash','Bolt','Surge'] },
  { region: 'India', exchange: 'NSE', currency: 'INR', prefixes: ['T','R','I','S','A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','U','V','W','X','Y','Z'], nameRoots: ['Enterprises','Industries','Limited','Technologies','Systems','Software','Holdings','Group','Capital','Ventures','Partners','Labs','Solutions','Dynamics','Electronics','Robotics','Analytics','Compute','Digital','Cyber','Quantum','Cloud','Data','AI','Smart','Future','Next','Prime','Apex','Nova','Vertex','Infotech','Mahindra','Reliance','Tata','Birla','Wipro','Infosys','Tech','Soft','Net','Web','App','Code','Byte','Chip','Sync','Link','Grid','Hub','Port','Gate','Path','Flow','Force','Power','Energy','Volt','Glow','Blaze','Bolt','Surge','Shakti','Bharat','India','Hind','National','Global','International','Corporation','Trading','Agency','Services','Consultancy','Digital','Automation','Innovation'] },
  { region: 'Japan', exchange: 'TSE', currency: 'JPY', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Corp','Industries','Electronics','Robotics','Systems','Technologies','Holdings','Group','Capital','Partners','Labs','Solutions','Dynamics','Compute','Digital','Cyber','Quantum','Cloud','Data','AI','Smart','Future','Nova','Vertex','Denki','Kogyo','Seiki','Sangyo','Kikai','Setsubi','Kensetsu','Unyu','Tsushin','Yakuhin','Kagaku','Kinzoku','Tetsu','Sekiyu','Gasu','Denryoku','Suiso','Kensetsu','Jutaku','Fudosan','Shoken','Ginko','Hoken','Shintaku','Toshi','Kinyu','Boueki','Eigyō','Kougyou','Kenkyuu','Kaihatsu','Seizou','Hanbai','Ryutsu','Hosou','Tsushin','Joho','Sofuto','Hado','Netto','Aitemu','Saibou','Idenshi'] },
  { region: 'United Kingdom', exchange: 'LSE', currency: 'GBP', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Plc','Group','Holdings','Partners','Capital','Ventures','Systems','Technologies','Solutions','Industries','Electronics','Robotics','Analytics','Digital','Cyber','Quantum','Cloud','Data','AI','Smart','Future','Nova','Vertex','Royal','Crown','Sterling','British','National','Imperial','Global','International','Corporation','Trading','Banking','Insurance','Investments','Securities','Trust','Estate','Property','Construction','Engineering','Mining','Energy','Power','Utilities','Telecom','Media','Broadcast','Publishing','Retail','Wholesale','Logistics','Transport','Aviation','Maritime','Defense','Aerospace','Pharmaceutical','Chemical','Materials','Manufacturing','Automation','Innovation'] },
  { region: 'China', exchange: 'SSE', currency: 'CNY', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Technology','Industries','Electronics','Systems','Holdings','Group','Capital','Ventures','Partners','Labs','Solutions','Dynamics','Robotics','Analytics','Digital','Cyber','Quantum','Cloud','Data','AI','Smart','Future','Nova','Vertex','Keji','Dianzi','Jixie','Huagong','Jianzhu','Nengyuan','Dianli','Yiyao','Jinrong','Yinhang','Baoxian','Zhengquan','Xintuo','Touzi','Fangdichan','Jiancai','Wuliu','Yunshu','Hangkong','Haishi','Guofang','Hangtian','Zhiyao','Huaxue','Cailiao','Zhizao','Zidonghua','Chuangxin','Jishu','Ruanjian','Yingjian','Wangluo','Hulianwang','Yidong','Yunjisuan','Dadishuju','Rengong','Zhinneng','Wurenji','Jiqiren'] },
  { region: 'Germany', exchange: 'XETRA', currency: 'EUR', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['AG','GmbH','Group','Industries','Electronics','Systems','Technologies','Robotics','Digital','Cyber','Quantum','Cloud','Data','AI','Smart','Future','Nova','Vertex','Werke','Industrie','Elektronik','Systeme','Technologie','Maschinen','Anlagen','Bau','Energie','Stahl','Chemie','Pharma','Bank','Versicherung','Investment','Beteiligungs','Handel','Logistik','Transport','Luftfahrt','Schifffahrt','Verteidigung','Automobil','Zulieferer','Werkstoff','Kunststoff','Verpackung','Druck','Medien','Telekommunikation','Software','Hardware','Netzwerk','Internet','Mobil','Cloud','Big Data','KI','Smart','Zukunft','Innovation','Automatisierung'] },
  { region: 'South Korea', exchange: 'KRX', currency: 'KRW', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Corp','Industries','Electronics','Systems','Technologies','Holdings','Group','Capital','Partners','Solutions','Dynamics','Robotics','Analytics','Digital','Cyber','Quantum','Cloud','Data','AI','Smart','Future','Nova','Vertex','Jeonja','Gigye','Hwahak','Geonseol','Enerugi','Jeollyeok','Cheolgang','Yakpum','Geumryung','Eunhang','Boheom','Jeunggwon','Tuja','Budongsan','Mugeun','Unsu','Hanggong','Haesang','Gukbang','Hangcheuk','Jeyeak','Hwahak','Jaejo','Jadonghwa','Changsin','Gisul','Sogteuweo','Hadeuweo','Nateuwokeu','Inteonet','Mobeil','Claudeu','Big Data','AI','Smart','Mirae','Hyoksin'] },
  { region: 'France', exchange: 'Euronext', currency: 'EUR', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['SA','Group','Industries','Electronics','Systems','Technologies','Solutions','Robotics','Digital','Cyber','Quantum','Cloud','Data','AI','Smart','Future','Nova','Vertex','Industrie','Électronique','Systèmes','Technologie','Machines','Énergie','Acier','Chimie','Pharma','Banque','Assurance','Investissement','Immobilier','Logistique','Transport','Aéronautique','Défense','Automobile','Matériaux','Pharmaceutique','Télécom','Médias','Logiciel','Matériel','Réseau','Internet','Mobile','IA','Intelligent','Avenir','Innovation','Automatisation'] },
  { region: 'Canada', exchange: 'TSX', currency: 'CAD', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Corp','Industries','Systems','Technologies','Holdings','Group','Capital','Ventures','Partners','Solutions','Digital','Cyber','Cloud','Data','AI','Smart','Future','Nova','Vertex','Energy','Mining','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Aviation','Defense','Pharma','Chemicals','Materials','Manufacturing','Software','Hardware','Network','Internet','Mobile','Innovation','Automation'] },
  { region: 'Australia', exchange: 'ASX', currency: 'AUD', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Ltd','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Nova','Mining','Energy','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Defense','Pharma','Chemicals','Materials','Manufacturing','Software','Network','Internet','Mobile','Innovation','Automation'] },
  { region: 'Taiwan', exchange: 'TWSE', currency: 'TWD', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Corp','Industries','Electronics','Systems','Technologies','Holdings','Group','Capital','Solutions','Digital','Cyber','Cloud','Data','AI','Smart','Future','Nova','Semiconductor','Foundry','Chip','Memory','Display','Panel','Battery','Solar','Energy','Banking','Insurance','Investment','Logistics','Transport','Pharma','Chemicals','Materials','Software','Hardware','Network','Internet','Mobile','Innovation','Automation'] },
  { region: 'Brazil', exchange: 'BVMF', currency: 'BRL', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['SA','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Nova','Energy','Mining','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Aviation','Defense','Pharma','Chemicals','Materials','Manufacturing','Software','Network','Internet','Mobile','Innovation','Automation'] },
  { region: 'Hong Kong', exchange: 'HKEX', currency: 'HKD', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Ltd','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Nova','Energy','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Internet','Mobile','Innovation','Automation'] },
  { region: 'Singapore', exchange: 'SGX', currency: 'SGD', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Ltd','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Nova','Energy','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Internet','Mobile','Innovation','Automation'] },
  { region: 'Saudi Arabia', exchange: 'TADAWUL', currency: 'SAR', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'South Africa', exchange: 'JSE', currency: 'ZAR', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Ltd','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Mining','Energy','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'Netherlands', exchange: 'Euronext', currency: 'EUR', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['NV','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Internet','Mobile','Innovation','Automation'] },
  { region: 'Switzerland', exchange: 'SIX', currency: 'CHF', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['AG','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Banking','Insurance','Investment','Pharma','Chemicals','Materials','Manufacturing','Software','Hardware','Network','Internet','Mobile','Innovation','Automation','Watches','Precision'] },
  { region: 'Spain', exchange: 'BME', currency: 'EUR', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['SA','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'Italy', exchange: 'BIT', currency: 'EUR', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['SpA','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'Poland', exchange: 'WSE', currency: 'PLN', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['SA','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'Turkey', exchange: 'BIST', currency: 'TRY', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['AS','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'UAE', exchange: 'DFM', currency: 'AED', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Real Estate','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'Nigeria', exchange: 'NSE.NG', currency: 'NGN', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Plc','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'Nordics', exchange: 'OMX', currency: 'SEK', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['AB','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
  { region: 'Ireland', exchange: 'ISE', currency: 'EUR', prefixes: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'], nameRoots: ['Plc','Corp','Group','Industries','Systems','Technologies','Holdings','Capital','Partners','Solutions','Digital','Cloud','Data','AI','Smart','Future','Energy','Banking','Insurance','Investment','Logistics','Transport','Pharma','Chemicals','Materials','Software','Network','Mobile','Innovation','Automation'] },
];

const SECTORS_LIST: Sector[] = ['Technology', 'Financials', 'Healthcare', 'Consumer Discretionary', 'Consumer Staples', 'Energy', 'Industrials', 'Materials', 'Communication Services', 'Utilities', 'Real Estate'];

const AI_INDUSTRIES = ['AI Chips', 'AI Software', 'AI Platform', 'AI Analytics', 'AI Robotics', 'AI Cloud', 'AI Vision', 'AI NLP', 'AI Security', 'AI Autonomy', 'AI Voice', 'AI Edge', 'AI Quantum', 'AI Deep Learning', 'Generative AI', 'AI Data', 'AI Sensors', 'AI Medical', 'AI Education', 'AI Fintech', 'AI Media', 'AI Gaming', 'AI IoT', 'AI Automation', 'AI Research'];

function seeded(n: number): number {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
}

function pick<T>(arr: T[], n: number): T { return arr[Math.floor(seeded(n) * arr.length)]; }

// Generate 500+ AI-specific companies
function generateAIStocks(): StockMeta[] {
  const stocks: StockMeta[] = [];
  for (let i = 0; i < 520; i++) {
    const regionData = REGIONS_DATA[i % REGIONS_DATA.length];
    const p1 = String.fromCharCode(65 + Math.floor(seeded(i * 7 + 1) * 26));
    const p2 = String.fromCharCode(65 + Math.floor(seeded(i * 7 + 3) * 26));
    const p3 = String.fromCharCode(65 + Math.floor(seeded(i * 7 + 5) * 26));
    const suffix = i < 26 ? '' : String.fromCharCode(65 + (i % 26));
    const symbol = `${p1}${p2}${p3}${suffix}`.slice(0, 4) + (i > 100 ? String(i % 10) : '');
    const name = `${p1}${p2} AI ${pick(AI_INDUSTRIES, i)}`;
    stocks.push({
      symbol: `AI${symbol}`.slice(0, 6),
      name,
      exchange: regionData.exchange,
      region: regionData.region,
      currency: regionData.currency,
      sector: i % 5 === 0 ? 'Healthcare' : 'Technology',
      industry: pick(AI_INDUSTRIES, i),
    });
  }
  return stocks;
}

// Generate large universe of general stocks
function generateGeneralStocks(): StockMeta[] {
  const stocks: StockMeta[] = [];
  let idx = 0;
  for (const rd of REGIONS_DATA) {
    for (const prefix of rd.prefixes) {
      for (const root of rd.nameRoots) {
        for (let v = 0; v < 8; v++) {
          idx++;
          const suffix = v === 0 ? '' : String(v);
          const symbol = `${prefix}${root.slice(0, 2).toUpperCase()}${suffix}`.slice(0, 5);
          stocks.push({
            symbol,
            name: `${prefix}${root}${suffix} ${rd.region === 'United States' ? 'Inc' : rd.region === 'India' ? 'Ltd' : 'Corp'}`,
            exchange: rd.exchange,
            region: rd.region,
            currency: rd.currency,
            sector: SECTORS_LIST[Math.floor(seeded(idx) * SECTORS_LIST.length)],
            industry: root,
          });
          if (stocks.length >= 30000) return stocks;
        }
      }
    }
  }
  return stocks;
}

const aiStocks = generateAIStocks();
const generalStocks = generateGeneralStocks();

// Merge, deduplicate by symbol
const seen = new Set<string>();
const merged: StockMeta[] = [];
for (const s of [...aiStocks, ...generalStocks]) {
  if (!seen.has(s.symbol)) {
    seen.add(s.symbol);
    merged.push(s);
  }
}

export const GENERATED_UNIVERSE = merged;

import {
  Wifi, Waves, Dumbbell, Car, Utensils, Coffee, Bath, Tv, Wine, Lock, Baby, Mic,
  Bike, Plane, Briefcase, PawPrint, Shirt, BellRing, Sparkles, Wind, Sofa,
  Snowflake, Martini, Building2, Mountain, Check, type LucideIcon,
} from 'lucide-react'

/** Map a facility / amenity name (EN or KO keywords) to a representative icon. */
export function facilityIcon(name: string, size = 12, className = 'text-primary') {
  const n = name.toLowerCase()
  const rules: [RegExp, LucideIcon][] = [
    [/(wi-?fi|인터넷|와이파이)/, Wifi],
    [/(pool|수영)/, Waves],
    [/(fitness|gym|피트니스|헬스)/, Dumbbell],
    [/(spa|마사지|스파)/, Sparkles],
    [/(sauna|onsen|사우나|온천|찜질)/, Wind],
    [/(valet|parking|주차)/, Car],
    [/(restaurant|dining|식당|레스토랑)/, Utensils],
    [/(breakfast|조식|뷔페)/, Coffee],
    [/(rooftop\s*bar|bar|lounge|라운지|바)/, Martini],
    [/(cafe|카페|커피)/, Coffee],
    [/(shuttle|airport|셔틀|공항)/, Plane],
    [/(business|비즈니스|회의)/, Briefcase],
    [/(pet|반려|애완)/, PawPrint],
    [/(laundry|세탁)/, Shirt],
    [/(concierge|front\s*desk|24h|컨시어지|프런트|프론트)/, BellRing],
    [/(kids|children|아이|키즈|어린이)/, Baby],
    [/(karaoke|노래|가라오케)/, Mic],
    [/(bicycle|bike|자전거)/, Bike],
    [/(executive|lounge|이그제큐티브)/, Sofa],
    [/(bath|욕조|월풀)/, Bath],
    [/(tv|텔레비전|티비)/, Tv],
    [/(minibar|미니바)/, Wine],
    [/(safe|금고)/, Lock],
    [/(air\s*condition|냉방|에어컨)/, Snowflake],
    [/(view|ocean|city|전망|뷰)/, Mountain],
    [/(hotel|building|건물|외관)/, Building2],
  ]
  const Icon = rules.find(([re]) => re.test(n))?.[1] ?? Check
  return <Icon size={size} className={className} />
}

export type RefGroup = "international" | "domestic" | "reuse" | "emerging";

export interface Reference {
  id: number;
  group: RefGroup;
  title: string;
  authors: string;
  venue: string;
  affiliation?: string;
  doi?: string;
  pmid?: string;
  extra?: string;
}

export const refGroups: { id: RefGroup; title: string }[] = [
  { id: "international", title: "해외 문헌" },
  { id: "domestic", title: "국내 문헌" },
  { id: "reuse", title: "재사용 · 재제조 문헌" },
  { id: "emerging", title: "이론적 대안 · 실현 가능성 문헌" },
];

export const references: Reference[] = [
  { id: 1, group: "international", title: "Progress and Status of Hydrometallurgical and Direct Recycling of Li-Ion Batteries and Beyond", authors: "Larouche 외 7인", venue: "Materials 13(3): 801 (2020)", affiliation: "Hydro-Québec CETEES / McGill University / NTU Singapore", doi: "10.3390/ma13030801", pmid: "32050558" },
  { id: 2, group: "international", title: "Efficient Recycling Processes for Lithium-Ion Batteries", authors: "Paul, Shrotriya", venue: "Materials 18(3): 613 (2025)", affiliation: "Iowa State University", doi: "10.3390/ma18030613", pmid: "39942279" },
  { id: 3, group: "international", title: "Sustainable Recycling of Lithium-Ion Battery Cathodes: LCA, Technologies, and Economic Insights", authors: "Pang 외 4인", venue: "Nanomaterials 15(16): 1283 (2025)", affiliation: "Western University / CanmetMATERIALS, NRCan", doi: "10.3390/nano15161283", pmid: "40863863" },
  { id: 4, group: "international", title: "Critical Pathways for Transforming the Energy Future", authors: "Lu 외 3인", venue: "Materials 18(13): 2987 (2025)", affiliation: "산둥과기대학(SDUST)", doi: "10.3390/ma18132987", pmid: "40649476" },
  { id: 5, group: "international", title: "Stepwise recycling of valuable metals from Ni-rich cathode material of spent LIBs", authors: "Yang 외 4인", venue: "Waste Management 102: 131–138 (2020)", affiliation: "중남대학교", doi: "10.1016/j.wasman.2019.09.044", pmid: "31677520" },
  { id: 6, group: "international", title: "Emerging Processes for Sustainable Li-Ion Battery Cathode Recycling", authors: "Bhattacharyya 외 2인", venue: "Small 20: 2400557 (2024)", affiliation: "Rice University / IIT Kanpur", doi: "10.1002/smll.202400557", pmid: "38922789" },
  { id: 7, group: "international", title: "Recycling of spent LIBs for a sustainable future: recent advancements", authors: "Biswal 외 4인", venue: "Chemical Society Reviews 53(11): 5552–5592 (2024)", affiliation: "싱가포르국립대학(NUS)", doi: "10.1039/d3cs00898c", pmid: "38644694" },
  { id: 8, group: "international", title: "Direct recycling of end-of-life LIB cathode active materials by hydrothermal route", authors: "Castro 외 9인", venue: "Scientific Reports 16(1) (2026)", affiliation: "CARTIF / 바야돌리드대학교 / IREC", doi: "10.1038/s41598-026-41973-7", pmid: "41771993" },
  { id: 9, group: "international", title: "Maximizing Lithium Recovery in Direct Recycling: Relithiation Using Residual Lithium", authors: "Appleberry 외 6인", venue: "ACS Applied Materials & Interfaces 18(9): 13750–13764 (2026)", affiliation: "UC San Diego / Honda Research Institute USA", doi: "10.1021/acsami.5c21561", pmid: "41739093" },
  { id: 10, group: "international", title: "Recovery of valuable metals from spent LIBs using microbial agents for bioleaching: a review", authors: "Biswal, Balasubramanian", venue: "Frontiers in Microbiology 14: 1197081 (2023)", affiliation: "싱가포르국립대학(NUS)", doi: "10.3389/fmicb.2023.1197081", pmid: "37323903" },
  { id: 11, group: "international", title: "Improvement of Li and Mn bioleaching using biogenic sulfuric acid by A. thiooxidans", authors: "Naseri, Mousavi", venue: "Heliyon 10(18): e37447 (2024)", affiliation: "Tarbiat Modares University", doi: "10.1016/j.heliyon.2024.e37447", pmid: "39315164" },
  { id: 12, group: "international", title: "Metal recovery from spent LIBs via two-step bioleaching using adapted chemolithotrophs", authors: "Lalropuia 외 7인", venue: "Frontiers in Microbiology 15: 1347072 (2024)", affiliation: "BOKU / 마사리크대학교 / TU Wien / University of Waterloo", doi: "10.3389/fmicb.2024.1347072", pmid: "38348186" },
  { id: 13, group: "international", title: "Recycling of spent LFP batteries: processes, economics, and carbon footprint", authors: "Azimi, Mohammad Zadeh", venue: "Waste Management 209: 115203 (2026)", affiliation: "University of Toronto", doi: "10.1016/j.wasman.2025.115203", pmid: "41108814" },

  { id: 14, group: "domestic", title: "국내 리튬이온전지 재활용 산업현황", authors: "유경근", venue: "자원리싸이클링 32(1): 13–20 (2023)", affiliation: "한국해양대학교", doi: "10.7844/kirr.2023.32.1.13", extra: "KCI ART002933383" },
  { id: 15, group: "domestic", title: "리튬이온전지 재활용공정 효율 향상을 위한 공정개선 연구동향", authors: "유경근 · 허원화 · 김범중", venue: "자원리싸이클링 33(2): 24–36 (2024)", affiliation: "한국해양대학교 / 성일하이텍(주)", doi: "10.7844/kirr.2024.33.2.24", extra: "KCI ART003075401" },
  { id: 16, group: "domestic", title: "습식공정에 의한 폐리튬이온전지(LIB) 재활용 기술 현황 및 전망", authors: "안재우 · 조연철", venue: "자원리싸이클링 32(4): 3–17 (2023)", affiliation: "대진대학교", doi: "10.7844/kirr.2023.32.4.3", extra: "KCI ART002989650" },
  { id: 17, group: "domestic", title: "폐 리튬이온전지(LIB) 전해액 재활용 기술 분석", authors: "안재우 외 4인", venue: "자원리싸이클링 34(5): 32–52 (2025)", affiliation: "대진대학교", doi: "10.7844/kirr.2025.34.5.32", extra: "KCI ART003259817" },
  { id: 18, group: "domestic", title: "Unraveling Redox Mediator-Assisted Chemical Relithiation Mechanism for Direct Recycling", authors: "Kim 외 9인", venue: "Advanced Science (2025)", affiliation: "숙명여자대학교 / KAIST / 동국대학교 / KIER", doi: "10.1002/advs.202417094", pmid: "39840925" },
  { id: 19, group: "domestic", title: "Efficient Direct Recycling of Spent Batteries: Integrated Lithiation and Delamination", authors: "Song 외 11인", venue: "Advanced Science e75879 (2026)", affiliation: "KIER / 전남대학교 / GIST", doi: "10.1002/advs.75879", pmid: "42220081" },
  { id: 20, group: "domestic", title: "Direct Integration of Spent LiMn₂O₄ with Aqueous Zinc-Manganese Redox Flow Batteries", authors: "Han 외 10인", venue: "Small 21: 2500787 (2025)", affiliation: "부산대학교 / 부경대학교 / KIGAM", doi: "10.1002/smll.202500787", pmid: "40066525" },
  { id: 21, group: "domestic", title: "Toward closed-loop hydrometallurgy: wastewater reuse strategies for LiFePO₄ battery recycling", authors: "Choi 외 5인", venue: "Green Chemistry 27: 10423–10443 (2025)", affiliation: "KIGAM / UST", doi: "10.1039/D5GC02987B" },
  { id: 22, group: "domestic", title: "Hydrometallurgical Recycling of Black Mass of Spent LIBs Using Methanesulfonic Acid", authors: "Kurniawan 외 4인", venue: "Journal of Sustainable Metallurgy (2025)", affiliation: "KIGAM / UST / Argonne National Laboratory", doi: "10.1007/s40831-025-01045-y" },

  { id: 23, group: "reuse", title: "Experimental Methods, Health Indicators, and Diagnostic Strategies for Retired Lithium-ion Batteries: A Comprehensive Review", authors: "Zhang 외 4인", venue: "arXiv 프리프린트 (2025)", affiliation: "Swinburne University of Technology 등", extra: "arXiv:2512.01294 · 동료심사 전 프리프린트" },
  { id: 24, group: "reuse", title: "Comparative life cycle assessment of second- and third-life repurposing versus recycling of electric vehicle batteries", authors: "Hayati Soloot, Hupponen, Horttanainen", venue: "Waste Management (2026)", affiliation: "LUT University (핀란드)", doi: "10.1016/j.wasman.2026.115811", pmid: "42607604" },
  { id: 25, group: "reuse", title: "Cost, energy, and carbon footprint benefits of second-life electric vehicle battery use", authors: "Dong 외 5인", venue: "iScience (2023)", affiliation: "칭화대학교 / Ford Motor Company", doi: "10.1016/j.isci.2023.107195", pmid: "37456844" },
  { id: 26, group: "reuse", title: "An experimental robotic cell for the disassembly of electric vehicle battery modules", authors: "Liang 외 9인", venue: "Journal of Remanufacturing (2025)", affiliation: "University of Birmingham", doi: "10.1007/s13243-025-00156-9", pmid: "41084599" },

  { id: 27, group: "emerging", title: "Chloroaluminate Molten Salts for Low-Temperature Electrochemical Recycling of Layered Metal Oxide Cathodes", authors: "Xiao 외 12인", venue: "Advanced Materials 38(3): e12984 (2026)", affiliation: "베이징대학교 / 우한이공대학교", doi: "10.1002/adma.202512984", pmid: "41013928" },
  { id: 28, group: "emerging", title: "Mechanochemical Ball Milling Achieves Green and Ultrahighly Efficient Recycling of LIBs", authors: "Yu 외 7인", venue: "Environmental Science & Technology 59(24): 12352–12363 (2025)", affiliation: "지난대학교 / 난징정보공정대학교", doi: "10.1021/acs.est.5c02156", pmid: "40506259" },
  { id: 29, group: "emerging", title: "Recovery of cobalt from spent lithium-ion batteries using supercritical carbon dioxide extraction", authors: "Bertuol 외 5인", venue: "Waste Management (2016)", pmid: "26970842" },
  { id: 30, group: "emerging", title: "Supercritical CO₂ technology for the treatment of end-of-life lithium-ion batteries", authors: "리뷰 논문", venue: "RSC Sustainability 2(6): 1692 (2024)", doi: "10.1039/D4SU00044G" },
  { id: 31, group: "emerging", title: "Early-Stage Recovery of Lithium from LIB Black Mass in Pilot Scale Using Supercritical CO₂", authors: "—", venue: "ACS Sustainable Resource Management (2026)", doi: "10.1021/acssusresmgt.5c00663", extra: "200 L 오토클레이브 파일럿 실증" },
  { id: 32, group: "emerging", title: "Toward Sustainable Li-Ion Battery Recycling: Green MOF as a Molecular Sieve for Co/Ni Separation", authors: "Piątek 외 9인", venue: "ACS Sustainable Chemistry & Engineering 9(29): 9770–9778 (2021)", affiliation: "스톡홀름대학교", doi: "10.1021/acssuschemeng.1c02146" },
  { id: 33, group: "emerging", title: "Membranes Based on MOF Nanostructures for Recovering Ni, Co, and Mn Ions from Spent LIBs", authors: "—", venue: "ACS Applied Nano Materials (2025)", doi: "10.1021/acsanm.5c04698", pmid: "41536584" },
  { id: 34, group: "emerging", title: "Redox-Ligand-Coupled Chemical Reprogramming of Battery Waste Into Metal–Organic Electrodes", authors: "Dai 외", venue: "Advanced Materials (2026)", doi: "10.1002/adma.74588", pmid: "42581720" },
  { id: 35, group: "emerging", title: "The Lithium-Ion Battery Recycling Trilemma", authors: "Zhang Q.", venue: "Materials 19(6): 1235 (2026)", affiliation: "BCMaterials / IKERBASQUE (스페인)", doi: "10.3390/ma19061235", pmid: "41900726" },
];

export const refById = (id: number) => references.find((r) => r.id === id)!;

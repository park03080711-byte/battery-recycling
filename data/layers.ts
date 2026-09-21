export type LayerId = "paths" | "support" | "evaluation" | "design";

export interface Layer {
  id: LayerId;
  no: string;
  title: string;
  en: string;
  question: string;
  description: string;
  range: string;
  /** 주제 팔레트 — 경로·평가는 실제 금속 황산염 결정 색에서 가져옴 */
  color: string;
  colorSoft: string;
  material: string;
}

export const layers: Layer[] = [
  {
    id: "paths",
    no: "A",
    title: "처리 경로",
    en: "PATHWAYS",
    question: "무엇을 할 것인가",
    description:
      "수명을 다한 배터리가 가는 네 갈래 길. 잔존용량에 따라 재제조·재사용·재활용으로 나뉘고, 금속 회수를 건너뛰는 업사이클링이 더해진다.",
    range: "01 — 04",
    color: "#116F5A",
    colorSoft: "#E3F1EC",
    material: "황산니켈의 에메랄드",
  },
  {
    id: "support",
    no: "B",
    title: "지원 기술",
    en: "ENABLING TECH",
    question: "무엇이 있어야 가능한가",
    description:
      "어떤 경로를 택하든 공통으로 필요한 기반 기술. 진단·안전·해체·부산물·이력·인증의 여섯 가지다.",
    range: "05 — 10",
    color: "#1B4FA0",
    colorSoft: "#E4ECF8",
    material: "공정 도식의 딥 블루",
  },
  {
    id: "evaluation",
    no: "C",
    title: "평가",
    en: "ASSESSMENT",
    question: "좋은지 어떻게 판단하는가",
    description:
      "기술을 만드는 일과 그 기술이 쓸 만한지 판단하는 일은 다르다. 환경영향, 수익성, 자원안보의 세 잣대.",
    range: "11 — 13",
    color: "#A32E54",
    colorSoft: "#F6E4EA",
    material: "황산코발트의 로즈",
  },
  {
    id: "design",
    no: "D",
    title: "설계",
    en: "DESIGN",
    question: "애초에 어떻게 만들 것인가",
    description:
      "앞의 열세 주제가 이미 만들어진 배터리를 다룬다면, 이 주제는 처리하기 쉽도록 처음부터 설계하자는 접근이다.",
    range: "14",
    color: "#8A6A2F",
    colorSoft: "#F3EDE1",
    material: "설계 도면의 크라프트 톤",
  },
];

export const layerById = (id: LayerId) => layers.find((l) => l.id === id)!;

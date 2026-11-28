/* 관제실에서 바로 고르는 모의 실험 시나리오 — 이름만 담아 처음 화면을 가볍게 (가상 장치는 고를 때 불러옴) */
import type { Shared } from "../sim/share";

const CORE = ["ds", "ntc", "shunt", "div", "relay", "rgb"] as const;
const kit = (...ids: string[]) => [...CORE, ...ids] as Shared["present"];

export const PRESETS: { id: string; name: string; note: string; shared: Shared }[] = [
  { id: "heat", name: "셀 내부 발열", note: "LAB 01 판정 실험에 맞춘 기본 환경", shared: { env: "heat" } },
  { id: "wifi", name: "Wi-Fi 끊김", note: "40초부터 63초 동안 공유기 꺼짐 · 버퍼 600개", shared: { env: "wifi" } },
  { id: "wifi-small", name: "Wi-Fi 끊김 · 버퍼 10개", note: "버퍼가 작아 오래된 기록부터 사라짐 · 실측에서 못 해 본 경우", shared: { env: "wifi", params: { "buffer.n": 10 } } },
  { id: "wifi-nobuf", name: "Wi-Fi 끊김 · 버퍼 끔", note: "끊긴 동안의 기록이 전부 사라짐", shared: { env: "wifi", cards: { buffer: false } } },
  { id: "cut", name: "온도 센서 선 빠짐", note: "45초에 DS18B20 선이 빠짐", shared: { env: "sensor", variant: "cut" } },
  { id: "contact", name: "온도 센서 접촉 불량", note: "셀에 덜 붙어 늦고 낮게 읽음", shared: { env: "sensor", variant: "contact" } },
  { id: "short", name: "과전류 (부분 단락)", note: "전류 기준으로 판정", shared: { env: "short" } },
  { id: "room", name: "방 온도 변화", note: "셀은 그대로, 주변만 바뀜 · 헛경보가 없어야 함", shared: { env: "room" } },
  { id: "condense", name: "결로 (습한 바깥 공기)", note: "DHT11로 이슬점 계산 · 셀 표면에 물이 맺히기 전에 멈춰야 함", shared: { env: "condense", present: kit("dht") } },
  { id: "leak", name: "바닥 누수", note: "초음파로 물받이 물 높이 · 5 mm 전에 멈춰야 함", shared: { env: "leak", present: kit("sonar") } },
  { id: "shock", name: "충격 · 기울어짐", note: "가속도 센서 · 2.8 g 충격 뒤 30° 기울어짐", shared: { env: "shock", present: kit("accel") } },
  { id: "door", name: "문 열림 · 사람 접근", note: "리드 스위치 · 인체감지 · 문이 열리면 정비 중", shared: { env: "door", present: kit("reed", "pir") } },
];

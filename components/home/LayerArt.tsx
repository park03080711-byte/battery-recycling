/* 메인 '네 층위' 패널 배경 — Blender로 직접 만든 3D 그림 (tools/layers). 장식 그림이라 낭독기는 건너뛴다.
   데스크톱: 층위색 그러데이션을 넣은 세로 그림(1400×1800)을 패널에 꽉 채움. 폰(900px 이하): 투명 배경의 띠 그림(780×440)을 패널 맨 위에. */
import type { LayerId } from "@/data/layers";

export default function LayerArt({ layer }: { layer: LayerId }) {
  return (
    <picture>
      <source media="(max-width: 900px)" srcSet={`/home/layer-${layer}-m.webp`} width={780} height={440} />
      <img
        src={`/home/layer-${layer}-700.webp`}
        srcSet={`/home/layer-${layer}-700.webp 700w, /home/layer-${layer}.webp 1400w`}
        sizes="700px"
        width={1400}
        height={1800}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </picture>
  );
}

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    /* React 19 컴파일러 기준의 새 규칙들. 기존 애니메이션·3D 코드(ref를 렌더 중에 읽는 패턴)가 많이 걸려서
       지금은 경고로 두고, 고칠 때마다 하나씩 줄인다. 새 코드에서는 지키는 것을 원칙으로 한다. */
    rules: {
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      /* 사진·도판은 크기를 직접 맞춘 <img>를 쓴다(정적 내보내기용 webp). next/image 전환은 이미지 정리 단계에서 */
      "@next/next/no-img-element": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "tools/**", "test-results/**", "playwright-report/**"]),
]);

export default eslintConfig;

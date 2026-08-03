import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      /*
       * Lima belas `<img>` yang tersisa memang disengaja, jadi aturannya
       * dimatikan alih-alih ditinggal sebagai peringatan abadi yang tidak
       * pernah ditindak.
       *
       * Tiga belas di antaranya avatar dan logo dari URL yang DIKETIK
       * pengguna (EditPhotoModal, CompanySettingsTab). `next/image` menolak
       * host yang tidak ada di `remotePatterns` dengan 400 — dengan `<img>`
       * gambarnya tetap tampil. Isi basis data saat ini seluruhnya
       * api.dicebear.com, yaitu SVG, dan SVG tidak dioptimalkan next/image
       * sama sekali: risikonya nyata, untungnya nol.
       *
       * Dua sisanya pratinjau `data:`/blob lokal (EditPhotoModal.previewUrl,
       * FaceScanner.selfieImg) yang butuh `unoptimized` — sama saja `<img>`.
       *
       * Satu yang benar-benar untung sudah dipindahkan: tiga PNG podium
       * ~130 KB di components/leaderboard/Podium.tsx.
       *
       * Nyalakan lagi ketika avatar dan logo disajikan dari penyimpanan
       * sendiri (R2 lewat POST /storage/upload) alih-alih hotlink, karena
       * sejak itu setiap host sudah pasti terdaftar.
       */
      "@next/next/no-img-element": "off",
      // Dimatikan sampai 2026-08, dan selama itu menumpuk 97 import serta
      // variabel mati — satu berkas sendirian punya 30. Sengaja `warn`, bukan
      // `error`: `next build` menggagalkan build pada error lint, dan itu
      // mengubah kebersihan menjadi penghalang rilis.
      //
      // Awalan `_` adalah jalan keluar untuk yang memang disengaja, terutama
      // destructuring yang dipakai untuk MEMBUANG kolom:
      // `const { passwordHash: _passwordHash, ...aman } = user`.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-require-imports": "off",
      "react-hooks/purity": "off",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

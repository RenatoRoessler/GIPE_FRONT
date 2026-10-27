import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// A API e o ViaCEP são as únicas origens externas consultadas pelo navegador.
const apiOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : "";
  } catch {
    return "";
  }
})();

// 'unsafe-inline' em script é exigido pelos scripts inline do Next sem nonce; 'wasm-unsafe-eval' é do leitor de placa (ONNX).
// styled-components injeta <style> em tempo de execução, daí o 'unsafe-inline' em estilo.
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://viacep.com.br${isDev ? " ws: http:" : ""}`.replace(/\s+/g, " ").trim(),
  "worker-src 'self' blob:",
  "media-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // A câmera é usada pelo leitor de placa e de QR.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  compiler: {
    styledComponents: true,
  },
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Entrada e Saída de veículos abrem um modal pelo menu e não têm mais página própria: os endereços antigos
  // (favoritos, atalhos do app instalado) levam ao Início. Temporário (307) para o destino poder mudar.
  async redirects() {
    return [
      { source: "/veiculos/entrada", destination: "/dashboard", permanent: false },
      { source: "/veiculos/saida", destination: "/dashboard", permanent: false },
    ];
  },
};

export default nextConfig;

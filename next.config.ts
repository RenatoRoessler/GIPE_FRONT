import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera .next/standalone (servidor mínimo) para a imagem Docker do deploy no Fly.io.
  output: "standalone",
  compiler: {
    styledComponents: true,
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

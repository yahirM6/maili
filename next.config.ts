import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir `next dev` desde la red local (p. ej. el celular); sin esto Next bloquea el JS
  allowedDevOrigins: ["192.168.1.94"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;

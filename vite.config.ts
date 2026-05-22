import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

type VendorChunk = {
  name: string;
  exact?: string[];
  prefixes?: string[];
};

const vendorChunks: VendorChunk[] = [
  { name: "react-vendor", exact: ["react", "react-dom", "scheduler", "use-sync-external-store"] },
  { name: "router-data", exact: ["react-router", "react-router-dom", "@tanstack/react-query", "@tanstack/query-core"], prefixes: ["@supabase/"] },
  { name: "ui-vendor", exact: ["lucide-react", "class-variance-authority", "clsx", "cmdk", "date-fns", "embla-carousel-react", "input-otp", "next-themes", "react-day-picker", "react-hook-form", "react-resizable-panels", "sonner", "tailwind-merge", "vaul", "zod"], prefixes: ["@radix-ui/"] },
  { name: "rich-text", prefixes: ["@tiptap/", "prosemirror-"] },
  { name: "charts", exact: ["recharts", "victory-vendor"], prefixes: ["d3-"] },
  { name: "animation", exact: ["gsap", "lenis"] },
  { name: "web3-wallet", exact: ["wagmi", "viem", "ox", "abitype", "mipd", "zustand"], prefixes: ["@privy-io/", "@walletconnect/", "@reown/", "@metamask/", "@coinbase/", "@safe-global/", "@gemini-wallet/", "@base-org/"] },
  { name: "web3-moralis", exact: ["moralis"], prefixes: ["@moralisweb3/"] },
  { name: "web3-legacy-crypto", exact: ["web3-utils", "web3-eth-abi", "ethers", "ethereumjs-util", "ethereum-cryptography", "secp256k1", "elliptic", "bn.js"], prefixes: ["@ethersproject/"] },
  { name: "http-client", exact: ["axios", "follow-redirects", "form-data"] },
];

const getPackageName = (id: string) => {
  const [, modulePath] = id.split("node_modules/");
  if (!modulePath) {
    return id;
  }

  const parts = modulePath.split("/");
  return parts[0].startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
};

const getManualChunk = (id: string) => {
  if (!id.includes("node_modules")) {
    return;
  }

  const packageName = getPackageName(id);
  const match = vendorChunks.find(({ exact = [], prefixes = [] }) =>
    exact.includes(packageName) ||
    prefixes.some((prefix) => packageName.startsWith(prefix))
  );

  return match?.name;
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["moralis"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
}));

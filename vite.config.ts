import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  
  return {
    server: {
      host: "::",
      port: 8080,
      strictPort: true, // Force port 8080, fail if not available
      proxy: isDev ? {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        },
        '/Photos': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false
        }
      } : undefined
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom']
          }
        }
      }
    },
    plugins: [
      react(),
      isDev && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

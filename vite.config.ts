import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  const env = loadEnv(mode, path.resolve(), '');

  return {
    plugins: [react()],
    base: '/', 
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
      target: 'es2020', // Modern browsers for better performance
      minify: 'esbuild',
      // Increases the warning limit to 1600kb to prevent warnings for large enterprise bundles
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          // Optimized chunking strategy for Vercel caching
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-utils': ['@supabase/supabase-js', '@google/genai'],
            'vendor-ui': ['framer-motion'],
          },
        },
      },
    },
    define: {
      // Injects environment variables globally for compatibility with Vercel and some libraries
      'process.env': {
         API_KEY: JSON.stringify(env.API_KEY || process.env.API_KEY || ''),
         VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://jforwngnlqyvlpqzuqpz.supabase.co'),
         VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjY0NTksImV4cCI6MjA4Mjk0MjQ1OX0.f3WXFI972q4P-PKD_vWQo6fKzh9bedoQ6FzIgpJxU8M'),
      }
    },
    resolve: {
      alias: {
        // Alias optimization
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});

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
      minify: 'esbuild',
      rollupOptions: {
        output: {
          // Chunking strategy for faster loading and better caching on Vercel Edge
          manualChunks: {
            'react-core': ['react', 'react-dom'],
            'react-routing': ['react-router-dom'],
            'supabase-sdk': ['@supabase/supabase-js'],
            'ai-sdk': ['@google/genai'],
          },
        },
      },
    },
    define: {
      // Injects environment variables globally for compatibility.
      // This maps them to process.env which is safer for many runtime environments.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || 'https://jforwngnlqyvlpqzuqpz.supabase.co'),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impmb3J3bmdubHF5dmxwcXp1cXB6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNjY0NTksImV4cCI6MjA4Mjk0MjQ1OX0.f3WXFI972q4P-PKD_vWQo6fKzh9bedoQ6FzIgpJxU8M'),
    },
    resolve: {
      alias: {
        // The '@' alias is not used by the browser's native module loader and is removed to avoid confusion.
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});

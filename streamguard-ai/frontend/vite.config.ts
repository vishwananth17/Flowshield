import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/components/ui/Button', replacement: path.resolve(__dirname, './src/components/ui/button') },
      { find: '@/components/ui/Badge', replacement: path.resolve(__dirname, './src/components/ui/badge') },
      { find: '@/components/ui/Card', replacement: path.resolve(__dirname, './src/components/ui/card') },
      { find: '@/components/ui/Input', replacement: path.resolve(__dirname, './src/components/ui/input') },
      { find: '@/components/ui/Table', replacement: path.resolve(__dirname, './src/components/ui/table') },
      { find: '@/components/ui/Skeleton', replacement: path.resolve(__dirname, './src/components/ui/skeleton') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
  },
})

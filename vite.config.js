import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { jsonUsersApiPlugin } from "./vitePlugins/jsonUsersApi" 
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), jsonUsersApiPlugin()],
})

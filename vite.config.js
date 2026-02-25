import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import ElectronPlugin from 'vite-plugin-electron'
import Info from 'unplugin-info/vite'

export default defineConfig(({ mode }) => {
  const base = mode === 'electron' ? './' : '/' //can use this with import.meta.env.BASE_URL in js
  const plugins=[]
  if(mode==='electron'){
    plugins.push(ElectronPlugin({
      entry: 'electron/main.js',
      onstart({ reload }) {
        reload()
      },
    }))
  }else{
    plugins.push(VitePWA({
      registerType: 'autoUpdate',
      workbox:{
        globPatterns:['**/*']
      },
      manifest: {
        name: "Flogo",
        short_name: "Flogo",
        id: "flogo",
        description: "Create and run programs using flow charts",
        icons: [
          {
            src: "icons/pwaicon_mono.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "monochrome maskable"
          },
          {
            src: "icons/pwaicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any"
          }
        ],
        "file_handlers":[
          {
            "action":"/",
            "accept":{
              "application/x-flogo": [".flogo"]
            },
            "icons": [
              {
                "src": "icons/pwaicon_file.png",
                "sizes": "256x256",
                "type": "image/png"
              }
            ]
          }
        ],
        start_url: "/",
        scope: ".",
        display: "standalone",
        orientation: "portrait",
        background_color: "#000000",
        theme_color: "#4080ff"
      }
    }))
  }
  plugins.push(Info())
  return {
    base,
    plugins,
  }
})

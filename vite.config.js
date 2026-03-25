import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
    root: 'www',
    envDir: '../', 
    base: './',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'www/index.html'),
                feed: resolve(__dirname, 'www/feed.html'),
                list: resolve(__dirname, 'www/list.html')
            }
        }
    },
    envPrefix: 'VITE_',
});
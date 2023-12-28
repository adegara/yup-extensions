import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import dtsPlugin from 'vite-plugin-dts';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        dtsPlugin({ rollupTypes: true }),
    ],
    build: {
        lib: {
            entry: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
            formats: ['es'],
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});

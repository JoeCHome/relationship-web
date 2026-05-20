import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  ...(mode === 'lib'
    ? {
        build: {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'RelationshipMap',
            fileName: 'relationship-map',
          },
          rollupOptions: {
            external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', '@xyflow/react'],
            output: {
              globals: {
                react: 'React',
                'react/jsx-runtime': 'ReactJSXRuntime',
                'react-dom': 'ReactDOM',
                'react-dom/client': 'ReactDOMClient',
                '@xyflow/react': 'ReactFlow',
              },
            },
          },
        },
      }
    : {}),
}))

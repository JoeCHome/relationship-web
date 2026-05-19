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
            external: ['react', 'react-dom', '@xyflow/react'],
            output: {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                '@xyflow/react': 'ReactFlow',
              },
            },
          },
        },
      }
    : {}),
}))

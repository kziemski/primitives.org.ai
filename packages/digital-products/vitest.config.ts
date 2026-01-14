import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    // Resolve .js extensions to .ts for TypeScript source files
    alias: [
      // Handle all .js imports from src/ to .ts files
      {
        find: /^(\.\.?\/.*?)\.js$/,
        replacement: '$1.ts'
      },
    ],
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})

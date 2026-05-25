// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv')
dotenv.config()

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/*.test.{ts,tsx}',
    '<rootDir>/server/**/*.test.ts',
  ],
  globals: {
    __SERVER_PORT__: process.env.SERVER_PORT,
  },
  setupFiles: ['<rootDir>/jest.setupAppBase.js'],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',
  ],
}

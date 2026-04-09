// import dotenv from 'dotenv'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv')
dotenv.config()

// export default {
//   preset: 'ts-jest',
//   testEnvironment: 'jsdom',
//   testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
//   globals: {
//     __SERVER_PORT__: process.env.SERVER_PORT,
//   },
//   setupFilesAfterEnv: ['@testing-library/jest-dom'],
// }

// и вместо export default ...
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
  globals: {
    __SERVER_PORT__: process.env.SERVER_PORT,
  },
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  moduleNameMapper: {
    '^@match3-public/(.*)\\?url$':
      '<rootDir>/public/$1',
    '^@match3-icons/(.*)\\?url$':
      '<rootDir>/public/iconset/$1',
    '^@match3-public/(.*)$': '<rootDir>/public/$1',
    '^@match3-icons/(.*)$':
      '<rootDir>/public/iconset/$1',
    '^.+\\.(png|jpe?g|gif|webp|svg)\\?url$':
      '<rootDir>/src/test/mocks/fileUrlMock.ts',
    '^.+\\.(css|pcss)$':
      '<rootDir>/src/test/mocks/styleMock.ts',
  },
  transform: {
    '^.+\\.pcss$': 'jest-preview/transforms/css',
  },
};

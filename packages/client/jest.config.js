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
};

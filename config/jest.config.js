// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  testMatch: [
    '<rootDir>/test/**/*.test.js'
  ],
  collectCoverageFrom: [
    'hooks/**/*.js',
    'lib-supa/**/*.js',
    'components/**/*.js',
    'lib/**/*.js',
    '!**/node_modules/**'
  ],
  // Add this to transform ES modules
  transformIgnorePatterns: [
    '/node_modules/(?!(sanitize-html)/)'
  ]
}

module.exports = createJestConfig(customJestConfig)
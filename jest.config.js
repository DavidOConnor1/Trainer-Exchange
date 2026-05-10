// jest.config.js
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/test/setup/jest.setup.js"],
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/lib/(.*)$": "<rootDir>/lib/$1", // if you use @/lib aliases
  },
};

module.exports = createJestConfig(customJestConfig);

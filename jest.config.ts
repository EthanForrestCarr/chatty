import nextJest from "next/jest";

const createJestConfig = nextJest({
  // points to your Next.js app
  dir: "./",
});

const config = {
  // Use node for API routes
  testEnvironment: "node",
  // alias @/ to ./src/
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]
};

export default createJestConfig(config);
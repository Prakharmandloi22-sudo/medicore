module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/scripts/**',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json', 'node']
};

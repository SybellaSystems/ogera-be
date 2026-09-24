module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/tests/setup.ts'],
    moduleFileExtensions: ['ts', 'js'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};

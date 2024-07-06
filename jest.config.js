// Configuration for Jest
module.exports = {
    transform: {
        '^.+\\.ts?$': [
            'ts-jest',
            {
                tsconfig: {
                    experimentalDecorators: true
                }
            }
        ]
    },
    testEnvironment: 'node',
    testPathIgnorePatterns: [ "/node_modules|dist|types/" ],
    testRegex: '/tests/.*\\.test\\.(ts|tsx)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};
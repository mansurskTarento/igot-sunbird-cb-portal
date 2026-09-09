module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$)',
  ],
  moduleNameMapper: {
    '^@ws/(.*)$': '<rootDir>/project/ws/$1',
    '@ws-widget/(.*)$': '<rootDir>/library/ws-widget/$1',
    '@ws/author/(.*)$': '<rootDir>/project/ws/author/$1',
    '@ws/app/(.*)$': '<rootDir>/project/ws/app/$1',
    '@ws/viewer/(.*)$': '<rootDir>/project/ws/viewer/$1',
    'worker-loader!.*': '<rootDir>/test/mocks/workerMock.js',
    'pdfjs-dist/build/pdf.worker': '<rootDir>/test/mocks/workerMock.js',
    "^src/environments/environment$": "<rootDir>/src/environments/environment.ts",
    '^@sunbird-cb/collection/src/lib/_common/confirm-dialog/confirm-dialog.component$': '<rootDir>/__mocks__/confirm-dialog.component.js',
    // uuid 8's "exports" resolves to an ESM build under jsdom, which jest cannot parse
    // and which transformIgnorePatterns (mjs only) does not cover. Point at its CJS build.
    '^uuid$': '<rootDir>/node_modules/uuid/dist/index.js',
    // ckeditor5 exposes no "require" condition, so jest cannot resolve it at all
    '^ckeditor5$': '<rootDir>/__mocks__/ckeditor5.js',
    // mirror the tsconfig "paths" for the in-repo libraries; without these jest
    // looks for them under node_modules and fails to resolve. Kept after the
    // confirm-dialog entry above so that more specific mapping still wins.
    '^@sunbird-cb/collection$': '<rootDir>/library/ws-widget/collection',
    '^@sunbird-cb/collection/(.*)$': '<rootDir>/library/ws-widget/collection/$1',
    '^@sunbird-cb/resolver$': '<rootDir>/library/ws-widget/resolver',
    '^@sunbird-cb/resolver/(.*)$': '<rootDir>/library/ws-widget/resolver/$1',
  },
  // tsconfig sets baseUrl to the repo root, so sources import each other with
  // root-relative paths like 'project/ws/author/...'. jest resolves from
  // node_modules only unless the root is on the module search path too.
  modulePaths: ['<rootDir>'],
  coverageReporters: ["clover", "json", "lcov", "text", "text-summary"],
  collectCoverage: true,
  testResultsProcessor: "jest-sonar-reporter",
  setupFiles: ['zone.js', ]
};
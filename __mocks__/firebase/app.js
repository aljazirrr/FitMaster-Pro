const mockApp = { name: '[DEFAULT]', options: {} };
module.exports = {
  initializeApp: jest.fn(() => mockApp),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => mockApp),
};

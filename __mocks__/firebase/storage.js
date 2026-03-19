const mockStorage = {};
module.exports = {
  getStorage: jest.fn(() => mockStorage),
  ref: jest.fn(() => ({})),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve('https://mock.storage.com/photo.jpg')),
  deleteObject: jest.fn(() => Promise.resolve()),
};

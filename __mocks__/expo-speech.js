const Speech = {
  speak: jest.fn((_text, options) => {
    // Simulate async completion
    if (options?.onDone) setTimeout(options.onDone, 10);
  }),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  isSpeakingAsync: jest.fn(() => Promise.resolve(false)),
  getAvailableVoicesAsync: jest.fn(() => Promise.resolve([])),
};

module.exports = Speech;

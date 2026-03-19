module.exports = {
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
  },
  useRouter: () => module.exports.router,
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  Link: ({ children }) => children,
  Stack: { Screen: () => null },
  Tabs: { Screen: () => null },
};

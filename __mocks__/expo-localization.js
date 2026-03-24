module.exports = {
  getLocales: jest.fn(() => [
    { languageTag: 'en-US', languageCode: 'en', regionCode: 'US' },
  ]),
  getCalendars: jest.fn(() => [{ calendar: 'gregory', timeZone: 'UTC', uses24hourClock: false }]),
};

// Mock for expo-notifications in Jest environment
const SchedulableTriggerInputTypes = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  TIME_INTERVAL: 'timeInterval',
  DATE: 'date',
  CALENDAR: 'calendar',
};

const AndroidImportance = {
  DEFAULT: 3,
  HIGH: 4,
  LOW: 2,
  MAX: 5,
  MIN: 1,
  NONE: 0,
};

// In-memory scheduled notifications store for testing
let _scheduled = [];
let _handler = null;

const Notifications = {
  SchedulableTriggerInputTypes,
  AndroidImportance,

  setNotificationHandler: jest.fn((handler) => { _handler = handler; }),

  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: true, granted: true })
  ),

  requestPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted', canAskAgain: false, granted: true })
  ),

  setNotificationChannelAsync: jest.fn(() => Promise.resolve(null)),

  scheduleNotificationAsync: jest.fn(({ identifier, content, trigger }) => {
    _scheduled.push({ identifier, content, trigger });
    return Promise.resolve(identifier);
  }),

  cancelScheduledNotificationAsync: jest.fn((identifier) => {
    _scheduled = _scheduled.filter((n) => n.identifier !== identifier);
    return Promise.resolve();
  }),

  cancelAllScheduledNotificationsAsync: jest.fn(() => {
    _scheduled = [];
    return Promise.resolve();
  }),

  getAllScheduledNotificationsAsync: jest.fn(() =>
    Promise.resolve(_scheduled.map((n) => ({ identifier: n.identifier, content: n.content, trigger: n.trigger })))
  ),

  getExpoPushTokenAsync: jest.fn(() =>
    Promise.resolve({ data: 'ExponentPushToken[test-token]', type: 'expo' })
  ),

  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),

  // Test helper to reset in-memory state
  _reset: () => {
    _scheduled = [];
    _handler = null;
  },
  _getScheduled: () => _scheduled,
};

module.exports = Notifications;

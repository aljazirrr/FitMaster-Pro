import { TextStyle } from 'react-native';

export const typography = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 } as TextStyle,
  h2: { fontSize: 24, fontWeight: '700', lineHeight: 32 } as TextStyle,
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 } as TextStyle,
  h4: { fontSize: 18, fontWeight: '600', lineHeight: 24 } as TextStyle,
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 } as TextStyle,
  bodyBold: { fontSize: 16, fontWeight: '600', lineHeight: 24 } as TextStyle,
  small: { fontSize: 14, fontWeight: '400', lineHeight: 20 } as TextStyle,
  smallBold: { fontSize: 14, fontWeight: '600', lineHeight: 20 } as TextStyle,
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 } as TextStyle,
  captionBold: { fontSize: 12, fontWeight: '600', lineHeight: 16 } as TextStyle,
  label: { fontSize: 10, fontWeight: '600', lineHeight: 14, textTransform: 'uppercase', letterSpacing: 1 } as TextStyle,
  number: { fontSize: 28, fontWeight: '700', lineHeight: 34 } as TextStyle,
  numberLarge: { fontSize: 48, fontWeight: '700', lineHeight: 56 } as TextStyle,

  /** Numeric size scale — used as `typography.sizes.md` etc. */
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
  },

  /** Font-weight aliases — used as `typography.weights.bold` etc. */
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  } as const,
};

export type Typography = typeof typography;

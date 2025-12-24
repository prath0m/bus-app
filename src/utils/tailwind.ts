import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

type Style = ViewStyle | TextStyle | ImageStyle;

// Tailwind-like utility classes for React Native
export const tw = {
  // Layout
  flex: { flex: 1 } as ViewStyle,
  flexRow: { flexDirection: 'row' } as ViewStyle,
  flexCol: { flexDirection: 'column' } as ViewStyle,
  justifyCenter: { justifyContent: 'center' } as ViewStyle,
  justifyBetween: { justifyContent: 'space-between' } as ViewStyle,
  itemsCenter: { alignItems: 'center' } as ViewStyle,
  selfCenter: { alignSelf: 'center' } as ViewStyle,
  
  // Positioning
  absolute: { position: 'absolute' } as ViewStyle,
  relative: { position: 'relative' } as ViewStyle,
  
  // Sizing
  w: (size: number | string) => ({ width: size } as ViewStyle),
  h: (size: number | string) => ({ height: size } as ViewStyle),
  wFull: { width: '100%' } as ViewStyle,
  hFull: { height: '100%' } as ViewStyle,
  
  // Padding
  p: (size: number) => ({ padding: size } as ViewStyle),
  px: (size: number) => ({ paddingHorizontal: size } as ViewStyle),
  py: (size: number) => ({ paddingVertical: size } as ViewStyle),
  pt: (size: number) => ({ paddingTop: size } as ViewStyle),
  pb: (size: number) => ({ paddingBottom: size } as ViewStyle),
  pl: (size: number) => ({ paddingLeft: size } as ViewStyle),
  pr: (size: number) => ({ paddingRight: size } as ViewStyle),
  
  // Margin
  m: (size: number) => ({ margin: size } as ViewStyle),
  mx: (size: number) => ({ marginHorizontal: size } as ViewStyle),
  my: (size: number) => ({ marginVertical: size } as ViewStyle),
  mt: (size: number) => ({ marginTop: size } as ViewStyle),
  mb: (size: number) => ({ marginBottom: size } as ViewStyle),
  ml: (size: number) => ({ marginLeft: size } as ViewStyle),
  mr: (size: number) => ({ marginRight: size } as ViewStyle),
  
  // Colors
  bgBlack: { backgroundColor: '#000' } as ViewStyle,
  bgWhite: { backgroundColor: '#fff' } as ViewStyle,
  bgGray: (shade: number) => ({ backgroundColor: `rgb(${shade}, ${shade}, ${shade})` } as ViewStyle),
  bgGray50: { backgroundColor: '#f9fafb' } as ViewStyle,
  bgGray100: { backgroundColor: '#f3f4f6' } as ViewStyle,
  bgGray200: { backgroundColor: '#e5e7eb' } as ViewStyle,
  bgGray300: { backgroundColor: '#d1d5db' } as ViewStyle,
  
  // Text Colors
  textBlack: { color: '#000' } as TextStyle,
  textWhite: { color: '#fff' } as TextStyle,
  textGray: (shade: number) => ({ color: `rgb(${shade}, ${shade}, ${shade})` } as TextStyle),
  textGray600: { color: '#4b5563' } as TextStyle,
  textGray700: { color: '#374151' } as TextStyle,
  textGray900: { color: '#111827' } as TextStyle,
  
  // Border Radius
  rounded: { borderRadius: 8 } as ViewStyle,
  roundedLg: { borderRadius: 12 } as ViewStyle,
  roundedXl: { borderRadius: 16 } as ViewStyle,
  rounded2xl: { borderRadius: 20 } as ViewStyle,
  rounded3xl: { borderRadius: 24 } as ViewStyle,
  
  // Font Sizes
  textXs: { fontSize: 12 } as TextStyle,
  textSm: { fontSize: 14 } as TextStyle,
  textBase: { fontSize: 16 } as TextStyle,
  textLg: { fontSize: 18 } as TextStyle,
  textXl: { fontSize: 20 } as TextStyle,
  text2xl: { fontSize: 24 } as TextStyle,
  text3xl: { fontSize: 30 } as TextStyle,
  
  // Font Weights
  fontNormal: { fontWeight: '400' } as TextStyle,
  fontMedium: { fontWeight: '500' } as TextStyle,
  fontSemibold: { fontWeight: '600' } as TextStyle,
  fontBold: { fontWeight: 'bold' } as TextStyle,
  
  // Shadow
  shadowSm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as ViewStyle,
  shadowMd: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  } as ViewStyle,
  shadowLg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  } as ViewStyle,
};

// Helper function to combine multiple styles
export const combine = (...styles: (Style | Style[] | undefined)[]): Style => {
  return Object.assign({}, ...styles.filter(Boolean).flat());
};
// Mesma hierarquia tipográfica do protótipo HTML (2.3 Tipografia)
export const fonts = {
  heading: 'PlayfairDisplay_600SemiBold',
  headingBold: 'PlayfairDisplay_700Bold',
  body: 'Lato_400Regular',
  bodyBold: 'Lato_700Bold',
  script: 'GreatVibes_400Regular'
} as const;

export const typography = {
  h1: { fontFamily: fonts.headingBold, fontSize: 28 },
  h2: { fontFamily: fonts.heading, fontSize: 22 },
  h3: { fontFamily: fonts.heading, fontSize: 17 },
  body: { fontFamily: fonts.body, fontSize: 15 },
  bodySmall: { fontFamily: fonts.body, fontSize: 13 },
  label: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 0.4 },
  button: { fontFamily: fonts.bodyBold, fontSize: 15 },
  script: { fontFamily: fonts.script, fontSize: 20 }
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999
} as const;

// Largura a partir da qual tratamos a tela como "desktop web" —
// usado pra decidir entre menu inferior (mobile) e menu superior (web larga).
export const DESKTOP_BREAKPOINT = 860;

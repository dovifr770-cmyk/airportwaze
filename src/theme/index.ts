// ─── AirportWaze Design System ────────────────────────────────────────────────
// Waze-inspired: vibrant, light, clean — not dark navy

export const Colors = {
  // Primary: Waze orange — CTAs, accents
  primary:       '#FF6B00',
  primaryLight:  '#FF8C38',
  primaryDark:   '#E05500',
  primaryBg:     '#FFF3E0',

  // Navigation blue — wayfinding, directions
  blue:          '#1A73E8',
  blueLight:     '#4A90E2',
  blueDark:      '#1557B0',
  blueBg:        '#E8F0FE',

  // Teal — gates, terminals
  teal:          '#00ACC1',
  tealBg:        '#E0F7FA',

  // Backgrounds — light
  bg:            '#F5F7FA',
  bgAlt:         '#FFFFFF',
  surface:       '#FFFFFF',
  surface2:      '#F0F4F8',

  // Text
  text:          '#1A1A2E',
  textSub:       '#4B5563',
  textMuted:     '#9CA3AF',
  textLight:     '#D1D5DB',

  // Status colors
  success:       '#00C853',
  successBg:     '#E8F5E9',
  successDark:   '#00952A',

  warning:       '#F59E0B',
  warningBg:     '#FEF3C7',
  warningDark:   '#B45309',

  danger:        '#EF4444',
  dangerBg:      '#FEE2E2',
  dangerDark:    '#B91C1C',

  info:          '#3B82F6',
  infoBg:        '#EFF6FF',

  // Map colors
  mapBg:         '#E8F4F8',
  mapGrid:       '#C8DEE8',
  mapWall:       '#B0C4CC',
  locationBlue:  '#1A73E8',

  // Tab bar (stays dark for contrast)
  navBg:         '#0F172A',
  navBorder:     '#1E293B',
  navActive:     '#FF6B00',
  navInactive:   '#64748B',

  // Cards & borders
  card:          '#FFFFFF',
  cardBorder:    '#E5E9F0',
  separator:     '#F0F2F5',

  // Overlay
  overlay:       'rgba(15,23,42,0.6)',
  overlayLight:  'rgba(0,0,0,0.1)',
} as const;

export const Radii = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  xxl:  32,
  full: 999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 10,
  },
  colored: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 8,
  }),
} as const;

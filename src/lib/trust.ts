// The pages that say who we are and how we work. The footer and the policy pages' rail list them in this order.
export const trustPages = [
  { href: '/about', label: 'About' },
  { href: '/editorial-policy', label: 'Editorial policy' },
  { href: '/finders', label: 'Finders' },
  { href: '/corrections', label: 'Corrections' },
  { href: '/takedown', label: 'Takedowns' },
] as const;

/** The date the policy pages were last changed. Update it with any change to their wording. */
export const POLICIES_UPDATED = '2026-11-24';

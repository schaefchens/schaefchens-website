/* Things that exist but are not shown yet.
 *
 * Flip a flag back to true and the section returns everywhere at once — the
 * copy, the route and the page all stay in the tree, so nothing has to be
 * rewritten to bring it back. */

/** The "Über den Glauben" teaser on the home page, and its nav and footer
 *  links. The /glaube route itself keeps working, so the page is reachable by
 *  direct URL — hidden, not removed. */
export const SHOW_FAITH = false

/** The dimmed "In Arbeit" tile that padded out each grid while there were only
 *  two entries per kind. Off — four real entries carry the page on their own. */
export const SHOW_COMING_SOON = false

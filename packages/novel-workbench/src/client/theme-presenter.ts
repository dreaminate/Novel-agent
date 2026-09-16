/**
 * Body-level projection of the resolved theme snapshot.
 *
 * `dsh-client-ui-theme` owns the theme state and the `--dsw-*` token
 * stylesheets; the projection onto the document belongs to whoever owns the
 * root, which in novel mode is this package (upstream's ui-layout carried it).
 * Behaviour mirrors the shipped presenter: `color-scheme` on the root element,
 * the dark-palette attribute and the caller's token overrides on `body`, the
 * content font-size axis, and one owned `theme-color` metadata node.
 */

/** Body attribute selecting the dark base palette in the token stylesheets. */
const DARK_ATTRIBUTE = 'data-ds-dark-theme'

/** Body variable carrying the user's content font size in px. */
const CONTENT_FONT_SIZE_VARIABLE = '--dsh-content-font-size'

/** The resolved snapshot slice this presenter needs (see `dsh-client-ui-theme`). */
export interface ThemeSnapshotLike {
  fontSize: number
  active: {
    colorScheme: 'light' | 'dark'
    tokens: Record<string, string>
  }
}

/** Applies theme snapshots to the document; one instance per plugin fiber. */
export class ThemePresenter {
  /** Token names this presenter wrote in the last apply (its retraction set). */
  private appliedTokens: string[] = []

  /** The single metadata node this presenter inserts and removes. */
  private readonly themeColorMeta: HTMLMetaElement

  constructor() {
    this.themeColorMeta = document.createElement('meta')
    this.themeColorMeta.name = 'theme-color'
  }

  /** Project one snapshot onto the document. */
  apply(snapshot: ThemeSnapshotLike): void {
    const scheme = snapshot.active.colorScheme
    document.documentElement.style.colorScheme = scheme
    const body = document.body
    if (scheme === 'dark') body.setAttribute(DARK_ATTRIBUTE, '')
    else body.removeAttribute(DARK_ATTRIBUTE)
    body.style.setProperty(CONTENT_FONT_SIZE_VARIABLE, `${snapshot.fontSize}px`)
    for (const name of this.appliedTokens) body.style.removeProperty(name)
    const names = Object.keys(snapshot.active.tokens)
    for (const name of names) {
      body.style.setProperty(name, snapshot.active.tokens[name] ?? '')
    }
    this.appliedTokens = names
    if (!this.themeColorMeta.isConnected) document.head.append(this.themeColorMeta)
    this.themeColorMeta.content = getComputedStyle(body).backgroundColor
  }

  /** Remove the owned metadata node; applied variables stay until the next apply. */
  dispose(): void {
    this.themeColorMeta.remove()
  }
}

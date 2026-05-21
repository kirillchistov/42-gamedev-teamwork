/**
 * Правила CSP для SSR (заголовок) и GitHub Pages (meta).
 * См. docs/csp.md
 */
export declare const CSP_ORIGINS: {
  readonly praktikumApi: 'https://ya-praktikum.tech'
  readonly yandexOAuth: 'https://oauth.yandex.ru'
}
/** Сериализация директив в значение заголовка / meta. */
export declare function formatCspHeader(
  directives: Record<string, string[]>
): string
/** SSR и preview: nonce для window.APP_INITIAL_STATE. */
export declare function buildSsrCspDirectives(
  nonce: string
): Record<string, string[]>
export declare function buildSsrCspHeader(
  nonce: string
): string
/** Статика GitHub Pages: без nonce, без API нашего Node. */
export declare function buildGhPagesCspDirectives(): Record<
  string,
  string[]
>
export declare function buildGhPagesCspMetaContent(): string
export declare function shouldInjectGhPagesCspMeta(): boolean

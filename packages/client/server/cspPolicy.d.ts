export declare const CSP_ORIGINS: {
  readonly praktikumApi: 'https://ya-praktikum.tech'
  readonly yandexOAuth: 'https://oauth.yandex.ru'
}
export declare function formatCspHeader(
  directives: Record<string, string[]>
): string
export declare function buildSsrCspDirectives(
  nonce: string
): Record<string, string[]>
export declare function buildSsrCspHeader(nonce: string): string
export declare function buildGhPagesCspDirectives(): Record<string, string[]>
export declare function buildGhPagesCspMetaContent(): string
export declare function shouldInjectGhPagesCspMeta(): boolean

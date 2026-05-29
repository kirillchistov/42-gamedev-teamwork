"use strict";
// Правила CSP для SSR (заголовок) и GitHub Pages (meta) по docs/csp.md
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSP_ORIGINS = void 0;
exports.formatCspHeader = formatCspHeader;
exports.buildSsrCspDirectives = buildSsrCspDirectives;
exports.buildSsrCspHeader = buildSsrCspHeader;
exports.buildGhPagesCspDirectives = buildGhPagesCspDirectives;
exports.buildGhPagesCspMetaContent = buildGhPagesCspMetaContent;
exports.shouldInjectGhPagesCspMeta = shouldInjectGhPagesCspMeta;
exports.CSP_ORIGINS = {
    praktikumApi: 'https://ya-praktikum.tech',
    yandexOAuth: 'https://oauth.yandex.ru',
    googleFontsCss: 'https://fonts.googleapis.com',
    googleFontsStatic: 'https://fonts.gstatic.com',
    /** Обратное геокодирование для демо региона в профиле (без ключа). */
    bigDataCloud: 'https://api.bigdatacloud.net',
};
function isDevEnv() {
    return process.env.NODE_ENV === 'development';
}
function isGhPagesStaticBuild() {
    const flag = process.env.VITE_STATIC_DEPLOY;
    return flag === 'gh-pages';
}
/** Только для прода с валидным TLS (Let's Encrypt). На IP + :9000 ломает загрузку ассетов. */
function shouldUpgradeInsecureRequests() {
    return process.env.CSP_UPGRADE_INSECURE === '1';
}
// Сериализация директив в значение заголовка / meta
function formatCspHeader(directives) {
    return Object.entries(directives)
        .map(([name, values]) => {
        if (values.length === 0) {
            return name;
        }
        return `${name} ${values.join(' ')}`;
    })
        .join('; ');
}
// SSR и preview: nonce для window.APP_INITIAL_STATE
function buildSsrCspDirectives(nonce) {
    const scriptSrc = ["'self'", `'nonce-${nonce}'`];
    const connectSrc = [
        "'self'",
        exports.CSP_ORIGINS.praktikumApi,
        exports.CSP_ORIGINS.yandexOAuth,
        exports.CSP_ORIGINS.bigDataCloud,
    ];
    const styleSrc = ["'self'", "'unsafe-inline'", exports.CSP_ORIGINS.googleFontsCss];
    const styleSrcElem = ["'self'", "'unsafe-inline'", exports.CSP_ORIGINS.googleFontsCss];
    const fontSrc = ["'self'", 'data:', exports.CSP_ORIGINS.googleFontsStatic];
    if (isDevEnv()) {
        scriptSrc.push("'unsafe-eval'");
        connectSrc.push('ws:', 'wss:', 'http://localhost:*', 'http://127.0.0.1:*');
    }
    const directives = {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'script-src': scriptSrc,
        'style-src': styleSrc,
        'style-src-elem': styleSrcElem,
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'font-src': fontSrc,
        'connect-src': connectSrc,
        'frame-src': [exports.CSP_ORIGINS.yandexOAuth],
        'form-action': ["'self'", exports.CSP_ORIGINS.yandexOAuth],
        'manifest-src': ["'self'"],
        'worker-src': ["'self'"],
        'object-src': ["'none'"],
    };
    if (!isDevEnv() && shouldUpgradeInsecureRequests()) {
        directives['upgrade-insecure-requests'] = [];
    }
    return directives;
}
function buildSsrCspHeader(nonce) {
    return formatCspHeader(buildSsrCspDirectives(nonce));
}
// Статика GitHub Pages: без nonce, без API нашего Node
function buildGhPagesCspDirectives() {
    return {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'font-src': ["'self'", 'data:'],
        'connect-src': ["'self'", exports.CSP_ORIGINS.praktikumApi],
        'form-action': ["'self'"],
        'manifest-src': ["'self'"],
        'worker-src': ["'self'"],
        'object-src': ["'none'"],
        'upgrade-insecure-requests': [],
    };
}
function buildGhPagesCspMetaContent() {
    return formatCspHeader(buildGhPagesCspDirectives());
}
function shouldInjectGhPagesCspMeta() {
    return isGhPagesStaticBuild();
}

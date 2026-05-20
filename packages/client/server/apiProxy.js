"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerApiProxy = registerApiProxy;
const http_proxy_middleware_1 = require("http-proxy-middleware");
const DEFAULT_PRAKTIKUM_ORIGIN = 'https://ya-praktikum.tech';
const DEFAULT_NODE_API = 'http://localhost:3000';
function trimTrailingSlash(value) {
    return value.replace(/\/+$/, '');
}
function readPraktikumOrigin() {
    var _a, _b;
    const raw = ((_a = process.env.PRAKTIKUM_API_URL) === null || _a === void 0 ? void 0 : _a.trim()) ||
        ((_b = process.env.PRAKTIKUM_ORIGIN) === null || _b === void 0 ? void 0 : _b.trim());
    if (!raw) {
        return DEFAULT_PRAKTIKUM_ORIGIN;
    }
    const normalized = trimTrailingSlash(raw);
    if (normalized.endsWith('/api/v2')) {
        return normalized.slice(0, -'/api/v2'.length);
    }
    return normalized;
}
function readNodeApiTarget() {
    var _a, _b, _c;
    const internal = (_a = process.env.INTERNAL_SERVER_URL) === null || _a === void 0 ? void 0 : _a.trim();
    if (internal) {
        return trimTrailingSlash(internal);
    }
    const external = ((_b = process.env.EXTERNAL_SERVER_URL) === null || _b === void 0 ? void 0 : _b.trim()) ||
        ((_c = process.env.VITE_APP_API_URL) === null || _c === void 0 ? void 0 : _c.trim());
    if (external) {
        return trimTrailingSlash(external);
    }
    return DEFAULT_NODE_API;
}
const sharedProxyOptions = {
    changeOrigin: true,
    cookieDomainRewrite: {
        'ya-praktikum.tech': '',
        '.ya-praktikum.tech': '',
    },
    cookiePathRewrite: {
        '/api/v2': '/api/v2',
    },
};
function nodeProxy(nodeApiTarget, mountPath) {
    const base = trimTrailingSlash(nodeApiTarget);
    const prefix = mountPath.startsWith('/')
        ? mountPath
        : `/${mountPath}`;
    return (0, http_proxy_middleware_1.createProxyMiddleware)({
        // http-proxy-middleware получает path уже без mountPath от Express.
        target: `${base}${prefix}`,
        changeOrigin: true,
    });
}
function registerApiProxy(app) {
    const praktikumOrigin = readPraktikumOrigin();
    const nodeApiTarget = readNodeApiTarget();
    app.use('/api/v2', (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: `${praktikumOrigin}/api/v2`,
        ...sharedProxyOptions,
        secure: true,
    }));
    app.use('/api/forum', nodeProxy(nodeApiTarget, '/api/forum'));
    app.use('/api/ui', nodeProxy(nodeApiTarget, '/api/ui'));
    app.use('/friends', nodeProxy(nodeApiTarget, '/friends'));
    app.use('/user', nodeProxy(nodeApiTarget, '/user'));
}

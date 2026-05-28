"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSP_NONCE_LOCAL = void 0;
exports.createCspNonce = createCspNonce;
exports.setSecurityHeaders = setSecurityHeaders;
exports.registerCspMiddleware = registerCspMiddleware;
exports.getCspNonce = getCspNonce;
exports.injectHtmlScriptNonces = injectHtmlScriptNonces;
const crypto_1 = __importDefault(require("crypto"));
const cspPolicy_1 = require("./cspPolicy");
exports.CSP_NONCE_LOCAL = 'cspNonce';
function createCspNonce(_req, res, next) {
    res.locals[exports.CSP_NONCE_LOCAL] = crypto_1.default.randomBytes(16).toString('base64');
    next();
}
function setSecurityHeaders(req, res, next) {
    var _a;
    const nonce = String((_a = res.locals[exports.CSP_NONCE_LOCAL]) !== null && _a !== void 0 ? _a : '');
    if (nonce) {
        res.setHeader('Content-Security-Policy', (0, cspPolicy_1.buildSsrCspHeader)(nonce));
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
}
function registerCspMiddleware(app) {
    app.use(createCspNonce);
    app.use(setSecurityHeaders);
}
function getCspNonce(res) {
    var _a;
    return String((_a = res.locals[exports.CSP_NONCE_LOCAL]) !== null && _a !== void 0 ? _a : '');
}
/** Nonce на все <script> из Vite index.html (module entry и т.д.), кроме уже помеченных. */
function injectHtmlScriptNonces(html, nonce) {
    if (!nonce)
        return html;
    return html.replace(/<script(?![^>]*\snonce=)(?=[\s>])/gi, `<script nonce="${nonce}"`);
}

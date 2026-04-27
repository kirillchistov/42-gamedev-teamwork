"use strict";
// Express для SSR: в dev — Vite в 'middlewareMode', в prod — статика 'dist/client' и серверный бандл;
// парсинг cookie, сериализация начального состояния Redux в HTML.
// 7.1.1 Добавил GET /health, GET /ssr-static (отдельный render-функционал)
// 7.1.1 Вынес загрузку SSR-модуля в helper (resolveSsrRender)
// 7.1.1 Добавил централизованный error handler
// 7.1.1 Сохранил текущий app.get('*') для основного SSR "из коробки"
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const vite_1 = require("vite");
const serialize_javascript_1 = __importDefault(require("serialize-javascript"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const static_page_1 = require("./static-page");
const clientPath = path_1.default.join(__dirname, '..');
const isDev = process.env.NODE_ENV === 'development';
const FALLBACK_PORTS = [3000, 5000, 9000, 8080];
let prodTemplateCache = null;
function toValidPort(value) {
    if (!value)
        return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) ||
        parsed < 1 ||
        parsed > 65535) {
        return null;
    }
    return parsed;
}
function resolvePortCandidates() {
    const candidates = [
        toValidPort(process.env.PORT),
        toValidPort(process.env.CLIENT_PORT),
        ...FALLBACK_PORTS,
    ].filter((port) => port !== null);
    return [...new Set(candidates)];
}
async function sendRouterResponse(response, res) {
    response.headers.forEach((value, key) => {
        if (key.toLowerCase() === 'set-cookie') {
            return;
        }
        res.setHeader(key, value);
    });
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
        res.append('set-cookie', setCookieHeader);
    }
    const body = await response.text();
    if (body) {
        res.status(response.status).send(body);
        return;
    }
    res.sendStatus(response.status);
}
function isRouterResponse(value) {
    if (typeof value !== 'object' ||
        value === null) {
        return false;
    }
    const maybeResponse = value;
    return (typeof maybeResponse.status === 'number' &&
        typeof maybeResponse.text === 'function' &&
        typeof maybeResponse.headers === 'object' &&
        maybeResponse.headers !== null &&
        typeof maybeResponse.headers.get === 'function' &&
        typeof maybeResponse.headers.forEach ===
            'function');
}
async function resolveSsrRender(vite, url) {
    if (vite) {
        let template = await promises_1.default.readFile(path_1.default.resolve(clientPath, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const ssrModule = await vite.ssrLoadModule(path_1.default.join(clientPath, 'src/entry-server.tsx'));
        return {
            render: ssrModule.render,
            template,
        };
    }
    if (!prodTemplateCache) {
        prodTemplateCache = await promises_1.default.readFile(path_1.default.join(clientPath, 'dist/client/index.html'), 'utf-8');
    }
    const pathToServer = path_1.default.join(clientPath, 'dist/server/entry-server.js');
    const ssrModule = await Promise.resolve(`${pathToServer}`).then(s => __importStar(require(s)));
    return {
        render: ssrModule.render,
        template: prodTemplateCache,
    };
}
function registerCommonRoutes(app) {
    app.get('/health', (_req, res) => {
        res.status(200).json({
            ok: true,
            mode: isDev ? 'development' : 'production',
        });
    });
    // SSR-маршрут без Redux: только renderToString + res.send.
    app.get('/ssr-static', (_req, res) => {
        res
            .status(200)
            .set({ 'Content-Type': 'text/html' })
            .send((0, static_page_1.renderStaticPageHtml)());
    });
}
function registerErrorHandler(app) {
    app.use((err, _req, res, next) => {
        // Error handler must keep 4 args signature for Express.
        void next;
        console.error(err);
        res
            .status(500)
            .type('text/plain')
            .send('SSR error');
    });
}
async function createServer() {
    const app = (0, express_1.default)();
    const portCandidates = resolvePortCandidates();
    app.use((0, cookie_parser_1.default)());
    let vite;
    if (isDev) {
        vite = await (0, vite_1.createServer)({
            server: { middlewareMode: true },
            root: clientPath,
            appType: 'custom',
        });
        app.use(vite.middlewares);
    }
    else {
        app.use(express_1.default.static(path_1.default.join(clientPath, 'dist/client'), { index: false }));
    }
    registerCommonRoutes(app);
    app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
            const { render, template } = await resolveSsrRender(vite, url);
            // Получаю HTML-строку из JSX
            const { html: appHtml, initialState, helmet, styleTags, } = await render(req);
            // Заменяю комментарий на сгенерированную HTML-строку
            const html = template
                .replace('<!--ssr-styles-->', styleTags)
                .replace(`<!--ssr-helmet-->`, `${helmet.meta.toString()} ${helmet.title.toString()} ${helmet.link.toString()}`)
                .replace(`<!--ssr-outlet-->`, appHtml)
                .replace(`<!--ssr-initial-state-->`, `<script>window.APP_INITIAL_STATE = ${(0, serialize_javascript_1.default)(initialState, {
                isJSON: true,
            })}</script>`);
            // Завершаю запрос и отдаю HTML-страницу
            res
                .status(200)
                .set({ 'Content-Type': 'text/html' })
                .end(html);
        }
        catch (e) {
            if (isRouterResponse(e)) {
                await sendRouterResponse(e, res);
                return;
            }
            vite === null || vite === void 0 ? void 0 : vite.ssrFixStacktrace(e);
            next(e);
        }
    });
    registerErrorHandler(app);
    const tryListen = (index) => {
        const port = portCandidates[index];
        if (port === undefined) {
            throw new Error('No available port from PORT/CLIENT_PORT/fallback list');
        }
        const server = app
            .listen(port, () => {
            console.log(`Client is listening on port: ${port}`);
        })
            .on('error', err => {
            if (err.code ===
                'EADDRINUSE' &&
                index < portCandidates.length - 1) {
                console.warn(`Port ${port} is busy, trying next port...`);
                tryListen(index + 1);
                return;
            }
            throw err;
        });
        return server;
    };
    tryListen(0);
}
createServer();

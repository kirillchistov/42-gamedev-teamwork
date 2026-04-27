"use strict";
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
// Express для SSR: в dev — Vite в 'middlewareMode', в prod — статика 'dist/client' и серверный бандл;
// парсинг cookie, сериализация начального состояния Redux в HTML.
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const vite_1 = require("vite");
const serialize_javascript_1 = __importDefault(require("serialize-javascript"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const static_page_1 = require("./static-page");
const port = Number(process.env.PORT) || 80;
const clientPath = path_1.default.join(__dirname, '..');
const isDev = process.env.NODE_ENV === 'development';
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
    const template = await promises_1.default.readFile(path_1.default.join(clientPath, 'dist/client/index.html'), 'utf-8');
    const pathToServer = path_1.default.join(clientPath, 'dist/server/entry-server.js');
    const ssrModule = await Promise.resolve(`${pathToServer}`).then(s => __importStar(require(s)));
    return {
        render: ssrModule.render,
        template,
    };
}
function registerCommonRoutes(app) {
    app.get('/health', (_req, res) => {
        res.status(200).json({
            ok: true,
            mode: isDev ? 'development' : 'production',
        });
    });
    // Формальный SSR-маршрут без Redux: демонстрирует renderToString + res.send.
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
async function tryHandleRouterResponse(maybeResponse, res) {
    var _a;
    if (!isRouterResponse(maybeResponse)) {
        return false;
    }
    const location = maybeResponse.headers.get('location');
    if (location) {
        res.redirect(maybeResponse.status || 302, location);
        return true;
    }
    const text = await maybeResponse
        .text()
        .catch(() => '');
    res
        .status(maybeResponse.status || 500)
        .set({
        'Content-Type': (_a = maybeResponse.headers.get('content-type')) !== null && _a !== void 0 ? _a : 'text/plain',
    })
        .send(text);
    return true;
}
function isRouterResponse(value) {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const candidate = value;
    return (typeof candidate.status === 'number' &&
        typeof candidate.text === 'function' &&
        !!candidate.headers &&
        typeof candidate.headers.get === 'function');
}
async function createServer() {
    const app = (0, express_1.default)();
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
            if (await tryHandleRouterResponse(e, res)) {
                return;
            }
            vite === null || vite === void 0 ? void 0 : vite.ssrFixStacktrace(e);
            next(e);
        }
    });
    registerErrorHandler(app);
    app.listen(port, () => {
        console.log(`Client is listening on port: ${port}`);
    });
}
createServer();

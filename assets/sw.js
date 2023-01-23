// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function toHttpError(error, status) {
    const httpError = new HttpError(status, error.message);
    httpError.stack = error.stack;
    return httpError;
}
class HttpError extends Error {
    constructor(status, message){
        super(message);
        this.status = status;
    }
    status;
}
var Status;
(function(Status) {
    Status[Status["OK"] = 200] = "OK";
    Status[Status["Created"] = 201] = "Created";
    Status[Status["Accepted"] = 202] = "Accepted";
    Status[Status["NoContent"] = 204] = "NoContent";
    Status[Status["MovedPermanently"] = 301] = "MovedPermanently";
    Status[Status["Found"] = 302] = "Found";
    Status[Status["SeeOther"] = 303] = "SeeOther";
    Status[Status["NotModified"] = 304] = "NotModified";
    Status[Status["BadRequest"] = 400] = "BadRequest";
    Status[Status["Unauthorized"] = 401] = "Unauthorized";
    Status[Status["Forbidden"] = 403] = "Forbidden";
    Status[Status["NotFound"] = 404] = "NotFound";
    Status[Status["MethodNotAllowed"] = 405] = "MethodNotAllowed";
    Status[Status["MisdirectedRequest"] = 421] = "MisdirectedRequest";
    Status[Status["InternalServerError"] = 500] = "InternalServerError";
    Status[Status["ServiceUnavailable"] = 503] = "ServiceUnavailable";
})(Status || (Status = {}));
class Context {
    response;
    params;
    query;
    constructor(app, state, request, match){
        this.app = app;
        this.state = state;
        this.request = request;
        this.params = {};
        this.app = app;
        this.params = {};
        for (const [key, value] of Object.entries(match.params)){
            this.params[key] = decodeURIComponent(value);
        }
        this.query = new URLSearchParams(request.url.split("?")[1]);
        this.response = new Response(null, {
            status: Status.OK
        });
    }
    assert(condition, status, message) {
        if (!condition) {
            throw new HttpError(status, message);
        }
    }
    throws(status, message) {
        throw new HttpError(status, message);
    }
    plain(data) {
        this.#createResponse(String(data), "text/plain");
    }
    json(data) {
        this.#createResponse(JSON.stringify(data), "application/json");
    }
    view(name, data = {}, options = {}) {
        const engine = this.app.engine;
        const html = engine.view(name, {
            ...this.state,
            ...data
        }, options);
        this.#createResponse(html, "text/html");
    }
    partial(name, data = {}, options = {}) {
        const engine = this.app.engine;
        const html = engine.partial(name, {
            ...this.state,
            ...data
        }, options);
        this.#createResponse(html, "text/html");
    }
    #createResponse(data, contentType) {
        const headers = this.response.headers;
        const status = this.response.status;
        if (!headers.has("Content-Type")) {
            headers.set("Content-Type", contentType);
        }
        const dataPromise = data instanceof Promise ? data : Promise.resolve(data);
        this.app.response = dataPromise.then((data)=>new Response(String(data), {
                headers,
                status
            })).catch((error)=>{
            throw toHttpError(error, Status.InternalServerError);
        });
    }
    app;
    state;
    request;
}
var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for(var s, i = 1, n = arguments.length; i < n; i++){
            s = arguments[i];
            for(var p in s)if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
function lexer(str) {
    var tokens = [];
    var i = 0;
    while(i < str.length){
        var __char = str[i];
        if (__char === "*" || __char === "+" || __char === "?") {
            tokens.push({
                type: "MODIFIER",
                index: i,
                value: str[i++]
            });
            continue;
        }
        if (__char === "\\") {
            tokens.push({
                type: "ESCAPED_CHAR",
                index: i++,
                value: str[i++]
            });
            continue;
        }
        if (__char === "{") {
            tokens.push({
                type: "OPEN",
                index: i,
                value: str[i++]
            });
            continue;
        }
        if (__char === "}") {
            tokens.push({
                type: "CLOSE",
                index: i,
                value: str[i++]
            });
            continue;
        }
        if (__char === ":") {
            var name = "";
            var j = i + 1;
            while(j < str.length){
                var code = str.charCodeAt(j);
                if (code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95) {
                    name += str[j++];
                    continue;
                }
                break;
            }
            if (!name) throw new TypeError("Missing parameter name at " + i);
            tokens.push({
                type: "NAME",
                index: i,
                value: name
            });
            i = j;
            continue;
        }
        if (__char === "(") {
            var count = 1;
            var pattern = "";
            var j = i + 1;
            if (str[j] === "?") {
                throw new TypeError("Pattern cannot start with \"?\" at " + j);
            }
            while(j < str.length){
                if (str[j] === "\\") {
                    pattern += str[j++] + str[j++];
                    continue;
                }
                if (str[j] === ")") {
                    count--;
                    if (count === 0) {
                        j++;
                        break;
                    }
                } else if (str[j] === "(") {
                    count++;
                    if (str[j + 1] !== "?") {
                        throw new TypeError("Capturing groups are not allowed at " + j);
                    }
                }
                pattern += str[j++];
            }
            if (count) throw new TypeError("Unbalanced pattern at " + i);
            if (!pattern) throw new TypeError("Missing pattern at " + i);
            tokens.push({
                type: "PATTERN",
                index: i,
                value: pattern
            });
            i = j;
            continue;
        }
        tokens.push({
            type: "CHAR",
            index: i,
            value: str[i++]
        });
    }
    tokens.push({
        type: "END",
        index: i,
        value: ""
    });
    return tokens;
}
function parse(str, options) {
    if (options === void 0) {
        options = {};
    }
    var tokens = lexer(str);
    var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
    var defaultPattern = "[^" + escapeString(options.delimiter || "/#?") + "]+?";
    var result = [];
    var key = 0;
    var i = 0;
    var path = "";
    var tryConsume = function(type) {
        if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
    };
    var mustConsume = function(type) {
        var value = tryConsume(type);
        if (value !== undefined) return value;
        var _a = tokens[i], nextType = _a.type, index = _a.index;
        throw new TypeError("Unexpected " + nextType + " at " + index + ", expected " + type);
    };
    var consumeText = function() {
        var result = "";
        var value;
        while(value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")){
            result += value;
        }
        return result;
    };
    while(i < tokens.length){
        var __char = tryConsume("CHAR");
        var name = tryConsume("NAME");
        var pattern = tryConsume("PATTERN");
        if (name || pattern) {
            var prefix = __char || "";
            if (prefixes.indexOf(prefix) === -1) {
                path += prefix;
                prefix = "";
            }
            if (path) {
                result.push(path);
                path = "";
            }
            result.push({
                name: name || key++,
                prefix: prefix,
                suffix: "",
                pattern: pattern || defaultPattern,
                modifier: tryConsume("MODIFIER") || ""
            });
            continue;
        }
        var value = __char || tryConsume("ESCAPED_CHAR");
        if (value) {
            path += value;
            continue;
        }
        if (path) {
            result.push(path);
            path = "";
        }
        var open = tryConsume("OPEN");
        if (open) {
            var prefix = consumeText();
            var name_1 = tryConsume("NAME") || "";
            var pattern_1 = tryConsume("PATTERN") || "";
            var suffix = consumeText();
            mustConsume("CLOSE");
            result.push({
                name: name_1 || (pattern_1 ? key++ : ""),
                pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
                prefix: prefix,
                suffix: suffix,
                modifier: tryConsume("MODIFIER") || ""
            });
            continue;
        }
        mustConsume("END");
    }
    return result;
}
function escapeString(str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
    return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path, keys) {
    if (!keys) return path;
    var groups = path.source.match(/\((?!\?)/g);
    if (groups) {
        for(var i = 0; i < groups.length; i++){
            keys.push({
                name: i,
                prefix: "",
                suffix: "",
                modifier: "",
                pattern: ""
            });
        }
    }
    return path;
}
function arrayToRegexp(paths, keys, options) {
    var parts = paths.map(function(path) {
        return pathToRegexp(path, keys, options).source;
    });
    return new RegExp("(?:" + parts.join("|") + ")", flags(options));
}
function stringToRegexp(path, keys, options) {
    return tokensToRegexp(parse(path, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
    if (options === void 0) {
        options = {};
    }
    var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
        return x;
    } : _d;
    var endsWith = "[" + escapeString(options.endsWith || "") + "]|$";
    var delimiter = "[" + escapeString(options.delimiter || "/#?") + "]";
    var route = start ? "^" : "";
    for(var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++){
        var token = tokens_1[_i];
        if (typeof token === "string") {
            route += escapeString(encode(token));
        } else {
            var prefix = escapeString(encode(token.prefix));
            var suffix = escapeString(encode(token.suffix));
            if (token.pattern) {
                if (keys) keys.push(token);
                if (prefix || suffix) {
                    if (token.modifier === "+" || token.modifier === "*") {
                        var mod = token.modifier === "*" ? "?" : "";
                        route += "(?:" + prefix + "((?:" + token.pattern + ")(?:" + suffix + prefix + "(?:" + token.pattern + "))*)" + suffix + ")" + mod;
                    } else {
                        route += "(?:" + prefix + "(" + token.pattern + ")" + suffix + ")" + token.modifier;
                    }
                } else {
                    route += "(" + token.pattern + ")" + token.modifier;
                }
            } else {
                route += "(?:" + prefix + suffix + ")" + token.modifier;
            }
        }
    }
    if (end) {
        if (!strict) route += delimiter + "?";
        route += !options.endsWith ? "$" : "(?=" + endsWith + ")";
    } else {
        var endToken = tokens[tokens.length - 1];
        var isEndDelimited = typeof endToken === "string" ? delimiter.indexOf(endToken[endToken.length - 1]) > -1 : endToken === undefined;
        if (!strict) {
            route += "(?:" + delimiter + "(?=" + endsWith + "))?";
        }
        if (!isEndDelimited) {
            route += "(?=" + delimiter + "|" + endsWith + ")";
        }
    }
    return new RegExp(route, flags(options));
}
function pathToRegexp(path, keys, options) {
    if (path instanceof RegExp) return regexpToRegexp(path, keys);
    if (Array.isArray(path)) return arrayToRegexp(path, keys, options);
    return stringToRegexp(path, keys, options);
}
var Router = function() {
    function Router() {
        this.routes = [];
    }
    Router.prototype.all = function(path, handler, options) {
        if (options === void 0) {
            options = {};
        }
        return this._push('ALL', path, handler, options);
    };
    Router.prototype.get = function(path, handler, options) {
        if (options === void 0) {
            options = {};
        }
        return this._push('GET', path, handler, options);
    };
    Router.prototype.post = function(path, handler, options) {
        if (options === void 0) {
            options = {};
        }
        return this._push('POST', path, handler, options);
    };
    Router.prototype.put = function(path, handler, options) {
        if (options === void 0) {
            options = {};
        }
        return this._push('PUT', path, handler, options);
    };
    Router.prototype.patch = function(path, handler, options) {
        if (options === void 0) {
            options = {};
        }
        return this._push('PATCH', path, handler, options);
    };
    Router.prototype["delete"] = function(path, handler, options) {
        if (options === void 0) {
            options = {};
        }
        return this._push('DELETE', path, handler, options);
    };
    Router.prototype.head = function(path, handler, options) {
        if (options === void 0) {
            options = {};
        }
        return this._push('HEAD', path, handler, options);
    };
    Router.prototype.options = function(path, handler, options) {
        if (options === void 0) {
            options = {};
        }
        return this._push('OPTIONS', path, handler, options);
    };
    Router.prototype.match = function(method, path) {
        for(var _i = 0, _a = this.routes; _i < _a.length; _i++){
            var route = _a[_i];
            if (route.method !== method && route.method !== 'ALL') continue;
            if (route.path === '(.*)') {
                return __assign(__assign({}, route), {
                    params: {
                        '0': route.path
                    }
                });
            }
            if (route.path === '/' && route.options.end === false) {
                return __assign(__assign({}, route), {
                    params: {}
                });
            }
            var matches = route.regexp.exec(path);
            if (!matches || !matches.length) continue;
            return __assign(__assign({}, route), {
                matches: matches,
                params: keysToParams(matches, route.keys)
            });
        }
        return null;
    };
    Router.prototype._push = function(method, path, handler, options) {
        var keys = [];
        if (path === '*') {
            path = '(.*)';
        }
        var regexp = pathToRegexp(path, keys, options);
        this.routes.push({
            method: method,
            path: path,
            handler: handler,
            keys: keys,
            options: options,
            regexp: regexp
        });
        return this;
    };
    return Router;
}();
var keysToParams = function(matches, keys) {
    var params = {};
    for(var i = 1; i < matches.length; i++){
        var key = keys[i - 1];
        var prop = key.name;
        var val = matches[i];
        if (val !== undefined) {
            params[prop] = val;
        }
    }
    return params;
};
class ViewEngine {
    options;
    fetch;
    constructor(engine, options = {}){
        this.engine = engine;
        this.options = {
            rootPath: ".",
            viewPath: "views",
            partialPath: "partials",
            layoutPath: "layouts",
            extName: ".hbs",
            layout: "main",
            ...options
        };
    }
    getViewPath(options) {
        const rootPath = options?.rootPath || this.options.rootPath;
        const viewPath = options?.viewPath || this.options.viewPath;
        return `${rootPath}/${viewPath}`;
    }
    getPartialPath(options) {
        const partialPath = options?.partialPath || this.options.partialPath;
        return `${this.getViewPath(options)}/${partialPath}`;
    }
    getLayoutPath(options) {
        const layoutPath = options?.layoutPath || this.options.layoutPath;
        return `${this.getViewPath(options)}/${layoutPath}`;
    }
    async install(setup) {
        if (setup.fetch) {
            this.fetch = setup.fetch;
        } else {
            this.fetch = fetch;
        }
        const promises = [];
        for (const value of Object.values(setup.partials)){
            promises.push(this.registerPartial(value));
        }
        await Promise.all(promises);
    }
    async getTemplate(path, template, options) {
        const extName = options?.extName || this.options.extName;
        const res = await this.fetch(`${path}/${template + extName}`);
        const content = await res.text();
        return content;
    }
    async getViewTemplate(template, options) {
        const path = this.getViewPath(options);
        const content = await this.getTemplate(path, template, options);
        return content;
    }
    async getPartialTemplate(template, options) {
        const path = this.getPartialPath(options);
        const content = await this.getTemplate(path, template, options);
        return content;
    }
    async getLayoutTemplate(template, options) {
        const path = this.getLayoutPath(options);
        const content = await this.getTemplate(path, template, options);
        return content;
    }
    engine;
}
class Router1 extends Router {
    engine;
    #errorRoutes = new Map();
    get errorRoutes() {
        return this.#errorRoutes;
    }
    appState;
    request;
    response;
    hooks = new Set();
    constructor(){
        super();
        this.appState = {};
    }
    setState(state) {
        for (const [key, value] of Object.entries(state)){
            this.appState[key] = value;
        }
    }
    setViewEngine(engine) {
        this.engine = engine;
    }
    setErrorHandler(status, handler) {
        if (!handler) {
            handler = (context)=>context.view(status.toString(), {
                    title: Status[status]
                });
        }
        this.#errorRoutes.set(status, handler);
    }
    listen(event) {
        const request = event.request;
        const { pathname  } = new URL(request.url);
        const match = this.match(request.method, pathname);
        if (match) {
            const context = new Context(this, this.appState, request, match);
            event.respondWith(this.#handleRequest(context, match));
        }
    }
    async #handleRequest(context, match) {
        try {
            for (const hook of this.hooks){
                const hookFn = "onRequest" in hook ? hook.onRequest : hook;
                if ("function" === typeof hookFn) {
                    const respond = await hookFn(context, match.options);
                    if (respond === false) {
                        return;
                    }
                }
            }
            const handler = match.handler;
            const response = await this.#executeHandler(handler, context);
            if (response) return response;
            return new Response(null, {
                status: Status.NoContent
            });
        } catch (error) {
            return this.#handleError(context, match, error);
        }
    }
    async #handleError(context1, match1, error1) {
        try {
            const status1 = error1 instanceof HttpError ? error1.status : Status.InternalServerError;
            for (const hook1 of this.hooks){
                const hookFn1 = "onError" in hook1 ? hook1.onError : hook1;
                if ("function" === typeof hookFn1) {
                    const respond1 = await hookFn1(context1, match1.options);
                    if (respond1 === false) {
                        return;
                    }
                }
            }
            const handler1 = this.errorRoutes.get(status1);
            context1.state.error = error1;
            if (handler1) {
                const response1 = await this.#executeHandler(handler1, context1);
                if (response1) return response1;
            }
            return new Response(error1.message, {
                status: status1
            });
        } catch  {
            const status11 = Status.InternalServerError;
            const handler2 = this.errorRoutes.get(status11);
            if (handler2) {
                const response2 = await this.#executeHandler(handler2, context1);
                if (response2) return response2;
            }
            return new Response(error1.message, {
                status: status11
            });
        }
    }
    async #executeHandler(handler3, context2) {
        let response3 = await handler3(context2);
        response3 = response3 ?? await this.response;
        if (response3) return response3;
    }
}
function logging() {
    return {
        onRequest: (context)=>{
            console.info(context.request.method + " " + context.request.url, {
                headers: Object.fromEntries(context.request.headers),
                status: context.request.status,
                state: context.state
            });
        },
        onError: (context)=>{
            console.error(context.state.error);
            console.log(context.request.method + " " + context.request.url, {
                headers: Object.fromEntries(context.request.headers),
                status: context.request.status,
                state: context.state
            });
        }
    };
}
class OnlineState {
    #options = {
        downlink: 0.5,
        latency: 750
    };
    get hasConnectionData() {
        return "connection" in navigator;
    }
    downlink = null;
    effectiveType = null;
    rtt = null;
    type = null;
    saveData = null;
    get ok() {
        if (this.downlink !== null && this.rtt !== null) {
            return navigator.onLine && this.downlink >= this.#options.downlink && this.rtt <= this.#options.latency;
        }
        return navigator.onLine;
    }
    constructor(options = {}){
        this.#options = {
            ...this.#options,
            ...options
        };
    }
    update = ()=>{
        if (!this.hasConnectionData) return;
        this.downlink = navigator.connection.downlink;
        this.effectiveType = navigator.connection.effectiveType;
        this.rtt = navigator.connection.rtt;
        this.type = navigator.connection.type;
        this.saveData = navigator.connection.saveData;
    };
    toJSON() {
        const { downlink , effectiveType , rtt , type , saveData , ok  } = this;
        return {
            downlink,
            effectiveType,
            rtt,
            type,
            saveData,
            ok
        };
    }
}
function onlineState(options = {}) {
    const onlineState = new OnlineState(options);
    return {
        onRequest: (context, options)=>{
            onlineState.update();
            context.state.onlineState = onlineState.toJSON();
            const ok = onlineState.ok;
            if (options.offline === "throw" && !ok) {
                throw new HttpError(Status.ServiceUnavailable, "Service Unavailable");
            }
            if (options.offline === "only" && ok) {
                return false;
            }
        }
    };
}
function pathHook() {
    return (context)=>{
        const url = new URL(context.request.url);
        context.state.currentPath = url.pathname;
    };
}
const mod = {
    logging: logging,
    onlineState: onlineState,
    path: pathHook
};
function is(index, keys, data) {
    const prefixOrKey = keys[index];
    if (prefixOrKey === "not") {
        const nextKey = keys[index + 1];
        return [
            !data[nextKey],
            2
        ];
    }
    return [
        !!data[prefixOrKey],
        1
    ];
}
function ifHelper(data, node, subAst) {
    if (!node.addition) {
        return "";
    }
    const addition = node.addition.split(/\s+/);
    let [condition, incr] = is(0, addition, data);
    for(let i = incr; i < addition.length; i++){
        const key = addition[i];
        switch(key){
            case "and":
                {
                    const [result, incr1] = is(i + 1, addition, data);
                    condition = condition && result;
                    i += incr1;
                    break;
                }
            case "or":
                {
                    const [result1, incr2] = is(i + 1, addition, data);
                    condition = condition || result1;
                    i += incr2;
                    break;
                }
        }
    }
    const elseIndex = subAst.findIndex((node)=>"string" !== typeof node && node.type === "variable" && node.key === "else");
    if (elseIndex !== -1) {
        if (condition) {
            return this.execute(subAst.slice(0, elseIndex), data);
        }
        return this.execute(subAst.slice(elseIndex + 1), data);
    }
    if (condition) {
        return this.execute(subAst, data);
    }
    return "";
}
function eachHelper(data, node, subAst) {
    if (!node.addition) {
        return "";
    }
    const [listName, rest] = node.addition.split(/\s+as\s+/);
    const [itemName = "this", keyName = "key", indexName = "index"] = rest.split(/\s*,\s*/);
    const map = new Map(Object.entries(data[listName]));
    const elseIndex = subAst.findIndex((node)=>"string" !== typeof node && node.type === "variable" && node.key === "else");
    if (map.size === 0) {
        if (elseIndex > -1) {
            const elseAst = subAst.slice(elseIndex + 1);
            return this.execute(elseAst, data);
        }
        return "";
    }
    const eachSubAst = subAst.slice(0, elseIndex > -1 ? elseIndex : undefined);
    let result = "";
    let index = 0;
    for (const [key, value] of map){
        const newData = {
            ...data,
            [itemName]: value
        };
        if (keyName === indexName) {
            newData[indexName] = index;
        } else {
            newData[keyName] = key;
            newData[indexName] = index;
        }
        result += this.execute(eachSubAst, newData);
        index++;
    }
    return result;
}
function setHelper(data, node) {
    if (!node.addition) {
        return "";
    }
    const [, key, value] = node.addition.match(/(\w[\w\d_]+)\s*=\s*(.*)/);
    data[key] = value;
    return "";
}
function withHelper(data, node, subAst) {
    if (!node.addition) {
        return "";
    }
    const key = node.addition;
    const newData = data[key];
    const elseIndex = subAst.findIndex((node)=>"string" !== typeof node && node.type === "variable" && node.key === "else");
    if (elseIndex > -1) {
        const elseAst = subAst.slice(elseIndex + 1);
        if (!newData) {
            return this.execute(elseAst, data);
        } else {
            subAst = subAst.slice(0, elseIndex);
        }
    }
    return this.execute(subAst, {
        ...newData
    });
}
class Bart {
    #depthMap = new Map();
    options;
    partials = new Map();
    helpers = new Map([
        [
            "if",
            ifHelper
        ],
        [
            "each",
            eachHelper
        ],
        [
            "with",
            withHelper
        ],
        [
            "set",
            setHelper
        ]
    ]);
    tags = new Set();
    constructor(options = {}){
        this.options = {
            escape: "\\",
            delimiters: [
                "{{",
                "}}"
            ],
            rawDelimiters: [
                "{",
                "}"
            ],
            helperDelimiters: [
                "#",
                ""
            ],
            partialDelimiters: [
                ">",
                ""
            ],
            closeDelimiters: [
                "/",
                ""
            ],
            ...options
        };
        if (this.options.partials) {
            this.registerPartials(this.options.partials);
        }
        this.tags.add(this.#raw);
        this.tags.add(this.#helpers);
        this.tags.add(this.#partials);
        this.tags.add(this.#close);
        this.tags.add(this.#variable);
    }
    registerPartials(partials) {
        for (const [name, partial] of Object.entries(partials)){
            if (Array.isArray(partial)) {
                this.partials.set(name, partial);
            } else {
                this.partials.set(name, this.parse(partial));
            }
        }
    }
    registerHelper(key, helper) {
        this.helpers.set(key, (data, node, subAst)=>{
            const args = node.addition?.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
            const parsedArgs = args.map((arg)=>{
                if (arg.startsWith('"') && arg.endsWith('"')) {
                    return arg.slice(1, -1);
                }
                return data[arg];
            });
            const content = this.execute(subAst, data);
            return helper(content, ...parsedArgs);
        });
    }
    parse(template) {
        const ast = [];
        const [delimiterStart, delimiterEnd] = this.options.delimiters;
        let current = 0;
        while(current < template.length){
            let start = template.indexOf(delimiterStart, current);
            let end = template.indexOf(delimiterEnd, start);
            if (start === -1 || end === -1) {
                break;
            }
            const escapedStart = template.slice(start - 1, start);
            if (escapedStart === this.options.escape) {
                start = template.indexOf(delimiterStart, start + delimiterStart.length);
                if (start === -1) {
                    break;
                }
            }
            const escapedEnd = template.slice(end - 1, end);
            if (escapedEnd === this.options.escape) {
                end = template.indexOf(delimiterEnd, end + delimiterEnd.length);
                if (end === -1) {
                    break;
                }
            }
            const text = template.slice(current, start);
            if (text) {
                ast.push(text);
            }
            inner: for (const handleTag of this.tags){
                const node = handleTag(template, start, end);
                if (node) {
                    ast.push(node);
                    current = node.end;
                    break inner;
                }
            }
        }
        if (current < template.length) {
            const text1 = template.slice(current);
            if (text1) {
                ast.push(text1);
            }
        }
        return ast;
    }
    #getDelimiters([prefix, suffix] = [
        "",
        ""
    ]) {
        const [delimiterStart, delimiterEnd] = this.options.delimiters;
        return [
            delimiterStart + prefix,
            suffix + delimiterEnd
        ];
    }
    #raw = (template, start, end)=>{
        const [startDelimiter, endDelimiter] = this.#getDelimiters(this.options.rawDelimiters);
        end = end + endDelimiter.length;
        const tag = template.slice(start, end);
        if (tag.startsWith(startDelimiter) && tag.endsWith(endDelimiter)) {
            const key = tag.slice(startDelimiter.length, -endDelimiter.length);
            return {
                type: "raw",
                key,
                tag,
                start,
                end
            };
        }
    };
    #variable = (template, start, end)=>{
        const [delimiterStart, delimiterEnd] = this.#getDelimiters();
        end = end + delimiterEnd.length;
        const tag = template.slice(start, end);
        const content = tag.slice(delimiterStart.length, -delimiterEnd.length);
        const key = /^(\w[\w\d_.\[\]]+)/.exec(content)?.[1] ?? "";
        const node = {
            type: "variable",
            key,
            tag,
            start,
            end
        };
        const addition = content.slice(key.length).trim();
        if (addition) {
            node.addition = addition;
        }
        return node;
    };
    #helpers = (template, start, end)=>{
        const [startDelimiter, endDelimiter] = this.#getDelimiters(this.options.helperDelimiters);
        const [prefix] = this.options.helperDelimiters;
        end = end + endDelimiter.length;
        const tag = template.slice(start, end);
        if (tag.startsWith(startDelimiter) && tag.endsWith(endDelimiter)) {
            const content = tag.slice(startDelimiter.length, -endDelimiter.length);
            const keyRE = /^(\w[\w\d\_]+)/;
            const key = keyRE.exec(content)?.[1] ?? "";
            const depth = this.#depthMap.get(key) || 0;
            this.#depthMap.set(key, depth + 1);
            const node = {
                type: "helper",
                key,
                tag,
                start,
                end,
                depth
            };
            const addition = content.slice(key.length + prefix.length).trim();
            if (addition) {
                node.addition = addition;
            }
            return node;
        }
    };
    #partials = (template, start, end)=>{
        const [startDelimiter, endDelimiter] = this.#getDelimiters(this.options.partialDelimiters);
        end = end + endDelimiter.length;
        const tag = template.slice(start, end);
        if (tag.startsWith(startDelimiter) && tag.endsWith(endDelimiter)) {
            const key = tag.slice(startDelimiter.length, -endDelimiter.length);
            const depth = this.#depthMap.get(key) || 0;
            this.#depthMap.set(key, depth + 1);
            return {
                type: "partial",
                key,
                tag,
                depth,
                start,
                end
            };
        }
    };
    #close = (template, start, end)=>{
        const [startDelimiter, endDelimiter] = this.#getDelimiters(this.options.closeDelimiters);
        end = end + endDelimiter.length;
        const tag = template.slice(start, end);
        if (tag.startsWith(startDelimiter) && tag.endsWith(endDelimiter)) {
            const key = tag.slice(startDelimiter.length, -endDelimiter.length);
            if (!this.#depthMap.has(key)) {
                throw new Error(`Unexpected close tag: ${tag}`);
            }
            const depth = this.#depthMap.get(key) - 1 || 0;
            if (depth < 0) {
                this.#depthMap.delete(key);
            } else {
                this.#depthMap.set(key, depth);
            }
            return {
                type: "close",
                key,
                tag,
                depth,
                start,
                end
            };
        }
    };
    execute(ast, data) {
        let result = "";
        let i = 0;
        while(i < ast.length){
            const node = ast[i];
            if (typeof node === "string") {
                result += node;
            } else if (node.type === "variable") {
                result += this.#getValue(node.key, data).toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
            } else if (node.type === "raw") {
                result += this.#getValue(node.key, data);
            } else if (node.type === "partial") {
                const endIndex = ast.slice(i + 1).findIndex((otherNode)=>"string" !== typeof otherNode && otherNode.type === "close" && node.key === otherNode.key && node.depth === otherNode.depth);
                if (this.partials.has(node.key)) {
                    const partial = this.partials.get(node.key);
                    result += this.execute(partial, data);
                } else {
                    const altAST = ast.slice(i + 1, endIndex + i + 1);
                    result += this.execute(altAST, data);
                    console.info(`Partial "${node.key}" not defined`);
                }
                if (endIndex > -1) {
                    i = endIndex + i + 1;
                    continue;
                }
            } else if (node.type === "helper") {
                const endIndex1 = ast.slice(i + 1).findIndex((otherNode)=>"string" !== typeof otherNode && otherNode.type === "close" && node.key === otherNode.key && node.depth === otherNode.depth);
                const helperAST = ast.slice(i + 1, endIndex1 + i + 1);
                if (this.helpers.has(node.key)) {
                    const helper = this.helpers.get(node.key);
                    result += helper.call(this, data, node, helperAST);
                    if (endIndex1 > -1) {
                        i = endIndex1 + i + 1;
                        continue;
                    }
                } else {
                    console.warn(`Helper "${node.key}" not found`);
                }
            }
            i++;
        }
        return result;
    }
    compile(template, options = {}) {
        if (options.partials) {
            this.registerPartials(options.partials);
        }
        const ast = this.parse(template);
        return (data)=>{
            const result = this.execute(ast, data);
            return result;
        };
    }
    #getValue(path, data1) {
        const keys = path.match(/(\w[\w\d_]*|\d+)+/g);
        if (keys === null) {
            return undefined;
        }
        let value = data1[keys[0]];
        for(let i = 1; i < keys.length; i++){
            if (typeof value !== "object" || value === null) {
                return undefined;
            }
            value = value[keys[i]];
        }
        return value;
    }
}
class BartEngine extends ViewEngine {
    constructor(options){
        super(new Bart(options), options);
    }
    async registerPartial(partial) {
        const template = await this.getPartialTemplate(partial);
        this.engine.registerPartials({
            [partial]: template
        });
    }
    registerHelper(helperName, helperFunction) {
        this.engine.registerHelper(helperName, helperFunction);
        return Promise.resolve();
    }
    async view(template, data, options = {}) {
        options = {
            ...this.options,
            ...options
        };
        const viewTemplate = await this.getViewTemplate(template);
        const pageTmpl = this.engine.compile(viewTemplate);
        const content = pageTmpl(data);
        if (options.layout) {
            const layoutTemplate = await this.getLayoutTemplate(options.layout);
            const layoutTmpl = this.engine.compile(layoutTemplate);
            return layoutTmpl({
                ...data,
                content
            });
        }
        return content;
    }
    async partial(template, data, options = {}) {
        options = {
            ...this.options,
            ...options
        };
        if (!this.engine.partials[template]) {
            await this.registerPartial(template);
        }
        const ast = this.engine.partials.get(template);
        return this.engine.execute(ast, data);
    }
}
class HXHeaders {
    #state = null;
    #responseHeaders;
    get responseHeaders() {
        return this.#responseHeaders;
    }
    get boosted() {
        return this.#state?.boosted;
    }
    get historyRestoreRequest() {
        return this.#state?.historyRestoreRequest;
    }
    get currentUrl() {
        return this.#state?.currentUrl;
    }
    get prompt() {
        return this.#state?.prompt;
    }
    get targetId() {
        return this.#state?.targetId;
    }
    get triggerId() {
        return this.#state?.triggerId;
    }
    get triggerName() {
        return this.#state?.triggerName;
    }
    get state() {
        return this.#state;
    }
    #isHTMX = false;
    get isHTMX() {
        return this.#isHTMX;
    }
    constructor(reqHeaders, resHeaders){
        if (reqHeaders) {
            this.setRequestHeaders(reqHeaders);
        }
        if (resHeaders) {
            this.setResponseHeaders(resHeaders);
        }
    }
    setRequestHeaders(reqHeaders) {
        reqHeaders = new Headers(reqHeaders);
        this.#isHTMX = reqHeaders.get("HX-Request") === "true";
        if (this.#isHTMX) {
            this.#state = {
                boosted: reqHeaders.get("HX-Boosted") === "true",
                historyRestoreRequest: reqHeaders.get("HX-History-Restore-Request") === "true",
                currentUrl: reqHeaders.get("HX-Current-URL"),
                prompt: reqHeaders.get("HX-Prompt"),
                targetId: reqHeaders.get("HX-Target"),
                triggerName: reqHeaders.get("HX-Trigger-Name"),
                triggerId: reqHeaders.get("HX-Trigger")
            };
        }
    }
    setResponseHeaders(resHeaders) {
        this.#responseHeaders = resHeaders;
    }
    location(value) {
        if (this.#isHTMX) {
            if (typeof value === "object" && value !== null) {
                const map = new Map(Object.entries(value));
                if (!map.has("path")) {
                    throw new Error("path is required");
                }
                if (map.size === 1 && map.has("path")) {
                    value = map.get("path");
                }
            }
            this.insertIntoResponeHeaders("HX-Location", value);
        }
    }
    pushUrl(url) {
        if (this.#isHTMX) {
            this.insertIntoResponeHeaders("HX-Push-Url", url ? url : "false");
        }
    }
    replaceUrl(url) {
        if (this.#isHTMX) {
            this.insertIntoResponeHeaders("HX-Replace-Url", url ? url : "false");
        }
    }
    redirect(url) {
        if (this.#isHTMX) {
            this.insertIntoResponeHeaders("HX-Redirect", url);
        }
    }
    refresh() {
        if (this.#isHTMX) {
            this.insertIntoResponeHeaders("HX-Refresh", "true");
        }
    }
    reswap(...modifiers) {
        if (this.#isHTMX) {
            const modifiersSet = new Set(modifiers);
            this.insertIntoResponeHeaders("HX-Reswap", [
                ...modifiersSet
            ].join(" "));
        }
    }
    retarget(selector) {
        if (this.#isHTMX) {
            this.insertIntoResponeHeaders("HX-Retarget", selector);
        }
    }
    trigger(events, mode = null) {
        if (this.#isHTMX) {
            let header = "HX-Trigger";
            switch(mode?.toLowerCase()){
                case "aftersettle":
                    header = "HX-Trigger-After-Settle";
                    break;
                case "afterswap":
                    header = "HX-Trigger-After-Swap";
                    break;
            }
            this.insertIntoResponeHeaders(header, events);
        }
    }
    insertIntoResponeHeaders(header, value) {
        const headerValue = typeof value === "string" ? value : JSON.stringify(value);
        if (this.#responseHeaders instanceof Headers) {
            this.#responseHeaders.set(header, headerValue);
        } else if (Array.isArray(this.#responseHeaders)) {
            this.#responseHeaders.push([
                header,
                headerValue
            ]);
        } else {
            this.#responseHeaders[header] = headerValue;
        }
    }
}
function htmxHook() {
    return (context)=>{
        const reqHeaders = context.request.headers;
        const resHeaders = context.response.headers;
        const htmx = new HXHeaders(reqHeaders, resHeaders);
        context.state.isHTMX = htmx.isHTMX;
        context.state.htmx = htmx;
        context.state.redirect = (url)=>{
            let status = 303;
            if (htmx.isHTMX) {
                status = 204;
                htmx.redirect(url);
            }
            context.response = new Response(null, {
                status,
                headers: resHeaders
            });
        };
    };
}
const router = new Router1();
router.hooks.add(mod.logging());
router.hooks.add(mod.path());
router.hooks.add(mod.onlineState({
    downlink: 0.5,
    latency: 750
}));
router.hooks.add(htmxHook());
const engine = new BartEngine({
    rootPath: "/views",
    extName: ".hbs"
});
router.setViewEngine(engine);
addEventListener("fetch", (event)=>{
    router.listen(event);
});

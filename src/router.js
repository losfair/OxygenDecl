import * as parser from "./parser.js";

export class RouterError {
    constructor(msg) {
        if(typeof(msg) != "string") {
            throw new TypeError("Invalid type for message");
        }
        this.message = "RouterError: " + msg;
    }

    toString() {
        return this.message;
    }
}

class URLCacheItem {
    constructor(url, fn) {
        this.url = url;
        this.fn = fn;
        this.time = Date.now();
    }
}

export class Router {
    constructor(config) {
        this.root = null;
        this.resource_handlers = new Map();
        this.providers = new Map();
        this.middlewares = new Map();
        this.max_url_cache_size = 100;
        this.url_cache = {};
        this.debug = false;

        if(config instanceof parser.ASTNode) {
            this.root = config;
        } else if(typeof(config) == "string") {
            this.root = parser.parse(config);
        } else {
            throw new TypeError("Invalid type for router config");
        }
    }

    register_resource_handler(name, fn) {
        if(typeof(name) != "string" || typeof(fn) != "function") {
            throw new TypeError("register_resource_handler: Invalid types for arguments");
        }
        this.resource_handlers.set(name, fn);
    }

    register_provider(name, fn) {
        if(typeof(name) != "string" || typeof(fn) != "function") {
            throw new TypeError("register_provider: Invalid types for arguments");
        }
        this.providers.set(name, fn);
    }

    register_middleware(name, fn) {
        if(typeof(name) != "string" || typeof(fn) != "function") {
            throw new TypeError("register_middleware: Invalid types for arguments");
        }
        this.middlewares.set(name, fn);
    }

    dispatch(full_url, context) {
        let current = this.root;
        let handler = null;

        if(this.url_cache[full_url]) {
            if(this.debug) {
                console.log("URL cache hit: " + full_url);
            }
            return this.url_cache[full_url].fn(context);
        }

        let url = full_url;

        while(url.length) {
            let found = false;
            for(const c of current.children) {
                if(url.startsWith(c.name)) {
                    current = c;
                    url = url.substring(c.name.length);
                    found = true;
                    break;
                }
            }

            if(!found) {
                if(current.name.endsWith("/")) {
                    handler = this.get_resource_handler(current);
                    break;
                } else {
                    throw new RouterError("Unable to find handler");
                }
            }
        }

        if(!handler) {
            handler = this.get_resource_handler(current);
        }

        if(!handler) {
            throw new RouterError("Unable to find handler");
        }

        if(Object.keys(this.url_cache).length >= this.max_url_cache_size) {
            if(this.debug) {
                console.log("Maximum url cache size reached, removing old items");
                console.log("Before: ");
                console.log(this.url_cache);
            }
            let new_url_cache = {};

            Object.keys(this.url_cache)
                .sort((a, b) => this.url_cache[a].time - this.url_cache[b].time)
                .slice(Math.floor(this.max_url_cache_size / 10))
                .forEach(k => new_url_cache[k] = this.url_cache[k]);
            
            this.url_cache = new_url_cache;

            if(this.debug) {
                console.log("After: ");
                console.log(this.url_cache);
            }
        }

        this.url_cache[full_url] = new URLCacheItem(full_url, handler);

        return handler(context);
    }

    get_resource_handler(node) {
        if(!(node instanceof parser.ASTNode)) {
            throw new TypeError("handle_resource: Invalid type for node");
        }

        if(!(node.resource instanceof parser.Resource)) {
            //throw new Error("handle_resource: Invalid resource");
            return null;
        }

        let resource_fn = null;

        switch(node.resource.type) {
            case "Provider": {
                const fn = this.providers.get(node.resource.name);
                if(!fn) {
                    //throw new Error("handle_resource: Provider not found: " + node.resource.name);
                    return null;
                }
                resource_fn = fn;
            }
            break;

            default: {
                const fn = this.resource_handlers.get(node.resource.type);
                if(!fn) {
                    throw new TypeError("handle_resource: No handler found for " + node.resource.type);
                }
                resource_fn = ctx => fn(node.resource.name, ctx);
            }
        }

        const ret = async ctx => {
            let c = node;
            let middlewares = [];

            while(c) {
                c.middlewares.reverse().forEach(v => middlewares.push(v));
                c = c.parent;
            }

            middlewares = middlewares.reverse();

            for(const mw of middlewares) {
                const h = this.middlewares.get(mw);
                if(h) await h(ctx);
            }
            if(resource_fn) await resource_fn(ctx);
        };

        return ret;
    }
};

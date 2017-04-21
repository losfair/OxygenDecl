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

export class Router {
    constructor(config) {
        this.root = null;
        this.providers = new Map();

        if(config instanceof parser.ASTNode) {
            this.root = config;
        } else if(typeof(config) == "string") {
            this.root = parser.parse(config);
        } else {
            throw new TypeError("Invalid type for router config");
        }
    }

    register_provider(name, fn) {
        if(typeof(name) != "string" || typeof(fn) != "function") {
            throw new TypeError("register_provider: Invalid types for arguments");
        }
        this.providers.set(name, fn);
    }

    dispatch(url, context) {
        let current = this.root;
        let handler = null;

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

        switch(node.resource.type) {
            case "Provider": {
                const fn = this.providers.get(node.resource.name);
                if(!fn) {
                    //throw new Error("handle_resource: Provider not found: " + node.resource.name);
                    return null;
                }
                return fn;
            }
            //break;

            default:
            throw new TypeError("handle_resource: Unknown resource type: " + node.resource.type);
        }
    }
};
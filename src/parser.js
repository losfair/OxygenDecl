const TOKEN_TYPES = {
    UNKNOWN: 0,
    //DELIMITER: 1,
    PATH: 2,
    RESOURCE: 3,
    NEWLINE: 4,
    BLOCK_OPEN: 5,
    BLOCK_CLOSE: 6,
    MIDDLEWARE: 7
};

export class Token {
    constructor(type, description) {
        if(typeof(type) != "string" || !TOKEN_TYPES[type]) {
            throw new Error("Invalid token type");
        }
        this.type = type;
        this.description = description;
    }
}

export class Resource {
    constructor(type, name) {
        if(typeof(type) != "string" || typeof(name) != "string") {
            throw new Error("Invalid arguments");
        }
        this.type = type;
        this.name = name;
    }
}

export class ASTNode {
    constructor(name, parent = null) {
        if(typeof(name) != "string") {
            throw new Error("Invalid name for AST node");
        }
        this.name = name;
        this.resource = null;
        this.middlewares = [];
        this.children = [];
        //this.parent = parent;
    }

    create_child(name = "") {
        const child = new ASTNode(name, this);
        this.children.push(child);
        return child;
    }
}

export function parse(input) {
    const tokens = tokenize(input);

    let root = new ASTNode("");
    do_parse(root, tokens);

    return root;
}

function do_parse(current, tokens) {
    let state = 0;
    let current_name = "";
    let child_node = null;

    while(tokens.length) {
        const token = tokens.shift();

        switch(state) {
            case 0:
                if(token.type == "BLOCK_CLOSE") {
                    return;
                } else if(token.type != "PATH") {
                    throw new Error("Expecting path");
                }
                current_name = token.description;
                child_node = current.create_child(current_name);
                state = 1;
                break;

            case 1:
                if(token.type == "DELIMITER") {
                    break;
                } else if(token.type == "MIDDLEWARE") {
                    child_node.middlewares.push(token.description);
                    break;
                } else if(token.type == "RESOURCE") {
                    child_node.resource = token.description;
                } else if(token.type == "BLOCK_OPEN") {
                    do_parse(child_node, tokens);
                } else {
                    throw new Error("Unexpected token type: " + token.type);
                }
                state = 0;
                break;

            default:
                throw new Error("Unknown state: " + state);
        }
    }
}

export function tokenize(input) {
    if(typeof(input) != "string") {
        throw new Error("Input must be a string");
    }

    let tokens = [];
    let state = -1;
    let buf = "";
    let resource_type = "";

    for(const ch of input) {
        /*
        console.log("Current state: " + state);
        console.log("Current char: " + ch);
        console.log("");
        */

        switch(state) {
            case -1:
                if(ch == '\n' || is_space(ch)) {
                    break;
                }
                buf += ch;
                state = 0;
                break;

            case 0:
                if(is_space(ch)) {
                    tokens.push(new Token("PATH", buf));
                    buf = "";
                    state = 1;
                } else {
                    buf += ch;
                }
                break;
            
            case 1:
                if(is_space(ch)) break;

                if(ch == '=') {
                    state = 2;
                } else {
                    throw new Error("Unexpected token. Expecting '='");
                }
                break;
            
            case 2:
                if(ch == '>') {
                    state = 3;
                    //tokens.push(new Token("DELIMITER"));
                } else {
                    throw new Error("Unexpected token. Expecting '>'");
                }
                break;
            
            case 3:
                if(is_space(ch)) break;
                if(ch == '{') {
                    tokens.push(new Token("BLOCK_OPEN"));
                    state = -1;
                } else if(ch == '(') {
                    buf = "";
                    state = 6;
                } else {
                    state = 4;
                    buf += ch;
                }
                break;
            
            case 4:
                if(is_space(ch)) {
                    throw new Error("Unexpected space");
                }
                if(is_literal_char(ch)) {
                    buf += ch;
                } else if(ch == '(') {
                    resource_type = buf;
                    buf = "";
                    state = 5;
                }
                break;
            
            case 5:
                if(ch == ')') {
                    tokens.push(new Token("RESOURCE", new Resource(resource_type, buf)));
                    buf = "";
                    state = -1;
                } else {
                    buf += ch;
                }
                break;
            
            case 6:
                if(ch == ')') {
                    tokens.push(new Token("MIDDLEWARE", buf));
                    buf = "";
                    state = 3;
                } else {
                    buf += ch;
                }
                break;

            default:
                throw new Error("Unknown state: " + state);
        }
    }

    return tokens;
}

function is_space(ch) {
    return (ch == ' ' || ch == '\t' || ch == '\r');
}

function is_letter(ch) {
    return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function is_digit(ch) {
    return (ch >= '0' && ch <= '9');
}

function is_letter_or_digit(ch) {
    return is_letter(ch) || is_digit(ch);
}

function is_literal_char(ch) {
    return is_letter_or_digit(ch) || ch == '_';
}

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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileEmitter = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs"));
const file_1 = require("../file");
function createPathError(name) {
    return new Error(`'${name}' is not a valid path`);
}
class FileEmitter extends events_1.EventEmitter {
    root;
    stopped;
    pending;
    accept;
    constructor(root, accept = () => true) {
        super();
        this.root = new file_1.File(root);
        this.accept = accept;
        this.stopped = true;
        this.pending = 0;
    }
    stop() {
        this.stopped = true;
        this.emit('stop');
    }
    async start() {
        this.stopped = false;
        if (!fs.existsSync(this.root.getName())) {
            this.emit('error', createPathError(this.root.getName()));
            return;
        }
        return this.walk(this.root);
    }
    async walk(directory) {
        if (this.stopped) {
            this.stop();
        }
        try {
            this.pending += 1;
            const files = await directory.getFiles();
            for (const file of files) {
                if (!this.accept(file)) {
                    continue;
                }
                if (await file.isFile()) {
                    this.emit('file', file);
                }
                else if (await file.isDirectory()) {
                    let skip = false;
                    this.emit('directory', file, () => {
                        skip = true;
                    });
                    if (!skip) {
                        await this.walk(file);
                    }
                }
            }
        }
        catch (e) {
            this.emit('error', e);
        }
        finally {
            this.pending -= 1;
            if (this.pending === 0) {
                this.stop();
            }
        }
    }
}
exports.FileEmitter = FileEmitter;

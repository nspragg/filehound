import { EventEmitter } from "events";

class DirectoryTraverser extends EventEmitter {
    private root: string;
    private skipDirectories: string[];
    private stop: boolean;
    private pending: number;

    constructor(root) {
        super();
        this.root = root;
        this.skipDirectories = [];
        this.stop = false;
        this.pending = 0;
    }

    skip(dir) {
        this.skipDirectories.push(dir);
        return this;
    }

    traverse(dir) {

    }

    terminate() {
        this.stop = true;
        return this;
    }
}

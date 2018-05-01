"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function getDirNames(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        const names = yield dir.getFiles();
        return names.sort();
    });
}
function walkAsync(path, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield path.isDirectory())) {
            return yield fn(path);
        }
        const cont = yield fn(path);
        if (!cont) {
            return;
        }
        const names = yield getDirNames(path);
        for (const name of names) {
            yield walkAsync(name, fn);
        }
    });
}
exports.walkAsync = walkAsync;
//# sourceMappingURL=walkAsync.js.map
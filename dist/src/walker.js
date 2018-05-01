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
function search(file, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield file.isDirectory())) {
            return yield fn(file);
        }
        const cont = yield fn(file);
        if (!cont)
            return;
        const names = yield file.getFiles();
        for (const file of names) {
            yield search(file, fn);
        }
    });
}
function walk(root, fn) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield search(root, fn);
    });
}
exports.walk = walk;
//# sourceMappingURL=walker.js.map
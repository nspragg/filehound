"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Heap_items, _Heap_precedes;
exports.__esModule = true;
exports.Heap = void 0;
// A binary min-heap: pop returns the item that comes first by precedes
var Heap = /** @class */ (function () {
    function Heap(precedes) {
        _Heap_items.set(this, []);
        _Heap_precedes.set(this, void 0);
        __classPrivateFieldSet(this, _Heap_precedes, precedes, "f");
    }
    Object.defineProperty(Heap.prototype, "size", {
        get: function () {
            return __classPrivateFieldGet(this, _Heap_items, "f").length;
        },
        enumerable: false,
        configurable: true
    });
    Heap.prototype.push = function (item) {
        var _a;
        var items = __classPrivateFieldGet(this, _Heap_items, "f");
        var i = items.push(item) - 1;
        while (i > 0) {
            var parent_1 = (i - 1) >> 1;
            if (!__classPrivateFieldGet(this, _Heap_precedes, "f").call(this, items[i], items[parent_1])) {
                break;
            }
            _a = [items[parent_1], items[i]], items[i] = _a[0], items[parent_1] = _a[1];
            i = parent_1;
        }
    };
    Heap.prototype.pop = function () {
        var _a;
        var items = __classPrivateFieldGet(this, _Heap_items, "f");
        var first = items[0];
        var last = items.pop();
        if (items.length > 0 && last !== undefined) {
            items[0] = last;
            var i = 0;
            for (;;) {
                var left = 2 * i + 1;
                var right = left + 1;
                var next = i;
                if (left < items.length && __classPrivateFieldGet(this, _Heap_precedes, "f").call(this, items[left], items[next])) {
                    next = left;
                }
                if (right < items.length && __classPrivateFieldGet(this, _Heap_precedes, "f").call(this, items[right], items[next])) {
                    next = right;
                }
                if (next === i) {
                    break;
                }
                _a = [items[next], items[i]], items[i] = _a[0], items[next] = _a[1];
                i = next;
            }
        }
        return first;
    };
    return Heap;
}());
exports.Heap = Heap;
_Heap_items = new WeakMap(), _Heap_precedes = new WeakMap();

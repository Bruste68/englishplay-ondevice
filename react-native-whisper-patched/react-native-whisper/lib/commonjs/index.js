"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.isLoaded = isLoaded;
var _reactNative = require("react-native");
//@ts-ignore we want to ignore everything
// else in global except what we need to access.
// Maybe there is a better way to do this.

// Installing JSI Bindings as done by
// https://github.com/mrousavy/react-native-mmkv

//@ts-ignore
const simpleJsiModule = global;
function isLoaded() {
  return typeof simpleJsiModule.getItem === 'function';
}
if (!isLoaded()) {
  var _NativeModules$Simple;
  const result = (_NativeModules$Simple = _reactNative.NativeModules.SimpleJsi) === null || _NativeModules$Simple === void 0 ? void 0 : _NativeModules$Simple.install();
  if (!result && !isLoaded()) throw new Error('JSI bindings were not installed for: SimpleJsi Module');
  if (!isLoaded()) {
    throw new Error('JSI bindings were not installed for: SimpleJsi Module');
  }
}
var _default = simpleJsiModule;
exports.default = _default;
//# sourceMappingURL=index.js.map
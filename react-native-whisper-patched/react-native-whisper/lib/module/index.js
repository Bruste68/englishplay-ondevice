//@ts-ignore we want to ignore everything
// else in global except what we need to access.
// Maybe there is a better way to do this.
import { NativeModules } from 'react-native';

// Installing JSI Bindings as done by
// https://github.com/mrousavy/react-native-mmkv

//@ts-ignore
const simpleJsiModule = global;
export function isLoaded() {
  return typeof simpleJsiModule.getItem === 'function';
}
if (!isLoaded()) {
  var _NativeModules$Simple;
  const result = (_NativeModules$Simple = NativeModules.SimpleJsi) === null || _NativeModules$Simple === void 0 ? void 0 : _NativeModules$Simple.install();
  if (!result && !isLoaded()) throw new Error('JSI bindings were not installed for: SimpleJsi Module');
  if (!isLoaded()) {
    throw new Error('JSI bindings were not installed for: SimpleJsi Module');
  }
}
export default simpleJsiModule;
//# sourceMappingURL=index.js.map
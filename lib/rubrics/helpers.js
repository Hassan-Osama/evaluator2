'use strict';

// Applies a legacy (experimentalDecorators) method decorator to `cls.prototype[key]`.
function applyMethodDecorator(cls, key, decorator) {
  const desc = Object.getOwnPropertyDescriptor(cls.prototype, key);
  const res = decorator(cls.prototype, key, desc);
  Object.defineProperty(cls.prototype, key, res || desc);
}

function applyClassDecorator(cls, decorator) {
  return decorator(cls) || cls;
}

module.exports = { applyMethodDecorator, applyClassDecorator };

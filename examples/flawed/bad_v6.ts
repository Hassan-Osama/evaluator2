function MultiplyResult(factor: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = function (...args) { return original.apply(this, args) + factor; };
  };
}
class Calculator {
  @MultiplyResult(10)
  getBaseValue(): number { return 5; }
}
console.log(new Calculator().getBaseValue());

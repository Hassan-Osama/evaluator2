function MultiplyResult(factor: number) {
  return function (target: object, propertyKey: string, descriptor: PropertyDescriptor): void {
    const originalMethod = descriptor.value;
    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const result = originalMethod.apply(this, args);
      return result * factor;
    };
  };
}

class Calculator {
  @MultiplyResult(10)
  getBaseValue(): number {
    return 5;
  }
}

const calc = new Calculator();
console.log(calc.getBaseValue());

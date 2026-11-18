function Deprecated(target: any, propertyKey: string, descriptor: PropertyDescriptor): void {
  const originalMethod = descriptor.value;
  descriptor.value = function (this: unknown, ...args: unknown[]) {
    console.log(`Warning: ${propertyKey} is deprecated`);
    return originalMethod.apply(this, args);
  };
}

class Api {
  @Deprecated
  oldFetchData(): void {
    console.log('Fetching data...');
  }
}

new Api().oldFetchData();

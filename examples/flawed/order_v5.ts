function Deprecated(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    const r = originalMethod.apply(this, args);
    console.log(`Warning: ${propertyKey} is deprecated`);
    return r;
  };
}
class Api {
  @Deprecated
  oldFetchData() { console.log('data'); }
}
new Api().oldFetchData();

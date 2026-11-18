function TrackIndex(target: any, propertyKey: string, parameterIndex: number) {
  console.log(`Decorated ${propertyKey} #${parameterIndex}`);
}
class Invoice {
  calculateTotal(price: number, @TrackIndex tax: number) { return price + tax; }
}
console.log(new Invoice().calculateTotal(100, 15));

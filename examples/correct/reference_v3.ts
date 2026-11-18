function TrackIndex(target: object, propertyKey: string, parameterIndex: number): void {
  console.log(`Parameter at index ${parameterIndex} in method ${propertyKey} was decorated`);
}

class Invoice {
  calculateTotal(@TrackIndex price: number, tax: number): number {
    return price + tax;
  }
}

const invoice = new Invoice();
console.log(invoice.calculateTotal(100, 15));

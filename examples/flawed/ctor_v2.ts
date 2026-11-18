function ReadOnlyProperty(target: any, propertyKey: string) {
  Object.defineProperty(target, propertyKey, { writable: false });
}
class Profile {
  @ReadOnlyProperty
  username: string;
  constructor(n: string) { this.username = n; }
}
const p = new Profile('a');
// @ts-ignore
p.username = 'b';

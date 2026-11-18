function ReadOnlyProperty(target: any, propertyKey: string): void {
  Object.defineProperty(target, propertyKey, { writable: false });
}

class Profile {
  @ReadOnlyProperty
  username!: string;
}

const profile = new Profile();
try {
  profile.username = 'new-name';
} catch (e) {
  console.log((e as Error).message);
}

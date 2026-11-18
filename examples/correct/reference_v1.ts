function AddCreationDate(target: Function): void {
  target.prototype.createdAt = new Date();
}

@AddCreationDate
class User {
  [key: string]: any;
}

const user = new User();
console.log(user.createdAt);

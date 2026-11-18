function AddCreationDate(target: any) {
  target.createdAt = new Date();
}
@AddCreationDate
class User {}
const u = new User();

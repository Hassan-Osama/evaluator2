function InjectRole(roleName: string) {
  return function (target: Function) { target.prototype.role = roleName; };
}
@InjectRole('Admin')
class AdminDashboard {}
while (true) {}

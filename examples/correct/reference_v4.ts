function InjectRole(roleName: string) {
  return function (target: Function): void {
    target.prototype.role = roleName;
  };
}

@InjectRole('Admin')
class AdminDashboard {
  [key: string]: any;
}

const dashboard = new AdminDashboard();
console.log(dashboard.role);

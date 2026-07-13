import { Route as RootRoute } from "./routes/__root"
import { Route as IndexRoute } from "./routes/index"
import { Route as LoginRoute } from "./routes/login"
import { Route as RegisterRoute } from "./routes/register"
import { Route as DashboardRoute } from "./routes/dashboard"
import { Route as AdminUsersRoute } from "./routes/admin/users"
import { Route as AdminSubjectsRoute } from "./routes/admin/subjects"

export const routeTree = RootRoute.addChildren([IndexRoute, LoginRoute, RegisterRoute, DashboardRoute, AdminUsersRoute, AdminSubjectsRoute])

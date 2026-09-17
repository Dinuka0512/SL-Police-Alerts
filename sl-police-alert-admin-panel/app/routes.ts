import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  layout("components/layout/DashboardLayout.tsx", [
    index("routes/dashboard.tsx"),
    route("users", "routes/users.tsx"),
    route("users/new", "routes/users.new.tsx"),
    route("users/:id/edit", "routes/users.$id.edit.tsx"),
    route("departments", "routes/departments.tsx"),
    route("penalties", "routes/penalties.tsx"),
    route("send-alert", "routes/send-alert.tsx"),
    route("alert-history", "routes/alert-history.tsx"),
route("settings", "routes/settings.tsx"),
  ]),
  route("login", "routes/login.tsx"),
] satisfies RouteConfig;

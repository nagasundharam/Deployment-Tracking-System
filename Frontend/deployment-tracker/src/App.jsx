import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from "react-router-dom";

import Layout from "./layout/Layout";
import PageLayout from "./layout/PageLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Deployments from "./pages/Deployments";
import Users from "./pages/Users";
import Environments from "./pages/Environments";
import AuditLogs from "./pages/Auditlogs";
import Settings from "./pages/Settings";
import ErrorPage from "./pages/ErrorPage";
import DeploymentDetails from "./pages/DeploymentsDetails";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<ErrorPage />}>
      
      <Route element={<PageLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="deployments" element={<Deployments />} />

        <Route path="deployments/:id" element={< DeploymentDetails />} />
        <Route path="users" element={<Users />} />
        <Route path="environments" element={<Environments />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}

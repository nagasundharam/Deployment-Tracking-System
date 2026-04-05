import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute"; 
import Login from "./pages/Login";
import Register from "./pages/Register";

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
    <>
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<ProtectedRoute />}>
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
        
        {/* Catch-All 404 Route */}
        <Route path="*" element={<ErrorPage />} />
      </Route>
      </Route>

    </Route>
    </>
  )
);
//just adding

export default function App() {
  return <RouterProvider router={router} />;
}

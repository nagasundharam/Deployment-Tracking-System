import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./PageLayout.css";

function PageLayout() {
  return (
    <div className="layout-wrapper">
      {/* Sidebar */}
      <div className="layout-sidebar">
        <Navbar />
      </div>

      {/* Main Section */}
      <div className="layout-main">
        {/* Page Content */}
        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default PageLayout;

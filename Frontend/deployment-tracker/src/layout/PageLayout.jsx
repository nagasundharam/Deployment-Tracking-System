import { Outlet } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Navbar from "../components/Navbar";

function PageLayout() {
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      {/* Sidebar */}
      <div style={{ width: "220px", background: "#111", color: "white" }}>
        <Navbar />
      </div>

      {/* Main Section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* Top Search */}
        <div style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>
          <SearchBar />
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, padding: "20px" }}>
          <Outlet />
        </div>

      </div>
    </div>
  );
}

export default PageLayout;

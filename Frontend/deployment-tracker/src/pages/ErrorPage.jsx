import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import "./ErrorPage.css";

const ErrorPage = () => {
    const navigate = useNavigate();

    return (
        <div className="error-container">
            <div className="error-content">
                <div className="error-icon-wrapper">
                    <AlertTriangle size={48} />
                </div>
                <h1 className="error-title">404</h1>
                <h2 className="error-subtitle">Page Not Found</h2>
                <p className="error-message">
                    Oops! The page you are looking for doesn't exist, has been moved, or you don't have permission to access it.
                </p>
                <div className="error-actions">
                    <button className="btn-home" onClick={() => navigate("/")}>
                        <ArrowLeft size={18} />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};
 
export default ErrorPage;
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import ERequest from "./pages/ERequest";
import TransactionDetail from "./pages/TransactionDetail";
import EFormTemplate from "./pages/EFormTemplate";
import FormBuilder from "./pages/FormBuilder";
import EFlowWorkflow from "./pages/EFlowWorkflow";
import WorkflowEditor from "./pages/WorkflowEditor";
import WorkflowDesigner from "./pages/WorkflowDesigner";

// eAccount pages (TASK 4)
import EAccountHub from "./pages/eaccount/EAccountHub";
import Profile from "./pages/eaccount/Profile";
import StaffManagement from "./pages/eaccount/StaffManagement";
import AccountManagement from "./pages/eaccount/AccountManagement";
import PermissionManagement from "./pages/eaccount/PermissionManagement";

// eAi pages (TASK 5)
import EAi from "./pages/EAi";
import EAiUpload from "./pages/EAiUpload";
import NewTicket from "./pages/NewTicket";

const P = ({ children, role }) => (
  <ProtectedRoute requiredRole={role}>{children}</ProtectedRoute>
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/403" element={<Forbidden />} />
        <Route path="*" element={<NotFound />} />

        {/* Redirect gốc */}
        <Route path="/" element={<Navigate to="/erequest" replace />} />

        {/* eRequest */}
        <Route path="/erequest" element={<P><ERequest /></P>} />
        <Route path="/erequest/new" element={<P><NewTicket /></P>} />
        <Route path="/erequest/transaction/:id" element={<P><TransactionDetail /></P>} />

        {/* eForm (cần role 2) */}
        <Route path="/eform" element={<P role={2}><EFormTemplate /></P>} />
        <Route path="/eform/form-builder/:id" element={<P role={2}><FormBuilder /></P>} />

        {/* eFlow (cần role 3) */}
        <Route path="/eflow" element={<P role={3}><EFlowWorkflow /></P>} />
        <Route path="/eflow/edit/:id" element={<P role={3}><WorkflowEditor /></P>} />
        <Route path="/eflow/designer/:id" element={<P role={3}><WorkflowDesigner /></P>} />

        {/* eAccount */}
        <Route path="/eaccount" element={<P><EAccountHub /></P>} />
        <Route path="/eaccount/profile" element={<P><Profile /></P>} />
        <Route path="/eaccount/staff" element={<P role={1}><StaffManagement /></P>} />
        <Route path="/eaccount/account" element={<P role={4}><AccountManagement /></P>} />
        <Route path="/eaccount/permissions" element={<P role={5}><PermissionManagement /></P>} />

        {/* eAi */}
        <Route path="/eai" element={<P><EAi /></P>} />
        <Route path="/eai/upload/:flowId" element={<P><EAiUpload /></P>} />
      </Routes>
    </BrowserRouter>
  );
}

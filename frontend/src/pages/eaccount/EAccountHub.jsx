import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import { getAuth, hasRole } from "../../utils/auth";
import { UserCircle, Users, FileText, GitBranch, ShieldCheck, UserCog, ArrowLeft } from "lucide-react";

const ROLE_CARDS = [
  {
    role: -1,
    title: "Thông tin cá nhân",
    desc: "Xem và chỉnh sửa hồ sơ cá nhân",
    path: "/eaccount/profile",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
    Icon: UserCircle,
  },
  {
    role: 1,
    title: "Quản lý nhân sự",
    desc: "Tạo và xóa tài khoản nhân viên",
    path: "/eaccount/staff",
    gradient: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
    Icon: Users,
  },
  {
    role: 2,
    title: "Truy cập hồ sơ",
    desc: "Vào trang eForm quản lý biểu mẫu",
    path: "/eform",
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
    Icon: FileText,
  },
  {
    role: 3,
    title: "Thiết kế quy trình",
    desc: "Vào trang eFlow thiết kế luồng",
    path: "/eflow",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    Icon: GitBranch,
  },
  {
    role: 4,
    title: "Quản lý tài khoản",
    desc: "Tìm kiếm và xóa tài khoản người dùng",
    path: "/eaccount/account",
    gradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
    Icon: UserCog,
  },
  {
    role: 5,
    title: "Quản lý phân quyền",
    desc: "Gán và thu hồi quyền tài khoản",
    path: "/eaccount/permissions",
    gradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
    Icon: ShieldCheck,
  },
];

export default function EAccountHub() {
  const navigate = useNavigate();
  const { user } = getAuth();

  const visibleCards = ROLE_CARDS.filter(c => hasRole(c.role));

  return (
    <div className="min-h-screen bg-[#f2f5f8] flex flex-col" style={{ fontFamily: "'Inter','Segoe UI','Roboto',sans-serif" }}>
      <AppHeader service="eaccount" />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate("/erequest")} className="text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Quản lý tài khoản</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Xin chào, <span className="font-semibold">{user?.fullName || user?.email || "bạn"}</span>. Chọn chức năng bạn muốn thực hiện.
              </p>
            </div>
          </div>

          {visibleCards.length === 0 ? (
            <div className="mt-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={28} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Tài khoản chưa được cấp quyền nào</p>
              <p className="text-sm text-gray-400 mt-1">Liên hệ quản trị viên để được hỗ trợ</p>
              <button
                onClick={() => navigate("/erequest")}
                className="mt-6 px-5 py-2.5 text-sm font-semibold text-white rounded-lg"
                style={{ background: "linear-gradient(135deg, #16a34a 0%, #059669 100%)" }}
              >
                Quay lại trang chính
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
              {visibleCards.map(({ role, title, desc, path, gradient, Icon }) => (
                <button
                  key={role}
                  onClick={() => navigate(path)}
                  className="group bg-white rounded-2xl p-6 text-left shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-transparent hover:-translate-y-0.5"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform"
                    style={{ background: gradient }}
                  >
                    <Icon size={22} className="text-white" />
                  </div>
                  <p className="text-base font-bold text-gray-800 mb-1">{title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: gradient.includes("#7c3aed") ? "#7c3aed" : gradient.match(/#[\da-f]{6}/i)?.[0] || "#16a34a" }}>
                    <span>Truy cập</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function IconSidebar({ items = [] }) {
  return (
    <div className="w-14 bg-white border-r border-gray-100 flex flex-col items-center pt-3 gap-1 shrink-0">
      {items.map(({ key, Icon, title, onClick, active, activeColor = "text-orange-500", activeBg = "bg-orange-50" }) => (
        <button
          key={key}
          title={title}
          onClick={onClick}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
            active
              ? `${activeColor} ${activeBg}`
              : "text-gray-400 hover:bg-gray-100"
          }`}
        >
          <Icon size={19} />
        </button>
      ))}
    </div>
  );
}

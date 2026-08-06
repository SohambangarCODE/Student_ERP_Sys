function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-slate-200 flex gap-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === tab.key
              ? 'border-brand-600 text-brand-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default Tabs;
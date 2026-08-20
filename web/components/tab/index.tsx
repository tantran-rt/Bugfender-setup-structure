import React from "react";

import "./TabBar.css"; // Import the CSS file

interface TabProps {
  title: string;
  onPress: () => void;
  isActive: boolean;
}

const TabPill: React.FC<TabProps> = ({ title, onPress, isActive }) => {
  return (
    <button
      onClick={onPress}
      className={`tab-pill ${isActive ? "tab-pill--active" : ""}`}
    >
      {title}
    </button>
  );
};

interface TabBarProps {
  tabs: { title: string }[];
  activeTab: number;
  onTabPress: (index: number) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTab, onTabPress }) => {
  return (
    <div className="tab-bar">
      {tabs.map((tab, index) => (
        <TabPill
          key={index}
          title={tab.title}
          isActive={activeTab === index}
          onPress={() => onTabPress(index)}
        />
      ))}
    </div>
  );
};

export default TabBar;

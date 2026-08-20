"use client";
import DesktopMenu from "../menu/desktopMenu";
import Menu from "../menu/menu";
import "../menu/menu.css";

const DinamicMenuLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <div className="desktop-menu-layout">
      <DesktopMenu />

      <div className="menu-page-wrap">
        <div className="page-wrap">{children}</div>
      </div>
      <div className="mobile-menu">
        <Menu />
      </div>
    </div>
  );
};

export default DinamicMenuLayout;

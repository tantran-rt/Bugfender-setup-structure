"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "./menu.css";

const Menu = () => {
  const pathname = usePathname();

  return (
    <nav className="menu">
      <Link href="/home" className="sub-menu">
        {/* <GoHome size={30} color={pathname === '/home' ? '#009CF9' : '#ADADAD'} /> */}
        {pathname === "/home" ? (
          <Image
            className=""
            src="/icons/home-selected.svg"
            alt="captured Image"
            width={5000}
            height={5000}
            loading="lazy"
          />
        ) : (
          <Image
            className=""
            src="/icons/home-un-selected.svg"
            alt="captured Image"
            width={5000}
            height={5000}
            loading="lazy"
          />
        )}
        <p
          className="menu-text"
          style={pathname === "/home" ? { color: "#009CF9" } : {}}
        >
          Home
        </p>
      </Link>
      <Link href="/tutorial" className="sub-menu">
        {pathname === "/tutorial" ? (
          <Image
            className=""
            src="/icons/tutorial-selected.svg"
            alt="captured Image"
            width={5000}
            height={5000}
            loading="lazy"
          />
        ) : (
          <Image
            className=""
            src="/icons/tutorial-un-selected.svg"
            alt="captured Image"
            width={5000}
            height={5000}
            loading="lazy"
          />
        )}
        <p
          className="menu-text"
          style={pathname === "/tutorial" ? { color: "#009CF9" } : {}}
        >
          Tutorials
        </p>
      </Link>
      <Link href="/support" className="sub-menu">
        {pathname === "/support" ? (
          <Image
            className=""
            src="/icons/support-selected.svg"
            alt="captured Image"
            width={5000}
            height={5000}
            loading="lazy"
          />
        ) : (
          <Image
            className=""
            src="/icons/support-un-selected.svg"
            alt="captured Image"
            width={5000}
            height={5000}
            loading="lazy"
          />
        )}
        <p
          className="menu-text"
          style={pathname === "/support" ? { color: "#009CF9" } : {}}
        >
          Support
        </p>
      </Link>
      <Link href="/settings" className="sub-menu">
        {pathname === "/settings" ? (
          <Image
            className=""
            src="/icons/settings-selected.svg"
            alt="captured Image"
            width={5000}
            height={5000}
            loading="lazy"
          />
        ) : (
          <Image
            className=""
            src="/icons/settings-un-selected.svg"
            alt="captured Image"
            width={5000}
            height={5000}
            loading="lazy"
          />
        )}
        <p
          className="menu-text"
          style={pathname === "/settings" ? { color: "#009CF9" } : {}}
        >
          Settings
        </p>
      </Link>
    </nav>
  );
};

export default Menu;

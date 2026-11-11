"use client";

import { Navbar, type NavbarProps } from "./Navbar";

export interface PublicNavbarProps extends NavbarProps {
  items?: Array<{ label: string; href: string }>;
}

export function PublicNavbar(props: PublicNavbarProps) {
  return <Navbar {...props} />;
}

export { Navbar };
export default Navbar;

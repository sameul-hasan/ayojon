import React from "react";
import { Link as RouterLink, LinkProps as RouterLinkProps } from "react-router-dom";

export interface LinkProps extends Omit<RouterLinkProps, "to"> {
  to?: string;
  href?: string;
  className?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  target?: string;
  rel?: string;
}

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, href, className, children, ...props }, ref) => {
    const destination = to || href || "/";
    // Check if external link
    if (destination.startsWith("http://") || destination.startsWith("https://") || destination.startsWith("mailto:")) {
      return (
        <a ref={ref} href={destination} className={className} {...props}>
          {children}
        </a>
      );
    }
    return (
      <RouterLink ref={ref} to={destination} className={className} {...props}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = "Link";
export default Link;


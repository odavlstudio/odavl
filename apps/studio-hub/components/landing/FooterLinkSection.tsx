/**
 * FooterLinkSection - Reusable footer link column
 */

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

interface FooterLink {
  name: string;
  href: string;
  icon?: LucideIcon;
}

interface FooterLinkSectionProps {
  title: string;
  links: FooterLink[];
  titleClassName?: string;
  linkClassName?: string;
  listClassName?: string;
}

export function FooterLinkSection({
  title,
  links,
  titleClassName = "text-white font-semibold mb-4",
  linkClassName = "text-sm hover:text-white transition-colors inline-flex items-center gap-2",
  listClassName = "space-y-2"
}: FooterLinkSectionProps) {
  return (
    <div>
      <h3 className={titleClassName}>{title}</h3>
      <ul className={listClassName}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.name}>
              <Link
                href={link.href}
                className={linkClassName}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {link.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

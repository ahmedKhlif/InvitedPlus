'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(segment => segment);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Dashboard', href: '/dashboard' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip the first segment if it's 'dashboard'
      if (segment === 'dashboard' && index === 0) return;

      let name = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // Custom naming for specific routes
      switch (segment) {
        case 'auth':
          name = 'Authentication';
          break;
        case 'admin':
          name = 'Admin Panel';
          break;
        case 'board':
          name = 'Task Board';
          break;
        case 'create':
          name = 'Create';
          break;
        case 'edit':
          name = 'Edit';
          break;
        case 'settings':
          name = 'Settings';
          break;
        case 'profile':
          name = 'Profile';
          break;
        default:
          // If it looks like an ID (contains numbers/special chars), skip it
          if (/^[a-zA-Z0-9-_]+$/.test(segment) && segment.length > 10) {
            return;
          }
          break;
      }

      breadcrumbs.push({
        name,
        href: currentPath,
        current: index === pathSegments.length - 1
      });
    });

    return breadcrumbs;
  };

  const breadcrumbItems = items || generateBreadcrumbs();

  // Don't show breadcrumbs on the main dashboard
  if (pathname === '/dashboard' || pathname === '/') {
    return null;
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        <li>
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
              <HomeIcon className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </div>
        </li>
        {breadcrumbItems.slice(1).map((item) => (
          <li key={item.name}>
            <div className="flex items-center">
              <ChevronRightIcon className="flex-shrink-0 h-5 w-5 text-gray-400" aria-hidden="true" />
              {item.current ? (
                <span className="ml-4 text-sm font-medium text-gray-500" aria-current="page">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {item.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

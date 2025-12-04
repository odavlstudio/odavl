'use client';

import { useSession, signOut } from 'next-auth/react';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Bell, UserCircle, LogOut, Settings as SettingsIcon, HelpCircle } from 'lucide-react';
import { OrganizationSwitcher } from '@/components/organization/organization-switcher';
import { ProjectSwitcher } from '@/components/project/project-switcher';
import { cn } from '@/lib/utils';

export function Header() {
  const { data: session } = useSession();

  const userNavigation = [
    {
      name: 'Your Profile',
      href: '/dashboard/profile',
      icon: UserCircle,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: SettingsIcon,
    },
    {
      name: 'Help Center',
      href: '/docs',
      icon: HelpCircle,
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
      <div className="flex-1 flex items-center justify-between">
        {/* Left Side - Organization & Project Switchers */}
        <div className="flex items-center space-x-4">
          <OrganizationSwitcher />
          <div className="h-6 w-px bg-gray-300" />
          <ProjectSwitcher />
        </div>

        {/* Right Side - Notifications & User Menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="View notifications"
          >
            <Bell className="h-6 w-6" />
            {/* Notification Badge */}
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {/* User Menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500">
                  {session?.user?.email || ''}
                </p>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <a
                          href={item.href}
                          className={cn(
                            'flex items-center px-4 py-2 text-sm',
                            active
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700'
                          )}
                        >
                          <item.icon className="mr-3 h-5 w-5 text-gray-400" />
                          {item.name}
                        </a>
                      )}
                    </Menu.Item>
                  ))}

                  <div className="border-t border-gray-100 my-1" />

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className={cn(
                          'flex w-full items-center px-4 py-2 text-sm text-left',
                          active
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700'
                        )}
                      >
                        <LogOut className="mr-3 h-5 w-5 text-gray-400" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}

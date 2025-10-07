/**
 * Sidebar Component
 * Single responsibility: Display sidebar navigation with social links
 */

import IconImage from 'data-base64:~assets/icon.png';
import {
  Blocks,
  Bookmark,
  BookOpen,
  Bot,
  Crown,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
} from 'lucide-react';
import React from 'react';

import type { SidebarKey } from './constants';
import { openExternal } from './constants';

interface SidebarProps {
  collapsed: boolean;
  active: SidebarKey;
  i18nConfig: any;
  t: any;
  onToggleCollapse: () => void;
  onNavigate: (key: SidebarKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  active,
  i18nConfig,
  t,
  onToggleCollapse,
  onNavigate,
}) => {
  // Social links
  const socialActions: Array<{ label: string; onClick: () => void; icon: React.ReactNode }> = [
    {
      label: 'GitHub',
      onClick: () => openExternal('https://github.com/samanhappy/selectly'),
      icon: (
        <svg
          width={16}
          height={16}
          role="img"
          fill="gray"
          onMouseOut={(e) => {
            (e.currentTarget as SVGElement).setAttribute('fill', 'gray');
          }}
          onMouseOver={(e) => {
            (e.currentTarget as SVGElement).setAttribute('fill', 'black');
          }}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>GitHub</title>
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
    },
    {
      label: 'Discord',
      onClick: () => openExternal('https://discord.com/invite/36qD8P26'),
      icon: (
        <svg
          width={16}
          height={16}
          role="img"
          fill="gray"
          onMouseOut={(e) => {
            (e.currentTarget as SVGElement).setAttribute('fill', 'gray');
          }}
          onMouseOver={(e) => {
            (e.currentTarget as SVGElement).setAttribute('fill', 'black');
          }}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Discord</title>
          <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
        </svg>
      ),
    },
    {
      label: 'X',
      onClick: () => openExternal('https://x.com/samanhappy'),
      icon: (
        <svg
          width={16}
          height={16}
          role="img"
          fill="gray"
          onMouseOut={(e) => {
            (e.currentTarget as SVGElement).setAttribute('fill', 'gray');
          }}
          onMouseOver={(e) => {
            (e.currentTarget as SVGElement).setAttribute('fill', 'black');
          }}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>X</title>
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
        </svg>
      ),
    },
    {
      label: 'Email',
      onClick: () => openExternal('mailto:samanhappy@gmail.com'),
      icon: (
        <svg
          width={16}
          height={16}
          role="img"
          fill="gray"
          onMouseOut={(e) => {
            (e.currentTarget as SVGElement).setAttribute('fill', 'gray');
          }}
          onMouseOver={(e) => {
            (e.currentTarget as SVGElement).setAttribute('fill', 'black');
          }}
          strokeWidth="0"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 3H21C21.5523 3 22 3.44772 22 4V20C22 20.5523 21.5523 21 21 21H3C2.44772 21 2 20.5523 2 20V4C2 3.44772 2.44772 3 3 3ZM20 7.23792L12.0718 14.338L4 7.21594V19H20V7.23792ZM4.51146 5L12.0619 11.662L19.501 5H4.51146Z"></path>
        </svg>
      ),
    },
  ];

  return (
    <aside
      className={
        'border-r border-slate-200 bg-white transition-[width] flex h-full flex-col sticky top-0' +
        (collapsed ? ' w-14' : ' w-60')
      }
    >
      {/* Sidebar Top: Brand + Collapse */}
      <div className="border-b border-slate-200 p-2">
        {collapsed ? (
          <div className="flex justify-center">
            <button
              className="grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-blue-100 transition-colors"
              onClick={onToggleCollapse}
              aria-label={t.options?.toggleSidebar || 'Toggle sidebar'}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="relative flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-md border border-blue-500 bg-blue-50 shrink-0">
              <img src={IconImage} alt="Selectly" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight select-none">
              <div className="text-sm font-semibold text-slate-900">Selectly</div>
            </div>
            <button
              className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-blue-100 transition-colors"
              onClick={onToggleCollapse}
              aria-label={t.options?.toggleSidebar || 'Toggle sidebar'}
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Nav */}
      <nav className="flex-1 overflow-auto flex flex-col p-2 gap-1">
        <div className="flex justify-center">
          <SidebarItem
            icon={<Blocks className="h-4 w-4" />}
            label={i18nConfig.popup.functions.title}
            collapsed={collapsed}
            active={active === 'functions'}
            onClick={() => onNavigate('functions')}
          />
        </div>
        <div className="flex justify-center">
          <SidebarItem
            icon={<Bot className="h-4 w-4" />}
            label={i18nConfig.popup.tabs.llm}
            collapsed={collapsed}
            active={active === 'llm'}
            onClick={() => onNavigate('llm')}
          />
        </div>
        <div className="mt-2 border-t border-slate-200" />
        <div className="flex justify-center pt-2">
          <SidebarItem
            icon={<Bookmark className="h-4 w-4" />}
            label={t.options?.sidebar.collections || 'Collection'}
            collapsed={collapsed}
            active={active === 'collected'}
            onClick={() => onNavigate('collected')}
          />
        </div>
        <div className="flex justify-center">
          <SidebarItem
            icon={<BookOpen className="h-4 w-4" />}
            label={(t as any).options?.sidebar?.dictionary || 'Dictionary'}
            collapsed={collapsed}
            active={active === 'dictionary'}
            onClick={() => onNavigate('dictionary')}
          />
        </div>
        <div className="mt-2 border-t border-slate-200" />
        <div className="flex justify-center">
          <SidebarItem
            icon={<SettingsIcon className="h-4 w-4" />}
            label={i18nConfig.popup.general.title}
            collapsed={collapsed}
            active={active === 'general'}
            onClick={() => onNavigate('general')}
          />
        </div>
        <div className="flex justify-center">
          <SidebarItem
            icon={<Crown className="h-4 w-4" />}
            label={i18nConfig.popup.tabs.subscription}
            collapsed={collapsed}
            active={active === 'subscription'}
            onClick={() => onNavigate('subscription')}
          />
        </div>
      </nav>

      {/* Sidebar Footer (pinned to bottom, hidden when collapsed) */}
      {!collapsed && (
        <div className="p-2 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-center gap-1 px-1">
            {socialActions.map((a) => (
              <button
                key={a.label}
                onClick={a.onClick}
                title={a.label}
                aria-label={a.label}
                className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                style={{ padding: 0 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    a.onClick();
                  }
                }}
              >
                {a.icon}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

function SidebarItem({
  icon,
  label,
  active,
  onClick,
  collapsed,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        'mb-1 flex place-items-center items-center gap-3 rounded-md border border-transparent px-2 py-2 text-sm transition-colors disabled:opacity-60 ' +
        (collapsed ? 'w-8 h-8 ' : 'w-full ') +
        (active ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'text-slate-700 hover:bg-slate-50')
      }
    >
      <span className="grid place-items-center w-8 h-8 text-slate-700">{icon}</span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

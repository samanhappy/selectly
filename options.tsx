import React, { useEffect, useState } from 'react';

import './style.css';

import { Bot, Plus, Settings as SettingsIcon } from 'lucide-react';

import { CollectionsPage } from './components/options/CollectionsPage';
import { PALETTE, type SidebarKey } from './components/options/constants';
import { DictionaryPage } from './components/options/DictionaryPage';
import { Drawer } from './components/options/Drawer';
import { AddFunctionForm } from './components/options/forms/AddFunctionForm';
import { AddProviderForm } from './components/options/forms/AddProviderForm';
import { EditFunctionForm } from './components/options/forms/EditFunctionForm';
import { GeneralSettingsForm } from './components/options/forms/GeneralSettingsForm';
import { ProviderConfigForm } from './components/options/forms/ProviderConfigForm';
import { FunctionsPage } from './components/options/FunctionsPage';
import { GeneralPage } from './components/options/GeneralPage';
import { HighlightsPage } from './components/options/HighlightsPage';
import { LLMPage } from './components/options/LLMPage';
import { OptionsHeader } from './components/options/OptionsHeader';
import { Sidebar } from './components/options/Sidebar';
import { SubscriptionPage } from './components/options/SubscriptionPage';
import { getAuthStateFromBackground } from './core/auth/auth-background-bridge';
import {
  ConfigManager,
  DEFAULT_CONFIG,
  type FunctionConfig,
  type GeneralConfig,
  type LLMConfig,
  type LLMProvider,
  type UserConfig,
} from './core/config/llm-config';
import { i18n } from './core/i18n';
import SubscriptionServiceV2 from './core/services/subscription-service-v2';
import { UserInfoProvider } from './core/user-info';

const OptionsPage: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [active, setActive] = useState<SidebarKey>('functions');

  // Settings state (migrated from popup)
  const [userConfig, setUserConfig] = useState<UserConfig>(DEFAULT_CONFIG);
  const [i18nConfig, setI18nConfig] = useState(i18n.getConfig());
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [editingFunction, setEditingFunction] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<
    'add' | 'edit' | 'config' | 'provider-config' | 'provider-add' | null
  >(null);
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [newFunctionForm, setNewFunctionForm] = useState({
    key: '',
    config: {
      title: '',
      description: '',
      icon: 'sparkles',
      model: 'default',
      prompt: '',
      autoExecute: false,
      autoExecuteDomains: [],
      autoCloseButtons: true,
      autoCloseResult: true,
      collapsed: false,
      enabled: true,
      displayDomains: [],
      isPremium: true,
      requiresAI: true,
      isBuiltIn: false,
    },
  });

  const configManager = ConfigManager.getInstance();
  const subscriptionService = SubscriptionServiceV2.getInstance();

  // Initialize i18n and settings
  useEffect(() => {
    const init = async () => {
      await i18n.initialize();
      setI18nConfig(i18n.getConfig());
      document.title = 'Selectly';
      await loadConfig();
    };
    init();

    subscriptionService.initialize();
    let mounted = true;
    // Poll background for auth state with adaptive interval to avoid tight loops when background is unavailable
    let pollIntervalMs = 5000;
    let consecutiveErrors = 0;
    const syncAuth = async () => {
      try {
        const auth = await getAuthStateFromBackground();
        if (!mounted) return;
        setIsAuthenticated(!!auth.isAuthenticated);
        // Reset backoff on success
        consecutiveErrors = 0;
        pollIntervalMs = 5000;
      } catch {
        // Exponential backoff up to 60s when background/auth is failing
        consecutiveErrors += 1;
        pollIntervalMs = Math.min(60000, 5000 * Math.pow(2, Math.min(consecutiveErrors, 4)));
      }
    };
    // Start polling loop
    let timer: number | null = null;
    const loop = () => {
      if (!mounted) return;
      syncAuth().finally(() => {
        if (!mounted) return;
        timer = setTimeout(loop, pollIntervalMs) as unknown as number;
      });
    };
    loop();
    const unsub = subscriptionService.subscribe(({ status }) => {
      setIsSubscribed(!!status?.active && isAuthenticated);
    });
    return () => {
      mounted = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      unsub();
    };
  }, [isAuthenticated]);

  const t = i18n.getConfig();

  // Settings helpers
  const loadConfig = async () => {
    try {
      const config = await configManager.loadConfig();
      setUserConfig(config);
      setI18nConfig(i18n.getConfig());
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  };

  const saveConfig = async (newConfig: UserConfig) => {
    try {
      await configManager.saveConfig(newConfig);
      setUserConfig(newConfig);
      if (newConfig.general?.language !== i18n.getCurrentLanguage()) {
        await i18n.setLanguage(newConfig.general.language);
        setI18nConfig(i18n.getConfig());
      }
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  };

  const handleGeneralConfigChange = (field: keyof GeneralConfig, value: any) => {
    const newConfig = {
      ...userConfig,
      general: {
        ...userConfig.general,
        [field]: value,
      },
    };
    saveConfig(newConfig as UserConfig);
  };

  const handleLLMConfigChange = (config: Partial<LLMConfig>) => {
    const newConfig = {
      ...userConfig,
      llm: {
        ...userConfig.llm,
        ...config,
      },
    };
    saveConfig(newConfig as UserConfig);
  };

  const handleFunctionToggle = (functionKey: string, enabled: boolean) => {
    const newConfig = {
      ...userConfig,
      functions: {
        ...userConfig.functions,
        [functionKey]: {
          ...userConfig.functions[functionKey],
          enabled,
        },
      },
    };
    saveConfig(newConfig as UserConfig);
  };

  const handleFunctionConfigChange = (
    functionKey: string,
    field: keyof FunctionConfig,
    value: string | boolean
  ) => {
    const newConfig = {
      ...userConfig,
      functions: {
        ...userConfig.functions,
        [functionKey]: {
          ...userConfig.functions[functionKey],
          [field]: value,
        },
      },
    };
    saveConfig(newConfig as UserConfig);
  };

  const openDrawer = (
    type: 'add' | 'edit' | 'config' | 'provider-config' | 'provider-add',
    functionKey?: string,
    provider?: LLMProvider
  ) => {
    setDrawerType(type);
    if (type === 'edit' && functionKey) {
      setEditingFunction(functionKey);
    }
    if ((type === 'provider-config' || type === 'provider-add') && provider) {
      setEditingProvider(provider);
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setDrawerType(null);
    setEditingFunction(null);
    setEditingProvider(null);
  };

  const handleProviderDrawer = (type: 'configure' | 'add', provider?: LLMProvider) => {
    if (type === 'configure' && provider) {
      openDrawer('provider-config', undefined, provider);
    } else if (type === 'add') {
      openDrawer('provider-add');
    }
  };

  const handleAddCustomFunction = () => {
    openDrawer('add');
  };

  const addCustomFunction = () => {
    if (!newFunctionForm.key && newFunctionForm.config.title) {
      newFunctionForm.key = newFunctionForm.config.title.toLowerCase().replace(/\s+/g, '-');
    }
    if (!newFunctionForm.key || userConfig.functions[newFunctionForm.key]) {
      return;
    }
    const newConfig = {
      ...userConfig,
      functions: {
        ...userConfig.functions,
        [newFunctionForm.key]: { ...newFunctionForm.config, requiresAI: true, isBuiltIn: false },
      },
      functionOrder: [
        ...(userConfig.functionOrder || Object.keys(userConfig.functions)),
        newFunctionForm.key,
      ],
    };
    saveConfig(newConfig as UserConfig);
    setNewFunctionForm({
      key: '',
      config: {
        title: '',
        enabled: true,
        model: 'default',
        prompt: '',
        description: '',
        icon: 'sparkles',
        autoExecute: false,
        autoCloseButtons: true,
        autoCloseResult: true,
        collapsed: false,
        displayDomains: [],
        autoExecuteDomains: [],
        isPremium: true,
        requiresAI: true,
        isBuiltIn: false,
      },
    });
    closeDrawer();
  };

  const removeFunction = (functionKey: string) => {
    const fn = (userConfig.functions as any)[functionKey];
    if (fn && fn.isBuiltIn) {
      return;
    }
    const newFunctions = { ...userConfig.functions };
    delete newFunctions[functionKey];
    const newOrder = (userConfig.functionOrder || Object.keys(userConfig.functions)).filter(
      (k) => k !== functionKey
    );
    const newConfig = {
      ...userConfig,
      functions: newFunctions,
      functionOrder: newOrder,
    };
    saveConfig(newConfig as UserConfig);
    closeDrawer();
  };

  const handleNavigate = (key: SidebarKey) => {
    setActive(key);
    if (key === 'subscription') {
      subscriptionService.refresh({ force: true, reason: 'tab' });
      getAuthStateFromBackground()
        .then((auth) => setIsAuthenticated(!!auth.isAuthenticated))
        .catch(() => {});
    }
  };

  const renderDrawerContent = () => {
    if (drawerType === 'add') {
      return (
        <AddFunctionForm
          state={newFunctionForm as any}
          i18n={i18nConfig}
          palette={PALETTE}
          onChange={(update: any) => setNewFunctionForm(update)}
          onSubmit={addCustomFunction}
          onCancel={closeDrawer}
        />
      );
    }
    if (drawerType === 'edit' && editingFunction) {
      const functionConfig = userConfig.functions[editingFunction];
      if (!functionConfig) return null;
      return (
        <EditFunctionForm
          functionKey={editingFunction}
          config={functionConfig as any}
          i18n={i18nConfig}
          palette={PALETTE}
          onChange={(field, value) =>
            handleFunctionConfigChange(editingFunction, field as any, value)
          }
          onRemove={() => removeFunction(editingFunction)}
          onClose={closeDrawer}
          allowRemove={!((functionConfig as any).isBuiltIn === true)}
        />
      );
    }
    if (drawerType === 'config') {
      return (
        <GeneralSettingsForm
          userConfig={userConfig as any}
          i18n={i18n}
          onChange={(field, value) => handleGeneralConfigChange(field as any, value)}
          onClose={closeDrawer}
        />
      );
    }
    if (drawerType === 'provider-config' && editingProvider) {
      return (
        <ProviderConfigForm
          provider={editingProvider}
          i18n={i18nConfig}
          palette={PALETTE}
          onUpdate={(provider) => {
            handleLLMConfigChange({
              providers: {
                ...userConfig.llm.providers,
                [provider.id]: provider,
              },
            });
          }}
          onRemove={() => {
            const { [editingProvider.id]: removed, ...remainingProviders } =
              userConfig.llm.providers;
            handleLLMConfigChange({
              providers: remainingProviders,
            });
            closeDrawer();
          }}
          onClose={closeDrawer}
          allowRemove={!editingProvider.isBuiltIn}
        />
      );
    }
    if (drawerType === 'provider-add') {
      return (
        <AddProviderForm
          i18n={i18nConfig}
          palette={PALETTE}
          existingProviderIds={Object.keys(userConfig.llm.providers)}
          onAdd={(provider) => {
            handleLLMConfigChange({
              providers: {
                ...userConfig.llm.providers,
                [provider.id]: provider,
              },
            });
            closeDrawer();
          }}
          onClose={closeDrawer}
        />
      );
    }
    return null;
  };

  return (
    <UserInfoProvider>
      <div className="selectly-popup h-screen overflow-hidden bg-slate-50">
        <div className="grid grid-cols-[auto,1fr] gap-0 h-full">
          {/* Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            active={active}
            i18nConfig={i18nConfig}
            t={t}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
            onNavigate={handleNavigate}
          />

          {/* Main */}
          <main className="h-full overflow-y-auto flex flex-col">
            {/* Header */}
            <OptionsHeader
              active={active}
              i18nConfig={i18nConfig}
              t={t}
              currentLanguage={userConfig.general?.language || 'en'}
              onLanguageChange={(lang) => handleGeneralConfigChange('language', lang)}
            />
            <div className="flex-1 overflow-y-auto">
              {active === 'collected' && <CollectionsPage t={t} />}
              {active === 'highlights' && (
                <HighlightsPage
                  t={t}
                  highlightColor={userConfig.functions?.highlight?.highlightColor || '#fff59d'}
                />
              )}
              {active === 'dictionary' && <DictionaryPage t={t} />}
              {active === 'functions' && (
                <FunctionsPage
                  userConfig={userConfig}
                  i18nConfig={i18nConfig}
                  isSubscribed={isSubscribed}
                  onToggle={handleFunctionToggle}
                  onEdit={(k) => openDrawer('edit', k)}
                  onReorder={(newOrder) =>
                    saveConfig({ ...userConfig, functionOrder: newOrder } as any)
                  }
                  onPremiumClick={() => setActive('subscription')}
                  onAddCustomFunction={handleAddCustomFunction}
                  onOpenConfig={() => openDrawer('config')}
                />
              )}
              {active === 'general' && <GeneralPage t={t} onReload={loadConfig} />}
              {active === 'llm' && (
                <LLMPage
                  llm={userConfig.llm}
                  i18nConfig={i18nConfig}
                  onChange={handleLLMConfigChange}
                  onOpenDrawer={handleProviderDrawer}
                />
              )}
              {active === 'subscription' && <SubscriptionPage />}
            </div>
          </main>
        </div>

        <Drawer
          open={drawerOpen}
          onClose={closeDrawer}
          title={
            drawerType === 'add' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} /> {i18nConfig.popup.functions.addCustom}
              </span>
            ) : drawerType === 'edit' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SettingsIcon size={18} /> {i18nConfig.popup.functions.editFunction}
              </span>
            ) : drawerType === 'config' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SettingsIcon size={18} /> {i18nConfig.popup.general.title}
              </span>
            ) : drawerType === 'provider-config' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} /> {i18nConfig.popup.providers.edit}
              </span>
            ) : drawerType === 'provider-add' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} /> {i18nConfig.popup.providers.addCustom}
              </span>
            ) : (
              ''
            )
          }
        >
          {renderDrawerContent()}
        </Drawer>
      </div>
    </UserInfoProvider>
  );
};

export default OptionsPage;

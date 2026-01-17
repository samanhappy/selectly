export type SupportedLanguage = 'en' | 'zh' | 'es' | 'pt' | 'ja' | 'de' | 'fr';

export interface I18nConfig {
  // Common UI text
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    add: string;
    close: string;
    test: string;
    loading: string;
    success: string;
    error: string;
    enabled: string;
    disabled: string;
    copy: string;
  };

  // Extension name and description
  extension: {
    name: string;
    description: string;
  };

  // Popup settings page
  popup: {
    title: string;
    tabs: {
      general: string;
      llm: string;
      functions: string;
      subscription: string;
    };
    llm: {
      title: string;
      baseURL: string;
      apiKey: string;
      model: string;
      testConnection: string;
      connectionSuccess: string;
      connectionError: string;
      testingConnection: string;
    };
    providers: {
      title: string;
      addCustom: string;
      addCustomProvider: string;
      builtIn: string;
      test: string;
      testSuccess: string;
      testError: string;
      apiKeyPlaceholder: string;
      providerIdPlaceholder: string;
      providerNamePlaceholder: string;
      baseURLPlaceholder: string;
      add: string;
      edit: string;
      cancel: string;
      // Form labels
      providerId: string;
      providerName: string;
      providerApiKey: string;
      // Form placeholders
      enterApiKey: string;
      enterProviderName: string;
      // Help text
      providerIdHelp: string;
      builtInNameReadonly: string;
      // Error messages
      providerIdRequired: string;
      providerIdExists: string;
      providerIdInvalid: string;
      providerNameRequired: string;
      baseURLRequired: string;
      baseURLInvalid: string;
      apiKeyRequired: string;
      // Success messages
      testSuccessCanAdd: string;
      testSuccessWillEnable: string;
      // Error messages
      testFailedCheckConfig: string;
      testFailedCheckApiKey: string;
      // Other
      noProviders: string;
      addCustomHint: string;
      getApiKey: string;
      deleteProvider: string;
      save: string;
      testConnection: string;
      testing: string;
      willAutoTestOnSave: string;
    };
    models: {
      title: string;
      defaultModelTitle: string;
      defaultModelDescription: string;
      defaultModel: string;
      default: string;
      loading: string;
      contextWindow: string;
      noProvidersEnabled: string;
      noProvidersWarning: string;
      // Enhanced model selector
      searchModels: string;
      allProviders: string;
      loadingModels: string;
      noMatchingModels: string;
      noAvailableModels: string;
      enableProvidersFirst: string;
      close: string;
      context: string;
    };
    functions: {
      title: string;
      appearance: string;
      addCustom: string;
      addCustomPremium?: string;
      editFunction: string;
      functionKey: string;
      description: string;
      prompt: string;
      icon: string;
      model: string;
      enabled: string;
      premiumRequired?: string;
      upgradeToUnlock?: string;
      placeholders: {
        functionKey: string;
        description: string;
        prompt: string;
        displayDomains?: string;
        autoExecuteDomains?: string;
      };
      labels: {
        title: string;
        icon: string;
        aiModel: string;
        promptTemplate: string;
        promptHelp: string;
        configuration: string;
        basicSettings?: string;
        advancedSettings?: string;
        autoExecute: string;
        autoExecuteHelp: string;
        autoCloseButtons: string;
        autoCloseButtonsHelp: string;
        autoCloseResult?: string;
        autoCloseResultHelp?: string;
        collapsed?: string;
        collapsedHelp?: string;
        displayDomains?: string;
        displayDomainsHelp?: string;
        autoExecuteDomains?: string;
        autoExecuteDomainsHelp?: string;
        isPremium?: string;
        isPremiumHelp?: string;
        searchEngine?: string;
        searchEngineHelp?: string;
        highlightColor?: string;
        highlightColorHelp?: string;
      };
      editTitle: string;
      searchEngines?: {
        google: string;
        bing: string;
        baidu: string;
      };
    };
    general: {
      title: string;
      language: string;
      theme: string;
      buttonPosition: string;
      buttonPositionAbove: string;
      buttonPositionBelow: string;
    };
    subscription: {
      signIn: string;
      signOut: string;
      title: string;
      // New keys
      signInToAccess: string;
      userInfo: string;
      loading: string;
      checkingStatus: string;
      refreshStatus: string;
      cannotVerify: string;
      premiumActive: string;
      premiumActiveMonthly: string;
      premiumActiveLifetime: string;
      premiumExpires: string;
      credits: string;
      features: string;
      featuresModels: string;
      featuresSync: string;
      featuresSupport: string;
      subscribe: string;
      monthlyPlan: string;
      monthlyPrice: string;
      monthlyPriceOriginal: string;
      monthlyPriceSale: string;
      lifetimePlan: string;
      lifetimePrice: string;
      lifetimePriceOriginal: string;
      lifetimePriceSale: string;
      choosePlan: string;
      planComparison: string;
      subscribeMonthly: string;
      subscribeLifetime: string;
      owned: string;
      expiresOn: string;
      description: string;
      paymentSecure: string;
      cancelAnytime: string;
      lifetimeOneTime: string;
      loginRequired: string;
      paymentError: string;
      subscriptionError: string;
      // Redeem flow
      redeemEntry?: string;
      redeemTitle?: string;
      redeemDesc?: string;
      redeemPlaceholder?: string;
      redeemSubmit?: string;
      redeemSuccess?: string;
      redeemFailed?: string;
      redeemError?: string;
      redeemLifetime?: string;
    };
  };

  // UI in content script
  content: {
    processing: string;
    complete: string;
    error: string;
    noTextSelected: string;
    dialoguePlaceholder: string;
    selectedText: string;
    chatWelcome: string;
    pin: string;
    unpin: string;
    addToDictionary: string;
  };

  button: {
    export: string;
    clear: string;
  };

  // Options page
  options?: {
    title: string;
    contentCenter: string;
    toggleSidebar: string;
    sidebar: {
      collections: string;
      dictionary: string;
      highlights?: string;
    };
    collections: {
      title: string;
      collectionGroups: string;
      search: string;
      searchPlaceholder: string;
      clearAll: string;
      clearAllConfirm: string;
      loading: string;
      noCollections: string;
      noCollectionsDescription: string;
      copy: string;
      delete: string;
      visitPage: string;
    };
    dictionary: {
      title: string;
      csvHeaderText: string;
      csvHeaderTranslation: string;
      csvHeaderSentence: string;
      csvHeaderURL: string;
      csvHeaderTitle: string;
      csvHeaderHostname: string;
      csvHeaderCreatedAt: string;
    };
    highlights?: {
      title: string;
      groups: string;
      search: string;
      searchPlaceholder: string;
      clearAll: string;
      clearAllConfirm: string;
      loading: string;
      noHighlights: string;
      copy: string;
      delete: string;
      visitPage: string;
    };
    general?: {
      dataManagement: string;
      exportConfig: string;
      exportConfigDesc: string;
      export: string;
      exportSuccess: string;
      exportError: string;
      importConfig: string;
      importConfigDesc: string;
      import: string;
      importSuccess: string;
      importError: string;
    };
  };

  // Collections page & notifications
  collections?: {
    collected: string;
    savedToCollections: string;
  };

  // Error messages
  errors: {
    systemError: string;
    cannotShowResultWindow: string;
    copyFailed: string;
    cannotAccessClipboard: string;
    llmNotConfigured: string;
    pleaseConfigureApiKey: string;
    configError: string;
    missingPromptConfig: string;
    failed: string;
    unknownError: string;
    invalidApiKey: string;
    rateLimitExceeded: string;
    serverError: string;
    networkError: string;
    llmServiceError: string;
    llmDefaultServiceError: string;
    llmStreamingServiceError: string;
    premiumRequired: string;
    pleaseSubscribe: string;
    dailyLimitExceeded: string;
    dailyLimitMessage: string;
  };

  success: {
    copySuccess: string;
    textCopiedToClipboard: string;
  };

  contextMenu: {
    translateText: string;
  };

  defaultFunctions: {
    translate: {
      title: string;
      description: string;
      prompt: string;
    };
    polish: {
      title: string;
      description: string;
      prompt: string;
    };
    explain: {
      title: string;
      description: string;
      prompt: string;
    };
    correct: {
      title: string;
      description: string;
      prompt: string;
    };
    copy: {
      title: string;
      description: string;
      prompt: string;
    };
    search: {
      title: string;
      description: string;
      prompt: string;
    };
    open: {
      title: string;
      description: string;
      prompt: string;
    };
    collect?: {
      title: string;
      description: string;
      prompt: string;
    };
    chat: {
      title: string;
      description: string;
      prompt: string;
    };
    share: {
      title: string;
      description: string;
      prompt: string;
    };
    highlight: {
      title: string;
      description: string;
      prompt: string;
    };
  };

  // Time units used in subscription UI
  time?: {
    month: string;
    months: string;
    year: string;
    years: string;
  };
}

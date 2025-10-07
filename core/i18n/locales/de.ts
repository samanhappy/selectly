import type { I18nConfig } from '../types';

export const de: I18nConfig = {
  common: {
    save: 'Speichern',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    close: 'Schließen',
    test: 'Testen',
    loading: 'Wird geladen...',
    success: 'Erfolg',
    error: 'Fehler',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    copy: 'Kopieren',
  },

  extension: {
    name: 'Selectly',
    description: 'Definieren Sie die Art Ihrer Web-Interaktion neu',
  },

  popup: {
    title: 'Selectly Einstellungen',
    tabs: {
      general: 'Allgemein',
      llm: 'LLM',
      functions: 'Funktionen',
      subscription: 'Abonnement',
    },
    llm: {
      title: 'Sprachmodell-Konfiguration',
      baseURL: 'Basis-URL',
      apiKey: 'API-Schlüssel',
      model: 'Modell',
      testConnection: 'Verbindung testen',
      connectionSuccess: 'Verbindung erfolgreich!',
      connectionError: 'Verbindung fehlgeschlagen!',
      testingConnection: 'Verbindung wird getestet...',
    },
    providers: {
      title: 'Anbieter',
      addCustom: 'Benutzerdefinierten Anbieter hinzufügen',
      addCustomProvider: 'Benutzerdefinierten Anbieter hinzufügen',
      builtIn: 'Eingebaut',
      test: 'Testen',
      testSuccess: 'Anbieter erfolgreich verbunden',
      testError:
        'Verbindung fehlgeschlagen. Bitte überprüfen Sie Ihren API-Schlüssel und die Einstellungen.',
      apiKeyPlaceholder: 'Geben Sie Ihren API-Schlüssel ein...',
      providerIdPlaceholder: 'z.B.: mein-anbieter',
      providerNamePlaceholder: 'z.B.: Mein benutzerdefinierter Anbieter',
      baseURLPlaceholder: 'https://api.example.com/v1',
      add: 'Anbieter hinzufügen',
      edit: 'Anbieter bearbeiten',
      cancel: 'Abbrechen',
      // Form labels
      providerId: 'Anbieter-ID',
      providerName: 'Anbietername',
      providerApiKey: 'API-Schlüssel',
      // Form placeholders
      enterApiKey: 'API-Schlüssel eingeben',
      enterProviderName: 'Anbietername eingeben',
      // Help text
      providerIdHelp:
        'Wird zur eindeutigen Identifizierung dieses Anbieters verwendet, darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten',
      builtInNameReadonly: 'Eingebaute Anbieternamen können nicht geändert werden',
      // Error messages
      providerIdRequired: 'Bitte geben Sie die Anbieter-ID ein',
      providerIdExists: 'Diese ID existiert bereits, bitte verwenden Sie eine andere ID',
      providerIdInvalid: 'ID darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten',
      providerNameRequired: 'Bitte geben Sie den Anbieternamen ein',
      baseURLRequired: 'Bitte geben Sie die API-Basis-URL ein',
      baseURLInvalid: 'API-URL muss mit http:// oder https:// beginnen',
      apiKeyRequired: 'Bitte geben Sie den API-Schlüssel ein',
      // Success messages
      testSuccessCanAdd: 'Verbindungstest erfolgreich! Sie können diesen Anbieter hinzufügen.',
      testSuccessWillEnable:
        'Verbindungstest erfolgreich! Der Anbieter wird automatisch aktiviert.',
      // Error messages
      testFailedCheckConfig:
        'Verbindungstest fehlgeschlagen, bitte überprüfen Sie, ob die Konfiguration korrekt ist.',
      testFailedCheckApiKey:
        'Verbindungstest fehlgeschlagen, bitte überprüfen Sie, ob API-Schlüssel und Basis-URL korrekt sind.',
      // Other
      noProviders: 'Keine Anbieter',
      addCustomHint:
        'Klicken Sie auf die Schaltfläche oben, um benutzerdefinierte Anbieter hinzuzufügen',
      getApiKey: 'API-Schlüssel abrufen',
      deleteProvider: 'Anbieter löschen',
      save: 'Speichern',
      testConnection: 'Verbindung testen',
      testing: 'Wird getestet',
      willAutoTestOnSave: 'API-Schlüssel wird beim Speichern automatisch getestet',
    },
    models: {
      title: 'Modellauswahl',
      defaultModelTitle: 'Modell',
      defaultModelDescription:
        "Dieses Modell wird verwendet, wenn Funktionen 'Standard' als ihr Modell ausgewählt haben.",
      defaultModel: 'Standardmodell',
      default: 'Standard',
      loading: 'Modelle werden geladen...',
      contextWindow: 'Kontextfenster',
      noProvidersEnabled:
        'Keine Anbieter aktiviert. Bitte konfigurieren und testen Sie zuerst Ihre Anbieter.',
      noProvidersWarning:
        'Bitte aktivieren Sie mindestens einen Anbieter, um ein Standardmodell auszuwählen.',
      // Enhanced model selector
      searchModels: 'Modelle suchen...',
      allProviders: 'Alle Anbieter',
      loadingModels: 'Modellliste wird geladen...',
      noMatchingModels: 'Keine passenden Modelle gefunden',
      noAvailableModels: 'Keine verfügbaren Modelle',
      enableProvidersFirst: 'Bitte aktivieren Sie zuerst mindestens einen Anbieter',
      close: 'Schließen',
      context: 'Kontext',
    },
    functions: {
      title: 'Funktionen',
      appearance: 'Erscheinungsbild',
      addCustom: 'Benutzerdefinierte Funktion hinzufügen',
      editFunction: 'Funktion bearbeiten',
      functionKey: 'Funktionsschlüssel',
      description: 'Beschreibung',
      prompt: 'Eingabeaufforderung',
      icon: 'Symbol',
      model: 'Modell',
      enabled: 'Aktiviert',
      premiumRequired: 'Premium erforderlich',
      upgradeToUnlock: 'Auf Premium upgraden, um diese Funktion freizuschalten',
      placeholders: {
        functionKey: 'z.B.: translate, summarize',
        description: 'z.B.: Ausgewählten Text übersetzen',
        prompt: 'Bitte übersetzen Sie den folgenden Text: {text}',
        displayDomains: 'z.B.: example.com, docs.example.com',
        autoExecuteDomains: 'z.B.: example.com',
      },
      labels: {
        title: 'Name',
        icon: 'Symbol',
        aiModel: 'Modell',
        promptTemplate: 'Eingabeaufforderung',
        promptHelp: 'Verwenden Sie {text}, um den ausgewählten Text darzustellen',
        configuration: 'Konfiguration',
        basicSettings: 'Grundeinstellungen',
        advancedSettings: 'Erweiterte Einstellungen',
        autoExecute: 'Automatisch ausführen',
        autoExecuteHelp: 'Diese Funktion automatisch bei Textauswahl ausführen',
        autoCloseButtons: 'Schaltflächen automatisch schließen',
        autoCloseButtonsHelp: 'Aktionsschaltflächen nach Ausführung automatisch schließen',
        autoCloseResult: 'Ergebnis automatisch schließen',
        autoCloseResultHelp: 'Ergebnisfenster automatisch schließen beim Klicken außerhalb',
        collapsed: 'Eingeklappt',
        collapsedHelp: 'Diese Funktion unter dem ⋯-Menü in der Symbolleiste verstecken',
        displayDomains: 'Anzeigedomänen',
        displayDomainsHelp:
          'Kommagetrennte Hostnamen. Leer lassen, um auf allen Sites anzuzeigen. Unterstützt Subdomänen (z.B. docs.example.com).',
        autoExecuteDomains: 'Auto-Ausführungsdomänen',
        autoExecuteDomainsHelp:
          'Auto-Ausführung auf diese Domänen beschränken (gleiche Regeln wie Anzeigedomänen)',
        isPremium: 'Premium-Funktion',
        isPremiumHelp: 'Wenn aktiviert, erfordert diese Funktion ein aktives Premium-Abonnement',
        searchEngine: 'Suchmaschine',
        searchEngineHelp: 'Wählen Sie die Suchmaschine für Suchanfragen',
      },
      editTitle: 'Funktion bearbeiten',
      searchEngines: {
        google: 'Google',
        bing: 'Bing',
        baidu: 'Baidu',
      },
    },
    general: {
      title: 'Konfiguration',
      language: 'Sprache',
      theme: 'Design',
      buttonPosition: 'Schaltflächenposition',
      buttonPositionAbove: 'Oben',
      buttonPositionBelow: 'Unten',
    },
    subscription: {
      signIn: 'Anmelden',
      signOut: 'Abmelden',
      title: 'Premium-Abonnement',
      signInToAccess: 'Melden Sie sich an, um Premium-Funktionen zu nutzen',
      userInfo: 'Benutzer',
      loading: 'Benutzerinformationen werden geladen...',
      checkingStatus: 'Abonnementstatus wird überprüft...',
      refreshStatus: 'Aktualisieren',
      cannotVerify: 'Abonnementstatus kann nicht überprüft werden',
      premiumActive: 'Premium-Mitgliedschaft aktiviert',
      premiumActiveMonthly: 'Monatliche Mitgliedschaft aktiviert',
      premiumActiveLifetime: 'Lebenslange Mitgliedschaft aktiviert',
      premiumExpires: 'Läuft ab',
      features: 'Premium-Funktionen umfassen:',
      featuresUnlimited: 'Unbegrenzte KI-Operationen',
      featuresAdvanced: 'Erweiterte Textverarbeitungsfunktionen',
      featuresSupport: 'Prioritärer Kundensupport',
      subscribe: 'Premium abonnieren',
      monthlyPlan: 'Pro Monatlich',
      monthlyPrice: '2$/Monat',
      monthlyPriceOriginal: '3$',
      monthlyPriceSale: 'Zeitlich begrenztes Angebot',
      lifetimePlan: 'Pro Lebenslang',
      lifetimePrice: '19$ lebenslang',
      lifetimePriceOriginal: '29$',
      lifetimePriceSale: 'Zeitlich begrenztes Angebot',
      choosePlan: 'Wählen Sie Ihren Abonnementplan',
      planComparison: 'Beide Pläne enthalten dieselben Premium-Funktionen',
      subscribeMonthly: 'Monatlich abonnieren',
      subscribeLifetime: 'Lebenslang kaufen',
      owned: 'Besessen',
      expiresOn: 'Läuft ab am',
      description:
        'Abonnieren Sie Premium-Funktionen, um leistungsfähigere KI-Verarbeitungsmöglichkeiten und prioritären Support zu erhalten.',
      paymentSecure:
        'Die Zahlung wird über die sichere Stripe-Plattform abgewickelt. Sie können Ihr Abonnement jederzeit kündigen.',
      cancelAnytime: 'Sie können Ihr Abonnement jederzeit kündigen.',
      lifetimeOneTime: 'Einmalige Zahlung, lebenslanger Zugang',
      loginRequired: 'Bitte melden Sie sich zuerst an, um Benutzerinformationen zu erhalten',
      paymentError:
        'Konfigurationsfehler des Zahlungssystems, bitte kontaktieren Sie den Administrator',
      subscriptionError:
        'Ein Fehler ist während des Abonnements aufgetreten, bitte versuchen Sie es erneut',
      redeemEntry: 'Code einlösen',
      redeemTitle: 'Mitgliedscode einlösen',
      redeemDesc: 'Geben Sie Ihren Einlösecode ein, um die Premium-Mitgliedschaft zu aktivieren',
      redeemPlaceholder: 'Einlösecode eingeben',
      redeemSubmit: 'Einlösen',
      redeemSuccess: 'Erfolgreich eingelöst',
      redeemFailed: 'Einlösung fehlgeschlagen',
      redeemError: 'Einlösefehler, bitte erneut versuchen',
      redeemLifetime: 'Lebenslange Mitgliedschaft aktiviert',
    },
  },

  content: {
    processing: 'Wird bearbeitet...',
    complete: 'Vollständig',
    error: 'Verarbeitung fehlgeschlagen',
    noTextSelected: 'Kein Text ausgewählt',
    dialoguePlaceholder: 'Geben Sie Ihre Nachricht ein...',
    selectedText: 'Ausgewählter Text',
    chatWelcome: 'Fragen Sie mich alles über den ausgewählten Text...',
    pin: 'Anheften',
    unpin: 'Loslösen',
    addToDictionary: 'Zum Wörterbuch hinzufügen',
  },

  button: {
    export: 'Exportieren',
    clear: 'Alles löschen',
  },

  options: {
    title: 'Selectly Optionen',
    contentCenter: 'Inhaltszentrum',
    toggleSidebar: 'Seitenleiste umschalten',
    sidebar: {
      collections: 'Sammlungen',
      dictionary: 'Wörterbuch',
    },
    collections: {
      title: 'Sammlungen',
      collectionGroups: 'Sammlungsgruppen',
      search: 'Suchen',
      searchPlaceholder: 'Suchen',
      clearAll: 'Alle löschen',
      clearAllConfirm: 'Alle Sammlungen löschen?',
      loading: 'Wird geladen...',
      noCollections:
        'Noch keine Sammlungen. Wählen Sie Text auf einer beliebigen Seite aus und klicken Sie auf die Sammeln-Schaltfläche zum Speichern.',
      noCollectionsDescription:
        'Noch keine Sammlungen. Wählen Sie Text auf einer beliebigen Seite aus und klicken Sie auf die Sammeln-Schaltfläche zum Speichern.',
      copy: 'Kopieren',
      delete: 'Löschen',
      visitPage: 'Seite besuchen',
    },
    dictionary: {
      title: 'Wörterbuch',
      csvHeaderText: 'Text',
      csvHeaderTranslation: 'Übersetzung',
      csvHeaderSentence: 'Satz',
      csvHeaderURL: 'URL',
      csvHeaderTitle: 'Titel',
      csvHeaderHostname: 'Hostname',
      csvHeaderCreatedAt: 'Erstellt am',
    },
  },

  collections: {
    collected: 'Gesammelt',
    savedToCollections: 'In Sammlungen gespeichert',
  },

  errors: {
    systemError: 'Systemfehler',
    cannotShowResultWindow: 'Ergebnisfenster kann nicht angezeigt werden',
    copyFailed: 'Kopieren fehlgeschlagen',
    cannotAccessClipboard: 'Zugriff auf Zwischenablage nicht möglich',
    llmNotConfigured: 'LLM-Service nicht konfiguriert',
    pleaseConfigureApiKey:
      'Bitte konfigurieren Sie den API-Schlüssel in den Einstellungen, bevor Sie KI-Funktionen verwenden',
    configError: 'Konfigurationsfehler',
    missingPromptConfig: 'Funktion fehlt Eingabeaufforderungs-Konfiguration',
    failed: 'Fehlgeschlagen',
    unknownError: 'Unbekannter Fehler',
    invalidApiKey: 'Ungültiger API-Schlüssel, bitte überprüfen Sie die Einstellungen',
    rateLimitExceeded: 'API-Ratenlimit überschritten, bitte versuchen Sie es später erneut',
    serverError: 'Serverfehler, bitte versuchen Sie es später erneut',
    networkError: 'Netzwerkverbindungsfehler, bitte überprüfen Sie die Netzwerkeinstellungen',
    llmServiceError: 'LLM-Service-Fehler',
    llmDefaultServiceError:
      'Standardmodell-Service ist vorübergehend nicht verfügbar, bitte fügen Sie einen anderen Anbieter hinzu oder versuchen Sie es später erneut',
    llmStreamingServiceError: 'LLM-Streaming-Service-Fehler',
    premiumRequired: 'Premium-Funktion',
    pleaseSubscribe: 'Premium-Abonnement ist erforderlich, um diese Funktion zu nutzen',
    dailyLimitExceeded: 'Tägliches Limit überschritten',
    dailyLimitMessage:
      'Sie haben Ihr tägliches Limit für KI-Operationen erreicht. Bitte warten Sie bis morgen oder abonnieren Sie Premium für unbegrenzte Nutzung.',
  },

  success: {
    copySuccess: 'Erfolgreich kopiert',
    textCopiedToClipboard: 'Text in die Zwischenablage kopiert',
  },

  time: {
    month: 'Monat',
    months: 'Monate',
    year: 'Jahr',
    years: 'Jahre',
  },

  contextMenu: {
    translateText: '"%s" übersetzen',
  },

  defaultFunctions: {
    translate: {
      title: 'Übersetzen',
      description: 'Ausgewählten Text übersetzen',
      prompt:
        'Sie sind ein professioneller Übersetzer. Bitte übersetzen Sie den folgenden Text ins {targetLanguage}. Wenn der Text bereits auf {targetLanguage} ist, übersetzen Sie ihn stattdessen ins Englische. Bewahren Sie den ursprünglichen Ton und die Bedeutung. Geben Sie nur die Übersetzung ohne Erklärung oder zusätzlichen Text zurück:\n\n{text}',
    },
    polish: {
      title: 'Polieren',
      description: 'Ausgewählten Text polieren',
      prompt:
        'Bitte polieren und verbessern Sie den folgenden Text, um ihn flüssiger, genauer und professioneller zu machen. Bewahren Sie die ursprüngliche Bedeutung und Sprache unverändert, geben Sie nur das polierte Ergebnis zurück:\n\n{text}',
    },
    explain: {
      title: 'Erklären',
      description: 'Ausgewählten Text erklären',
      prompt:
        'Bitte erklären Sie den folgenden Text klar und prägnant in {targetLanguage}. Konzentrieren Sie sich auf die Kernbedeutung und den wesentlichen Kontext. Halten Sie Ihre Erklärung kurz und leicht verständlich:\n\n{text}',
    },
    correct: {
      title: 'Korrigieren',
      description: 'Ausgewählten Text korrigieren',
      prompt:
        'Bitte überprüfen und korrigieren Sie Grammatik-, Rechtschreib- und Ausdrucksfehler im folgenden Text, geben Sie den korrigierten Text zurück:\n\n{text}',
    },
    copy: {
      title: 'Kopieren',
      description: 'Ausgewählten Text kopieren',
      prompt: '{text}',
    },
    search: {
      title: 'Suchen',
      description: 'Ausgewählten Text suchen',
      prompt: '{text}',
    },
    open: {
      title: 'Öffnen',
      description: 'Ausgewählte URL öffnen',
      prompt: '{text}',
    },
    chat: {
      title: 'Chat',
      description: 'Mit KI chatten',
      prompt:
        'Sie sind ein hilfreicher KI-Assistent. Bitte antworten Sie auf Benutzernachrichten in einer gesprächigen Weise. Der Benutzer hat diesen Text ausgewählt: "{text}".',
    },
    share: {
      title: 'Teilen',
      description: 'Share-Bild generieren',
      prompt: '{text}',
    },
  },
};

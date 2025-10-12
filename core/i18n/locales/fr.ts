import type { I18nConfig } from '../types';

export const fr: I18nConfig = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    close: 'Fermer',
    test: 'Tester',
    loading: 'Chargement...',
    success: 'Succès',
    error: 'Erreur',
    enabled: 'Activé',
    disabled: 'Désactivé',
    copy: 'Copier',
  },

  extension: {
    name: 'Selectly',
    description: "Redéfinissez votre façon d'interagir avec le web",
  },

  popup: {
    title: 'Paramètres Selectly',
    tabs: {
      general: 'Général',
      llm: 'LLM',
      functions: 'Fonctions',
      subscription: 'Abonnement',
    },
    llm: {
      title: 'Configuration du Modèle de Langage',
      baseURL: 'URL de Base',
      apiKey: 'Clé API',
      model: 'Modèle',
      testConnection: 'Tester la Connexion',
      connectionSuccess: 'Connexion réussie !',
      connectionError: 'Échec de la connexion !',
      testingConnection: 'Test de connexion en cours...',
    },
    providers: {
      title: 'Fournisseurs',
      addCustom: 'Ajouter un Fournisseur Personnalisé',
      addCustomProvider: 'Ajouter un Fournisseur Personnalisé',
      builtIn: 'Intégré',
      test: 'Tester',
      testSuccess: 'Fournisseur connecté avec succès',
      testError: 'Échec de la connexion. Veuillez vérifier votre clé API et les paramètres.',
      apiKeyPlaceholder: 'Entrez votre clé API...',
      providerIdPlaceholder: 'ex.: mon-fournisseur',
      providerNamePlaceholder: 'ex.: Mon Fournisseur Personnalisé',
      baseURLPlaceholder: 'https://api.example.com/v1',
      add: 'Ajouter le Fournisseur',
      edit: 'Modifier le Fournisseur',
      cancel: 'Annuler',
      // Form labels
      providerId: 'ID du Fournisseur',
      providerName: 'Nom du Fournisseur',
      providerApiKey: 'Clé API',
      // Form placeholders
      enterApiKey: 'Entrer la clé API',
      enterProviderName: 'Entrer le nom du fournisseur',
      // Help text
      providerIdHelp:
        'Utilisé pour identifier uniquement ce fournisseur, ne peut contenir que des lettres, chiffres, traits de soulignement et tirets',
      builtInNameReadonly: 'Les noms des fournisseurs intégrés ne peuvent pas être modifiés',
      // Error messages
      providerIdRequired: "Veuillez entrer l'ID du fournisseur",
      providerIdExists: 'Cet ID existe déjà, veuillez utiliser un ID différent',
      providerIdInvalid:
        "L'ID ne peut contenir que des lettres, chiffres, traits de soulignement et tirets",
      providerNameRequired: 'Veuillez entrer le nom du fournisseur',
      baseURLRequired: "Veuillez entrer l'URL de base de l'API",
      baseURLInvalid: "L'URL de l'API doit commencer par http:// ou https://",
      apiKeyRequired: 'Veuillez entrer la clé API',
      // Success messages
      testSuccessCanAdd: 'Test de connexion réussi ! Vous pouvez ajouter ce fournisseur.',
      testSuccessWillEnable:
        'Test de connexion réussi ! Le fournisseur sera activé automatiquement.',
      // Error messages
      testFailedCheckConfig:
        'Test de connexion échoué, veuillez vérifier si la configuration est correcte.',
      testFailedCheckApiKey:
        "Test de connexion échoué, veuillez vérifier si la clé API et l'URL de base sont correctes.",
      // Other
      noProviders: 'Aucun fournisseur',
      addCustomHint: 'Cliquez sur le bouton ci-dessus pour ajouter des fournisseurs personnalisés',
      getApiKey: 'Obtenir une Clé API',
      deleteProvider: 'Supprimer le Fournisseur',
      save: 'Enregistrer',
      testConnection: 'Tester la Connexion',
      testing: 'Test en cours',
      willAutoTestOnSave: "La clé API sera automatiquement testée lors de l'enregistrement",
    },
    models: {
      title: 'Sélection de Modèle',
      defaultModelTitle: 'Modèle',
      defaultModelDescription:
        "Ce modèle sera utilisé lorsque les fonctions ont 'par défaut' sélectionné comme leur modèle.",
      defaultModel: 'Modèle par Défaut',
      default: 'Par défaut',
      loading: 'Chargement des modèles...',
      contextWindow: 'Fenêtre de Contexte',
      noProvidersEnabled:
        "Aucun fournisseur activé. Veuillez configurer et tester vos fournisseurs d'abord.",
      noProvidersWarning:
        'Veuillez activer au moins un fournisseur pour sélectionner un modèle par défaut.',
      // Enhanced model selector
      searchModels: 'Rechercher des modèles...',
      allProviders: 'Tous les Fournisseurs',
      loadingModels: 'Chargement de la liste des modèles...',
      noMatchingModels: 'Aucun modèle correspondant trouvé',
      noAvailableModels: 'Aucun modèle disponible',
      enableProvidersFirst: "Veuillez activer au moins un fournisseur d'abord",
      close: 'Fermer',
      context: 'Contexte',
    },
    functions: {
      title: 'Fonctions',
      appearance: 'Apparence',
      addCustom: 'Ajouter une Fonction Personnalisée',
      editFunction: 'Modifier la Fonction',
      functionKey: 'Clé de Fonction',
      description: 'Description',
      prompt: 'Invite',
      icon: 'Icône',
      model: 'Modèle',
      enabled: 'Activé',
      premiumRequired: 'Premium Requis',
      upgradeToUnlock: 'Passer à Premium pour débloquer cette fonction',
      placeholders: {
        functionKey: 'ex.: translate, summarize',
        description: 'ex.: Traduire le texte sélectionné',
        prompt: 'Veuillez traduire le texte suivant : {text}',
        displayDomains: 'ex.: example.com, docs.example.com',
        autoExecuteDomains: 'ex.: example.com',
      },
      labels: {
        title: 'Nom',
        icon: 'Icône',
        aiModel: 'Modèle',
        promptTemplate: 'Invite',
        promptHelp: 'Utilisez {text} pour représenter le texte sélectionné',
        configuration: 'Configuration',
        basicSettings: 'Paramètres de Base',
        advancedSettings: 'Paramètres Avancés',
        autoExecute: 'Exécution Automatique',
        autoExecuteHelp: 'Exécuter cette fonction automatiquement lors de la sélection de texte',
        autoCloseButtons: 'Fermer Automatiquement les Boutons',
        autoCloseButtonsHelp: "Fermer les boutons d'action automatiquement après l'exécution",
        autoCloseResult: 'Fermer Automatiquement le Résultat',
        autoCloseResultHelp:
          "Fermer la fenêtre de résultat automatiquement en cliquant à l'extérieur",
        collapsed: 'Replié',
        collapsedHelp: "Masquer cette fonction sous le menu ⋯ dans la barre d'outils",
        displayDomains: "Domaines d'Affichage",
        displayDomainsHelp:
          "Noms d'hôtes séparés par des virgules. Laisser vide pour afficher sur tous les sites. Supporte les sous-domaines (ex. docs.example.com).",
        autoExecuteDomains: "Domaines d'Exécution Automatique",
        autoExecuteDomainsHelp:
          "Restreindre l'exécution automatique à ces domaines (mêmes règles que les Domaines d'Affichage)",
        isPremium: 'Fonctionnalité Premium',
        isPremiumHelp:
          "Lorsqu'elle est activée, cette fonctionnalité nécessite un abonnement premium actif",
        searchEngine: 'Moteur de Recherche',
        searchEngineHelp: 'Choisissez le moteur de recherche à utiliser',
      },
      editTitle: 'Modifier la Fonction',
      searchEngines: {
        google: 'Google',
        bing: 'Bing',
        baidu: 'Baidu',
      },
    },
    general: {
      title: 'Configuration',
      language: 'Langue',
      theme: 'Thème',
      buttonPosition: 'Position du Bouton',
      buttonPositionAbove: 'Au-dessus',
      buttonPositionBelow: 'En-dessous',
    },
    subscription: {
      signIn: 'Se Connecter',
      signOut: 'Se Déconnecter',
      title: 'Abonnement Premium',
      signInToAccess: 'Connectez-vous pour accéder aux fonctionnalités premium',
      userInfo: 'Utilisateur',
      loading: 'Chargement des informations utilisateur...',
      checkingStatus: "Vérification du statut d'abonnement...",
      refreshStatus: 'Actualiser',
      cannotVerify: "Impossible de vérifier le statut d'abonnement",
      premiumActive: 'Abonnement premium activé',
      premiumActiveMonthly: 'Abonnement mensuel activé',
      premiumActiveLifetime: 'Abonnement à vie activé',
      premiumExpires: 'Expire',
      credits: 'Crédits',
      features: 'Les fonctions premium incluent :',
      featuresUnlimited: 'Opérations IA illimitées',
      featuresAdvanced: 'Fonctions avancées de traitement de texte',
      featuresSupport: 'Support client prioritaire',
      subscribe: "S'abonner à Premium",
      monthlyPlan: 'Pro Mensuel',
      monthlyPrice: '2$/mois',
      monthlyPriceOriginal: '3$',
      monthlyPriceSale: 'Offre à Durée Limitée',
      lifetimePlan: 'Pro à Vie',
      lifetimePrice: '19$ à vie',
      lifetimePriceOriginal: '29$',
      lifetimePriceSale: 'Offre à Durée Limitée',
      choosePlan: "Choisissez votre plan d'abonnement",
      planComparison: 'Les deux plans incluent les mêmes fonctions premium',
      subscribeMonthly: "S'abonner Mensuellement",
      subscribeLifetime: 'Acheter à Vie',
      owned: 'Possédé',
      expiresOn: 'Expire le',
      description:
        'Abonnez-vous aux fonctions premium pour obtenir des capacités de traitement IA plus puissantes et un support prioritaire.',
      paymentSecure:
        'Le paiement est traité via la plateforme sécurisée Stripe. Vous pouvez annuler votre abonnement à tout moment.',
      cancelAnytime: 'Vous pouvez annuler votre abonnement à tout moment.',
      lifetimeOneTime: 'Paiement unique, accès à vie',
      loginRequired: "Veuillez vous connecter d'abord pour obtenir les informations utilisateur",
      paymentError:
        "Erreur de configuration du système de paiement, veuillez contacter l'administrateur",
      subscriptionError: "Une erreur s'est produite lors de l'abonnement, veuillez réessayer",
      redeemEntry: 'Utiliser un code',
      redeemTitle: "Utiliser un code d'abonnement",
      redeemDesc: "Entrez votre code pour activer l'abonnement premium",
      redeemPlaceholder: 'Entrez le code',
      redeemSubmit: 'Utiliser',
      redeemSuccess: 'Code utilisé avec succès',
      redeemFailed: "Échec de l'utilisation",
      redeemError: "Erreur d'utilisation, veuillez réessayer",
      redeemLifetime: 'Abonnement à vie activé',
    },
  },

  content: {
    processing: 'Traitement en cours...',
    complete: 'Terminé',
    error: 'Échec du traitement',
    noTextSelected: 'Aucun texte sélectionné',
    dialoguePlaceholder: 'Tapez votre message...',
    selectedText: 'Texte Sélectionné',
    chatWelcome: "Demandez-moi n'importe quoi sur le texte sélectionné...",
    pin: 'Épingler',
    unpin: 'Désépingler',
    addToDictionary: 'Ajouter au Dictionnaire',
  },

  button: {
    export: 'Exporter',
    clear: 'Tout Effacer',
  },

  options: {
    title: 'Options Selectly',
    contentCenter: 'Centre de Contenu',
    toggleSidebar: 'Basculer la barre latérale',
    sidebar: {
      collections: 'Collection',
      dictionary: 'Dictionnaire',
    },
    collections: {
      title: 'Collection',
      collectionGroups: 'Groupes de Collection',
      search: 'Rechercher',
      searchPlaceholder: 'Rechercher',
      clearAll: 'Tout Effacer',
      clearAllConfirm: 'Effacer toutes les collections ?',
      loading: 'Chargement...',
      noCollections:
        "Pas encore de collections. Sélectionnez du texte sur n'importe quelle page et cliquez sur le bouton collecter pour sauvegarder.",
      noCollectionsDescription:
        "Pas encore de collections. Sélectionnez du texte sur n'importe quelle page et cliquez sur le bouton collecter pour sauvegarder.",
      copy: 'Copier',
      delete: 'Supprimer',
      visitPage: 'Visiter la page',
    },
    dictionary: {
      title: 'Dictionnaire',
      csvHeaderText: 'Texte',
      csvHeaderTranslation: 'Traduction',
      csvHeaderSentence: 'Phrase',
      csvHeaderURL: 'URL',
      csvHeaderTitle: 'Titre',
      csvHeaderHostname: "Nom d'Hôte",
      csvHeaderCreatedAt: 'Créé le',
    },
  },

  collections: {
    collected: 'Collecté',
    savedToCollections: 'Sauvegardé dans Collection',
  },

  errors: {
    systemError: 'Erreur Système',
    cannotShowResultWindow: "Impossible d'afficher la fenêtre de résultats",
    copyFailed: 'Échec de la Copie',
    cannotAccessClipboard: "Impossible d'accéder au presse-papiers",
    llmNotConfigured: 'Service LLM Non Configuré',
    pleaseConfigureApiKey:
      "Veuillez configurer la Clé API dans les paramètres avant d'utiliser les fonctions IA",
    configError: 'Erreur de Configuration',
    missingPromptConfig: "Fonction manque de configuration d'invite",
    failed: 'Échoué',
    unknownError: 'Erreur inconnue',
    invalidApiKey: 'Clé API invalide, veuillez vérifier les paramètres',
    rateLimitExceeded: 'Limite de taux API dépassée, veuillez réessayer plus tard',
    serverError: 'Erreur serveur, veuillez réessayer plus tard',
    networkError: 'Erreur de connexion réseau, veuillez vérifier les paramètres réseau',
    llmServiceError: 'Erreur du Service LLM',
    llmDefaultServiceError:
      'Le service du modèle par défaut est temporairement indisponible, veuillez ajouter un autre fournisseur ou réessayer plus tard',
    llmStreamingServiceError: 'Erreur du Service de Streaming LLM',
    premiumRequired: 'Fonction Premium',
    pleaseSubscribe: 'Un abonnement premium est requis pour utiliser cette fonction',
    dailyLimitExceeded: 'Limite quotidienne dépassée',
    dailyLimitMessage:
      "Vous avez atteint votre limite quotidienne d'opérations IA. Veuillez attendre jusqu'à demain ou vous abonner à Premium pour une utilisation illimitée.",
  },

  success: {
    copySuccess: 'Copie Réussie',
    textCopiedToClipboard: 'Texte copié dans le presse-papiers',
  },

  time: {
    month: 'mois',
    months: 'mois',
    year: 'an',
    years: 'ans',
  },

  contextMenu: {
    translateText: 'Traduire "%s"',
  },

  defaultFunctions: {
    translate: {
      title: 'Traduire',
      description: 'Traduire le texte sélectionné',
      prompt:
        'Vous êtes un traducteur professionnel. Veuillez traduire le texte suivant en {targetLanguage}. Si le texte est déjà en {targetLanguage}, traduisez-le en anglais à la place. Maintenez le ton et le sens original. Ne retournez que la traduction sans aucune explication ou texte supplémentaire :\n\n{text}',
    },
    polish: {
      title: 'Polir',
      description: 'Polir le texte sélectionné',
      prompt:
        'Veuillez polir et améliorer le texte suivant pour le rendre plus fluide, précis et professionnel. Gardez le sens et la langue originaux inchangés, ne retournez que le résultat poli :\n\n{text}',
    },
    explain: {
      title: 'Expliquer',
      description: 'Expliquer le texte sélectionné',
      prompt:
        'Veuillez expliquer le texte suivant clairement et de manière concise en {targetLanguage}. Concentrez-vous sur le sens clé et le contexte essentiel. Gardez votre explication brève et facile à comprendre :\n\n{text}',
    },
    correct: {
      title: 'Corriger',
      description: 'Corriger le texte sélectionné',
      prompt:
        "Veuillez vérifier et corriger les erreurs de grammaire, d'orthographe et d'expression dans le texte suivant, retournez le texte corrigé :\n\n{text}",
    },
    copy: {
      title: 'Copier',
      description: 'Copier le texte sélectionné',
      prompt: '{text}',
    },
    search: {
      title: 'Rechercher',
      description: 'Rechercher le texte sélectionné',
      prompt: '{text}',
    },
    open: {
      title: 'Ouvrir',
      description: "Ouvrir l'URL sélectionnée",
      prompt: '{text}',
    },
    chat: {
      title: 'Chat',
      description: "Chatter avec l'IA",
      prompt:
        'Vous êtes un assistant IA utile. Veuillez répondre aux messages de l\'utilisateur de manière conversationnelle. L\'utilisateur a sélectionné ce texte : "{text}".',
    },
    share: {
      title: 'Partager',
      description: 'Générer une image de partage',
      prompt: '{text}',
    },
  },
};

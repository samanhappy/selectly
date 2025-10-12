import type { I18nConfig } from '../types';

export const es: I18nConfig = {
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    edit: 'Editar',
    add: 'Añadir',
    close: 'Cerrar',
    test: 'Probar',
    loading: 'Cargando...',
    success: 'Éxito',
    error: 'Error',
    enabled: 'Habilitado',
    disabled: 'Deshabilitado',
    copy: 'Copiar',
  },

  extension: {
    name: 'Selectly',
    description: 'Redefine la forma en que interactúas con la web',
  },

  popup: {
    title: 'Configuración de Selectly',
    tabs: {
      general: 'General',
      llm: 'LLM',
      functions: 'Funciones',
      subscription: 'Suscripción',
    },
    llm: {
      title: 'Configuración del Modelo de Lenguaje',
      baseURL: 'URL Base',
      apiKey: 'Clave API',
      model: 'Modelo',
      testConnection: 'Probar Conexión',
      connectionSuccess: '¡Conexión exitosa!',
      connectionError: '¡Conexión fallida!',
      testingConnection: 'Probando conexión...',
    },
    providers: {
      title: 'Proveedores',
      addCustom: 'Añadir Proveedor Personalizado',
      addCustomProvider: 'Añadir Proveedor Personalizado',
      builtIn: 'Integrado',
      test: 'Probar',
      testSuccess: 'Proveedor conectado exitosamente',
      testError: 'Conexión fallida. Por favor, verifica tu clave API y configuración.',
      apiKeyPlaceholder: 'Ingresa tu clave API...',
      providerIdPlaceholder: 'ej.: mi-proveedor',
      providerNamePlaceholder: 'ej.: Mi Proveedor Personalizado',
      baseURLPlaceholder: 'https://api.example.com/v1',
      add: 'Añadir Proveedor',
      edit: 'Editar Proveedor',
      cancel: 'Cancelar',
      // Form labels
      providerId: 'ID del Proveedor',
      providerName: 'Nombre del Proveedor',
      providerApiKey: 'Clave API',
      // Form placeholders
      enterApiKey: 'Ingresa la clave API',
      enterProviderName: 'Ingresa el nombre del proveedor',
      // Help text
      providerIdHelp:
        'Usado para identificar únicamente este proveedor, solo puede contener letras, números, guiones bajos y guiones',
      builtInNameReadonly: 'Los nombres de proveedores integrados no se pueden modificar',
      // Error messages
      providerIdRequired: 'Por favor, ingresa el ID del proveedor',
      providerIdExists: 'Este ID ya existe, por favor usa un ID diferente',
      providerIdInvalid: 'El ID solo puede contener letras, números, guiones bajos y guiones',
      providerNameRequired: 'Por favor, ingresa el nombre del proveedor',
      baseURLRequired: 'Por favor, ingresa la URL base de la API',
      baseURLInvalid: 'La URL de la API debe comenzar con http:// o https://',
      apiKeyRequired: 'Por favor, ingresa la clave API',
      // Success messages
      testSuccessCanAdd: '¡Prueba de conexión exitosa! Puedes añadir este proveedor.',
      testSuccessWillEnable:
        '¡Prueba de conexión exitosa! El proveedor se habilitará automáticamente.',
      // Error messages
      testFailedCheckConfig:
        'Prueba de conexión fallida, por favor verifica si la configuración es correcta.',
      testFailedCheckApiKey:
        'Prueba de conexión fallida, por favor verifica si la clave API y URL base son correctas.',
      // Other
      noProviders: 'Sin proveedores',
      addCustomHint: 'Haz clic en el botón de arriba para añadir proveedores personalizados',
      getApiKey: 'Obtener Clave API',
      deleteProvider: 'Eliminar Proveedor',
      save: 'Guardar',
      testConnection: 'Probar Conexión',
      testing: 'Probando',
      willAutoTestOnSave: 'La clave API será probada automáticamente al guardar',
    },
    models: {
      title: 'Selección de Modelo',
      defaultModelTitle: 'Modelo',
      defaultModelDescription:
        "Este modelo se usará cuando las funciones tengan 'predeterminado' seleccionado como su modelo.",
      defaultModel: 'Modelo Predeterminado',
      default: 'Predeterminado',
      loading: 'Cargando modelos...',
      contextWindow: 'Ventana de Contexto',
      noProvidersEnabled:
        'No hay proveedores habilitados. Por favor, configura y prueba tus proveedores primero.',
      noProvidersWarning:
        'Por favor, habilita al menos un proveedor para seleccionar un modelo predeterminado.',
      // Enhanced model selector
      searchModels: 'Buscar modelos...',
      allProviders: 'Todos los Proveedores',
      loadingModels: 'Cargando lista de modelos...',
      noMatchingModels: 'No se encontraron modelos coincidentes',
      noAvailableModels: 'No hay modelos disponibles',
      enableProvidersFirst: 'Por favor, habilita al menos un proveedor primero',
      close: 'Cerrar',
      context: 'Contexto',
    },
    functions: {
      title: 'Funciones',
      appearance: 'Apariencia',
      addCustom: 'Añadir Función Personalizada',
      editFunction: 'Editar Función',
      functionKey: 'Clave de Función',
      description: 'Descripción',
      prompt: 'Prompt',
      icon: 'Icono',
      model: 'Modelo',
      enabled: 'Habilitado',
      premiumRequired: 'Premium Requerido',
      upgradeToUnlock: 'Actualiza a Premium para desbloquear esta función',
      placeholders: {
        functionKey: 'ej.: translate, summarize',
        description: 'ej.: Traducir texto seleccionado',
        prompt: 'Por favor, traduce el siguiente texto: {text}',
        displayDomains: 'ej.: example.com, docs.example.com',
        autoExecuteDomains: 'ej.: example.com',
      },
      labels: {
        title: 'Nombre',
        icon: 'Icono',
        aiModel: 'Modelo',
        promptTemplate: 'Prompt',
        promptHelp: 'Usa {text} para representar el texto seleccionado',
        configuration: 'Configuración',
        basicSettings: 'Configuración Básica',
        advancedSettings: 'Configuración Avanzada',
        autoExecute: 'Ejecutar Automáticamente',
        autoExecuteHelp: 'Ejecutar esta función automáticamente cuando se seleccione texto',
        autoCloseButtons: 'Cerrar Botones Automáticamente',
        autoCloseButtonsHelp: 'Cerrar botones de acción automáticamente después de la ejecución',
        autoCloseResult: 'Cerrar Resultado Automáticamente',
        autoCloseResultHelp: 'Cerrar la ventana de resultados automáticamente al hacer clic fuera',
        collapsed: 'Colapsar',
        collapsedHelp: 'Ocultar esta función bajo el menú ⋯ en la barra de herramientas',
        displayDomains: 'Dominios de Visualización',
        displayDomainsHelp:
          'Nombres de host separados por comas. Deja vacío para mostrar en todos los sitios. Soporta subdominios (ej. docs.example.com)',
        autoExecuteDomains: 'Dominios de Ejecución Automática',
        autoExecuteDomainsHelp:
          'Restringir ejecución automática a estos dominios (mismas reglas que Dominios de Visualización)',
        isPremium: 'Función Premium',
        isPremiumHelp:
          'Cuando esté habilitado, esta función requiere una suscripción premium activa',
        searchEngine: 'Motor de Búsqueda',
        searchEngineHelp: 'Elige qué motor de búsqueda usar para las consultas',
      },
      editTitle: 'Editar Función',
      searchEngines: {
        google: 'Google',
        bing: 'Bing',
        baidu: 'Baidu',
      },
    },
    general: {
      title: 'Configuración',
      language: 'Idioma',
      theme: 'Tema',
      buttonPosition: 'Posición del Botón',
      buttonPositionAbove: 'Arriba',
      buttonPositionBelow: 'Abajo',
    },
    subscription: {
      signIn: 'Iniciar Sesión',
      signOut: 'Cerrar Sesión',
      title: 'Suscripción Premium',
      signInToAccess: 'Inicia sesión para acceder a funciones premium',
      userInfo: 'Usuario',
      loading: 'Cargando información del usuario...',
      checkingStatus: 'Verificando estado de suscripción...',
      refreshStatus: 'Actualizar',
      cannotVerify: 'No se puede verificar el estado de suscripción',
      premiumActive: 'Membresía premium activada',
      premiumActiveMonthly: 'Membresía mensual activada',
      premiumActiveLifetime: 'Membresía de por vida activada',
      premiumExpires: 'Expira',
      credits: 'Créditos',
      features: 'Las funciones premium incluyen:',
      featuresUnlimited: 'Operaciones de IA ilimitadas',
      featuresAdvanced: 'Funciones avanzadas de procesamiento de texto',
      featuresSupport: 'Soporte prioritario al cliente',
      subscribe: 'Suscribirse a Premium',
      monthlyPlan: 'Pro Mensual',
      monthlyPrice: '$2/mes',
      monthlyPriceOriginal: '$3',
      monthlyPriceSale: 'Oferta por Tiempo Limitado',
      lifetimePlan: 'Pro de por Vida',
      lifetimePrice: '$19 de por vida',
      lifetimePriceOriginal: '$29',
      lifetimePriceSale: 'Oferta por Tiempo Limitado',
      choosePlan: 'Elige tu plan de suscripción',
      planComparison: 'Ambos planes incluyen las mismas funciones premium',
      subscribeMonthly: 'Suscripción Mensual',
      subscribeLifetime: 'Comprar de por Vida',
      owned: 'Poseído',
      expiresOn: 'Expira el',
      description:
        'Suscríbete a las funciones premium para obtener capacidades más potentes de procesamiento de IA y soporte prioritario.',
      paymentSecure:
        'El pago se procesa a través de la plataforma segura Stripe. Puedes cancelar tu suscripción en cualquier momento.',
      cancelAnytime: 'Puedes cancelar tu suscripción en cualquier momento.',
      lifetimeOneTime: 'Pago único, acceso de por vida',
      loginRequired: 'Por favor, inicia sesión primero para obtener información del usuario',
      paymentError:
        'Error en la configuración del sistema de pago, por favor contacta al administrador',
      subscriptionError: 'Ocurrió un error durante la suscripción, por favor inténtalo de nuevo',
      redeemEntry: 'Canjear Código',
      redeemTitle: 'Canjear Código de Membresía',
      redeemDesc: 'Ingresa tu código para activar la membresía premium',
      redeemPlaceholder: 'Ingresa el código de canje',
      redeemSubmit: 'Canjear',
      redeemSuccess: 'Canje exitoso',
      redeemFailed: 'Canje fallido',
      redeemError: 'Error de canje, por favor inténtalo de nuevo',
      redeemLifetime: 'Membresía de por vida activada',
    },
  },

  content: {
    processing: 'Procesando...',
    complete: 'Completado',
    error: 'Procesamiento fallido',
    noTextSelected: 'Ningún texto seleccionado',
    dialoguePlaceholder: 'Escribe tu mensaje...',
    selectedText: 'Texto Seleccionado',
    chatWelcome: 'Pregúntame cualquier cosa sobre el texto seleccionado...',
    pin: 'Anclar',
    unpin: 'Desanclar',
    addToDictionary: 'Añadir al Diccionario',
  },

  button: {
    export: 'Exportar',
    clear: 'Limpiar',
  },

  options: {
    title: 'Opciones de Selectly',
    contentCenter: 'Centro de Contenido',
    toggleSidebar: 'Alternar barra lateral',
    sidebar: {
      collections: 'Colecciones',
      dictionary: 'Diccionario',
    },
    collections: {
      title: 'Colecciones',
      collectionGroups: 'Grupos de Colecciones',
      search: 'Buscar',
      searchPlaceholder: 'Buscar',
      clearAll: 'Limpiar Todo',
      clearAllConfirm: '¿Limpiar todas las colecciones?',
      loading: 'Cargando...',
      noCollections:
        'Aún no hay colecciones. Selecciona texto en cualquier página y haz clic en el botón de recopilar para guardar.',
      noCollectionsDescription:
        'Aún no hay colecciones. Selecciona texto en cualquier página y haz clic en el botón de recopilar para guardar.',
      copy: 'Copiar',
      delete: 'Eliminar',
      visitPage: 'Visitar página',
    },
    dictionary: {
      title: 'Diccionario',
      csvHeaderText: 'Texto',
      csvHeaderTranslation: 'Traducción',
      csvHeaderSentence: 'Oración',
      csvHeaderURL: 'URL',
      csvHeaderTitle: 'Título',
      csvHeaderHostname: 'Nombre de Host',
      csvHeaderCreatedAt: 'Creado En',
    },
  },

  collections: {
    collected: 'Recopilado',
    savedToCollections: 'Guardado en Colecciones',
  },

  errors: {
    systemError: 'Error del Sistema',
    cannotShowResultWindow: 'No se puede mostrar la ventana de resultados',
    copyFailed: 'Copia Fallida',
    cannotAccessClipboard: 'No se puede acceder al portapapeles',
    llmNotConfigured: 'Servicio LLM No Configurado',
    pleaseConfigureApiKey:
      'Por favor, configura la Clave API en configuración antes de usar las funciones de IA',
    configError: 'Error de Configuración',
    missingPromptConfig: 'Función falta configuración de prompt',
    failed: 'Fallido',
    unknownError: 'Error desconocido',
    invalidApiKey: 'Clave API inválida, por favor verifica la configuración',
    rateLimitExceeded: 'Límite de tasa de API excedido, por favor inténtalo más tarde',
    serverError: 'Error del servidor, por favor inténtalo más tarde',
    networkError: 'Error de conexión de red, por favor verifica la configuración de red',
    llmServiceError: 'Error del Servicio LLM',
    llmDefaultServiceError:
      'El servicio del modelo predeterminado no está disponible temporalmente, por favor añade otro proveedor o inténtalo más tarde',
    llmStreamingServiceError: 'Error del Servicio de Streaming LLM',
    premiumRequired: 'Función Premium',
    pleaseSubscribe: 'Se requiere suscripción a premium para usar esta función',
    dailyLimitExceeded: 'Límite diario excedido',
    dailyLimitMessage:
      'Has alcanzado tu límite diario de operaciones de IA. Por favor, espera hasta mañana o suscríbete a Premium para uso ilimitado.',
  },

  success: {
    copySuccess: 'Copia Exitosa',
    textCopiedToClipboard: 'Texto copiado al portapapeles',
  },

  time: {
    month: 'mes',
    months: 'meses',
    year: 'año',
    years: 'años',
  },

  contextMenu: {
    translateText: 'Traducir "%s"',
  },

  defaultFunctions: {
    translate: {
      title: 'Traducir',
      description: 'Traducir texto seleccionado',
      prompt:
        'Eres un traductor profesional. Por favor, traduce el siguiente texto a {targetLanguage}. Si el texto ya está en {targetLanguage}, tradúcelo al inglés en su lugar. Mantén el tono y significado original. Devuelve solo la traducción sin ninguna explicación o texto adicional:\n\n{text}',
    },
    polish: {
      title: 'Pulir',
      description: 'Pulir texto seleccionado',
      prompt:
        'Por favor, pule y mejora el siguiente texto para hacerlo más fluido, preciso y profesional. Mantén el significado e idioma original sin cambios, devuelve solo el resultado pulido:\n\n{text}',
    },
    explain: {
      title: 'Explicar',
      description: 'Explicar texto seleccionado',
      prompt:
        'Por favor, explica el siguiente texto clara y concisamente en {targetLanguage}. Enfócate en el significado clave y el contexto esencial. Mantén tu explicación breve y fácil de entender:\n\n{text}',
    },
    correct: {
      title: 'Corregir',
      description: 'Corregir texto seleccionado',
      prompt:
        'Por favor, verifica y corrige errores de gramática, ortografía y expresión en el siguiente texto, devuelve el texto corregido:\n\n{text}',
    },
    copy: {
      title: 'Copiar',
      description: 'Copiar texto seleccionado',
      prompt: '{text}',
    },
    search: {
      title: 'Buscar',
      description: 'Buscar texto seleccionado',
      prompt: '{text}',
    },
    open: {
      title: 'Abrir',
      description: 'Abrir URL seleccionada',
      prompt: '{text}',
    },
    chat: {
      title: 'Chat',
      description: 'Chatear con IA',
      prompt:
        'Eres un asistente de IA útil. Por favor, responde a los mensajes del usuario de manera conversacional. El usuario ha seleccionado este texto: "{text}".',
    },
    share: {
      title: 'Compartir',
      description: 'Generar imagen para compartir',
      prompt: '{text}',
    },
  },
};

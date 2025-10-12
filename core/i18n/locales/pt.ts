import type { I18nConfig } from '../types';

export const pt: I18nConfig = {
  common: {
    save: 'Salvar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Excluir',
    edit: 'Editar',
    add: 'Adicionar',
    close: 'Fechar',
    test: 'Testar',
    loading: 'Carregando...',
    success: 'Sucesso',
    error: 'Erro',
    enabled: 'Habilitado',
    disabled: 'Desabilitado',
    copy: 'Copiar',
  },

  extension: {
    name: 'Selectly',
    description: 'Redefina a forma como você interage com a web',
  },

  popup: {
    title: 'Configurações do Selectly',
    tabs: {
      general: 'Geral',
      llm: 'LLM',
      functions: 'Funções',
      subscription: 'Assinatura',
    },
    llm: {
      title: 'Configuração do Modelo de Linguagem',
      baseURL: 'URL Base',
      apiKey: 'Chave API',
      model: 'Modelo',
      testConnection: 'Testar Conexão',
      connectionSuccess: 'Conexão bem-sucedida!',
      connectionError: 'Falha na conexão!',
      testingConnection: 'Testando conexão...',
    },
    providers: {
      title: 'Provedores',
      addCustom: 'Adicionar Provedor Personalizado',
      addCustomProvider: 'Adicionar Provedor Personalizado',
      builtIn: 'Integrado',
      test: 'Testar',
      testSuccess: 'Provedor conectado com sucesso',
      testError: 'Falha na conexão. Por favor, verifique sua chave API e configurações.',
      apiKeyPlaceholder: 'Digite sua chave API...',
      providerIdPlaceholder: 'ex.: meu-provedor',
      providerNamePlaceholder: 'ex.: Meu Provedor Personalizado',
      baseURLPlaceholder: 'https://api.example.com/v1',
      add: 'Adicionar Provedor',
      edit: 'Editar Provedor',
      cancel: 'Cancelar',
      // Form labels
      providerId: 'ID do Provedor',
      providerName: 'Nome do Provedor',
      providerApiKey: 'Chave API',
      // Form placeholders
      enterApiKey: 'Digite a chave API',
      enterProviderName: 'Digite o nome do provedor',
      // Help text
      providerIdHelp:
        'Usado para identificar unicamente este provedor, pode conter apenas letras, números, sublinhados e hífens',
      builtInNameReadonly: 'Nomes de provedores integrados não podem ser modificados',
      // Error messages
      providerIdRequired: 'Por favor, digite o ID do provedor',
      providerIdExists: 'Este ID já existe, por favor use um ID diferente',
      providerIdInvalid: 'ID pode conter apenas letras, números, sublinhados e hífens',
      providerNameRequired: 'Por favor, digite o nome do provedor',
      baseURLRequired: 'Por favor, digite a URL base da API',
      baseURLInvalid: 'URL da API deve começar com http:// ou https://',
      apiKeyRequired: 'Por favor, digite a chave API',
      // Success messages
      testSuccessCanAdd: 'Teste de conexão bem-sucedido! Você pode adicionar este provedor.',
      testSuccessWillEnable:
        'Teste de conexão bem-sucedido! O provedor será habilitado automaticamente.',
      // Error messages
      testFailedCheckConfig:
        'Teste de conexão falhou, por favor verifique se a configuração está correta.',
      testFailedCheckApiKey:
        'Teste de conexão falhou, por favor verifique se a chave API e URL base estão corretas.',
      // Other
      noProviders: 'Nenhum provedor',
      addCustomHint: 'Clique no botão acima para adicionar provedores personalizados',
      getApiKey: 'Obter Chave API',
      deleteProvider: 'Excluir Provedor',
      save: 'Salvar',
      testConnection: 'Testar Conexão',
      testing: 'Testando',
      willAutoTestOnSave: 'A chave API será testada automaticamente ao salvar',
    },
    models: {
      title: 'Seleção de Modelo',
      defaultModelTitle: 'Modelo',
      defaultModelDescription:
        "Este modelo será usado quando as funções tiverem 'padrão' selecionado como seu modelo.",
      defaultModel: 'Modelo Padrão',
      default: 'Padrão',
      loading: 'Carregando modelos...',
      contextWindow: 'Janela de Contexto',
      noProvidersEnabled:
        'Nenhum provedor habilitado. Por favor, configure e teste seus provedores primeiro.',
      noProvidersWarning:
        'Por favor, habilite pelo menos um provedor para selecionar um modelo padrão.',
      // Enhanced model selector
      searchModels: 'Buscar modelos...',
      allProviders: 'Todos os Provedores',
      loadingModels: 'Carregando lista de modelos...',
      noMatchingModels: 'Nenhum modelo correspondente encontrado',
      noAvailableModels: 'Nenhum modelo disponível',
      enableProvidersFirst: 'Por favor, habilite pelo menos um provedor primeiro',
      close: 'Fechar',
      context: 'Contexto',
    },
    functions: {
      title: 'Funções',
      appearance: 'Aparência',
      addCustom: 'Adicionar Função Personalizada',
      editFunction: 'Editar Função',
      functionKey: 'Chave da Função',
      description: 'Descrição',
      prompt: 'Prompt',
      icon: 'Ícone',
      model: 'Modelo',
      enabled: 'Habilitado',
      premiumRequired: 'Premium Necessário',
      upgradeToUnlock: 'Atualize para Premium para desbloquear esta função',
      placeholders: {
        functionKey: 'ex.: translate, summarize',
        description: 'ex.: Traduzir texto selecionado',
        prompt: 'Por favor, traduza o seguinte texto: {text}',
        displayDomains: 'ex.: example.com, docs.example.com',
        autoExecuteDomains: 'ex.: example.com',
      },
      labels: {
        title: 'Nome',
        icon: 'Ícone',
        aiModel: 'Modelo',
        promptTemplate: 'Prompt',
        promptHelp: 'Use {text} para representar o texto selecionado',
        configuration: 'Configuração',
        basicSettings: 'Configurações Básicas',
        advancedSettings: 'Configurações Avançadas',
        autoExecute: 'Executar Automaticamente',
        autoExecuteHelp: 'Executar esta função automaticamente quando o texto for selecionado',
        autoCloseButtons: 'Fechar Botões Automaticamente',
        autoCloseButtonsHelp: 'Fechar botões de ação automaticamente após a execução',
        autoCloseResult: 'Fechar Resultado Automaticamente',
        autoCloseResultHelp: 'Fechar a janela de resultados automaticamente ao clicar fora',
        collapsed: 'Recolher',
        collapsedHelp: 'Ocultar esta função no menu ⋯ na barra de ferramentas',
        displayDomains: 'Domínios de Exibição',
        displayDomainsHelp:
          'Nomes de host separados por vírgula. Deixe vazio para mostrar em todos os sites. Suporta subdomínios (ex. docs.example.com)',
        autoExecuteDomains: 'Domínios de Execução Automática',
        autoExecuteDomainsHelp:
          'Restringir execução automática a estes domínios (mesmas regras dos Domínios de Exibição)',
        isPremium: 'Função Premium',
        isPremiumHelp: 'Quando habilitado, esta função requer uma assinatura premium ativa',
        searchEngine: 'Motor de Busca',
        searchEngineHelp: 'Escolha qual motor de busca usar para pesquisas',
      },
      editTitle: 'Editar Função',
      searchEngines: {
        google: 'Google',
        bing: 'Bing',
        baidu: 'Baidu',
      },
    },
    general: {
      title: 'Configuração',
      language: 'Idioma',
      theme: 'Tema',
      buttonPosition: 'Posição do Botão',
      buttonPositionAbove: 'Acima',
      buttonPositionBelow: 'Abaixo',
    },
    subscription: {
      signIn: 'Entrar',
      signOut: 'Sair',
      title: 'Assinatura Premium',
      signInToAccess: 'Faça login para acessar recursos premium',
      userInfo: 'Usuário',
      loading: 'Carregando informações do usuário...',
      checkingStatus: 'Verificando status da assinatura...',
      refreshStatus: 'Atualizar',
      cannotVerify: 'Não é possível verificar o status da assinatura',
      premiumActive: 'Assinatura premium ativada',
      premiumActiveMonthly: 'Assinatura mensal ativada',
      premiumActiveLifetime: 'Assinatura vitalícia ativada',
      premiumExpires: 'Expira',
      credits: 'Créditos',
      features: 'As funções premium incluem:',
      featuresUnlimited: 'Operações de IA ilimitadas',
      featuresAdvanced: 'Funções avançadas de processamento de texto',
      featuresSupport: 'Suporte prioritário ao cliente',
      subscribe: 'Assinar Premium',
      monthlyPlan: 'Pro Mensal',
      monthlyPrice: '$2/mês',
      monthlyPriceOriginal: '$3',
      monthlyPriceSale: 'Oferta por Tempo Limitado',
      lifetimePlan: 'Pro Vitalício',
      lifetimePrice: '$19 vitalício',
      lifetimePriceOriginal: '$29',
      lifetimePriceSale: 'Oferta por Tempo Limitado',
      choosePlan: 'Escolha seu plano de assinatura',
      planComparison: 'Ambos os planos incluem as mesmas funções premium',
      subscribeMonthly: 'Assinar Mensalmente',
      subscribeLifetime: 'Comprar Vitalício',
      owned: 'Possuído',
      expiresOn: 'Expira em',
      description:
        'Assine as funções premium para obter capacidades mais poderosas de processamento de IA e suporte prioritário.',
      paymentSecure:
        'O pagamento é processado através da plataforma segura Stripe. Você pode cancelar sua assinatura a qualquer momento.',
      cancelAnytime: 'Você pode cancelar sua assinatura a qualquer momento.',
      lifetimeOneTime: 'Pagamento único, acesso vitalício',
      loginRequired: 'Por favor, faça login primeiro para obter informações do usuário',
      paymentError:
        'Erro na configuração do sistema de pagamento, por favor entre em contato com o administrador',
      subscriptionError: 'Ocorreu um erro durante a assinatura, por favor tente novamente',
      redeemEntry: 'Resgatar Código',
      redeemTitle: 'Resgatar Código de Assinatura',
      redeemDesc: 'Digite seu código para ativar a assinatura premium',
      redeemPlaceholder: 'Digite o código de resgate',
      redeemSubmit: 'Resgatar',
      redeemSuccess: 'Resgate bem-sucedido',
      redeemFailed: 'Falha no resgate',
      redeemError: 'Erro no resgate, tente novamente',
      redeemLifetime: 'Assinatura vitalícia ativada',
    },
  },

  content: {
    processing: 'Processando...',
    complete: 'Completo',
    error: 'Processamento falhou',
    noTextSelected: 'Nenhum texto selecionado',
    dialoguePlaceholder: 'Digite sua mensagem...',
    selectedText: 'Texto Selecionado',
    chatWelcome: 'Pergunte-me qualquer coisa sobre o texto selecionado...',
    pin: 'Fixar',
    unpin: 'Desafixar',
    addToDictionary: 'Adicionar ao Dicionário',
  },

  button: {
    export: 'Exportar',
    clear: 'Limpar',
  },

  options: {
    title: 'Opções do Selectly',
    contentCenter: 'Centro de Conteúdo',
    toggleSidebar: 'Alternar barra lateral',
    sidebar: {
      collections: 'Coleções',
      dictionary: 'Dicionário',
    },
    collections: {
      title: 'Coleções',
      collectionGroups: 'Grupos de Coleções',
      search: 'Pesquisar',
      searchPlaceholder: 'Pesquisar',
      clearAll: 'Limpar Tudo',
      clearAllConfirm: 'Limpar todas as coleções?',
      loading: 'Carregando...',
      noCollections:
        'Ainda não há coleções. Selecione texto em qualquer página e clique no botão coletar para salvar.',
      noCollectionsDescription:
        'Ainda não há coleções. Selecione texto em qualquer página e clique no botão coletar para salvar.',
      copy: 'Copiar',
      delete: 'Excluir',
      visitPage: 'Visitar página',
    },
    dictionary: {
      title: 'Dicionário',
      csvHeaderText: 'Texto',
      csvHeaderTranslation: 'Tradução',
      csvHeaderSentence: 'Frase',
      csvHeaderURL: 'URL',
      csvHeaderTitle: 'Título',
      csvHeaderHostname: 'Hostname',
      csvHeaderCreatedAt: 'Criado Em',
    },
  },

  collections: {
    collected: 'Coletado',
    savedToCollections: 'Salvo em Coleções',
  },

  errors: {
    systemError: 'Erro do Sistema',
    cannotShowResultWindow: 'Não é possível mostrar a janela de resultados',
    copyFailed: 'Cópia Falhou',
    cannotAccessClipboard: 'Não é possível acessar a área de transferência',
    llmNotConfigured: 'Serviço LLM Não Configurado',
    pleaseConfigureApiKey:
      'Por favor, configure a Chave API nas configurações antes de usar as funções de IA',
    configError: 'Erro de Configuração',
    missingPromptConfig: 'Função está sem configuração de prompt',
    failed: 'Falhou',
    unknownError: 'Erro desconhecido',
    invalidApiKey: 'Chave API inválida, por favor verifique as configurações',
    rateLimitExceeded: 'Limite de taxa da API excedido, por favor tente novamente mais tarde',
    serverError: 'Erro do servidor, por favor tente novamente mais tarde',
    networkError: 'Erro de conexão de rede, por favor verifique as configurações de rede',
    llmServiceError: 'Erro do Serviço LLM',
    llmDefaultServiceError:
      'O serviço do modelo padrão está temporariamente indisponível, por favor adicione outro provedor ou tente novamente mais tarde',
    llmStreamingServiceError: 'Erro do Serviço de Streaming LLM',
    premiumRequired: 'Função Premium',
    pleaseSubscribe: 'Assinatura premium é necessária para usar esta função',
    dailyLimitExceeded: 'Limite diário excedido',
    dailyLimitMessage:
      'Você atingiu seu limite diário de operações de IA. Por favor, espere até amanhã ou assine o Premium para uso ilimitado.',
  },

  success: {
    copySuccess: 'Cópia Bem-sucedida',
    textCopiedToClipboard: 'Texto copiado para a área de transferência',
  },

  time: {
    month: 'mês',
    months: 'meses',
    year: 'ano',
    years: 'anos',
  },

  contextMenu: {
    translateText: 'Traduzir "%s"',
  },

  defaultFunctions: {
    translate: {
      title: 'Traduzir',
      description: 'Traduzir texto selecionado',
      prompt:
        'Você é um tradutor profissional. Por favor, traduza o seguinte texto para {targetLanguage}. Se o texto já estiver em {targetLanguage}, traduza para o inglês. Mantenha o tom e significado original. Retorne apenas a tradução sem nenhuma explicação ou texto adicional:\n\n{text}',
    },
    polish: {
      title: 'Polir',
      description: 'Polir texto selecionado',
      prompt:
        'Por favor, pula e melhore o seguinte texto para torná-lo mais fluente, preciso e profissional. Mantenha o significado e idioma original inalterados, retorne apenas o resultado polido:\n\n{text}',
    },
    explain: {
      title: 'Explicar',
      description: 'Explicar texto selecionado',
      prompt:
        'Por favor, explique o seguinte texto clara e concisamente em {targetLanguage}. Foque no significado principal e contexto essencial. Mantenha sua explicação breve e fácil de entender:\n\n{text}',
    },
    correct: {
      title: 'Corrigir',
      description: 'Corrigir texto selecionado',
      prompt:
        'Por favor, verifique e corrija erros de gramática, ortografia e expressão no seguinte texto, retorne o texto corrigido:\n\n{text}',
    },
    copy: {
      title: 'Copiar',
      description: 'Copiar texto selecionado',
      prompt: '{text}',
    },
    search: {
      title: 'Buscar',
      description: 'Buscar texto selecionado',
      prompt: '{text}',
    },
    open: {
      title: 'Abrir',
      description: 'Abrir URL selecionada',
      prompt: '{text}',
    },
    chat: {
      title: 'Chat',
      description: 'Conversar com IA',
      prompt:
        'Você é um assistente de IA útil. Por favor, responda às mensagens do usuário de forma conversacional. O usuário selecionou este texto: "{text}".',
    },
    share: {
      title: 'Compartilhar',
      description: 'Gerar imagem de compartilhamento',
      prompt: '{text}',
    },
  },
};

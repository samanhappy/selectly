import { getRemainingCustomFunctionSlots } from './custom-actions';
import type { FunctionConfig, UserConfig } from './llm-config';

type LocalizedText = {
  en: string;
  zh: string;
};

export interface WorkflowPackAction {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  icon: string;
  prompt: string;
}

export interface WorkflowPack {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  actions: WorkflowPackAction[];
}

export interface WorkflowPackInstallResult {
  nextConfig: UserConfig;
  installedCount: number;
  skippedCount: number;
  blockedCount: number;
}

type WorkflowInstallLocale = 'en' | 'zh';

export const WORKFLOW_PACKS: WorkflowPack[] = [
  {
    id: 'developer',
    title: {
      en: 'Developer Pack',
      zh: '开发者工作流包',
    },
    description: {
      en: 'Turn technical pages, diffs, errors, and community answers into actionable notes.',
      zh: '把技术页面、PR、错误日志和社区回答转成可行动的笔记。',
    },
    actions: [
      {
        id: 'github-issue-actions',
        title: {
          en: 'GitHub Issue Action Items',
          zh: 'GitHub Issue 行动项',
        },
        description: {
          en: 'Summarize an issue into owner-ready tasks, risks, and next steps.',
          zh: '把 Issue 总结成任务、风险和下一步。',
        },
        icon: 'list_ordered',
        prompt:
          'Summarize the selected GitHub issue into actionable work items. Return: 1) one-sentence problem statement, 2) key constraints, 3) ordered action items, 4) open questions. Selected text: {text}',
      },
      {
        id: 'pr-diff-explainer',
        title: {
          en: 'PR Diff Explainer',
          zh: 'PR Diff 解释',
        },
        description: {
          en: 'Explain what changed, why it matters, and what needs review.',
          zh: '解释变更内容、影响和评审重点。',
        },
        icon: 'file_code',
        prompt:
          'Explain this PR diff or code change for a reviewer. Cover: what changed, user-visible impact, risky areas, missing tests, and review questions. Selected text: {text}',
      },
      {
        id: 'release-note-explainer',
        title: {
          en: 'Release Note Explainer',
          zh: 'Release Note 解释',
        },
        description: {
          en: 'Convert release notes into plain-language impact and upgrade notes.',
          zh: '把发布说明转成易懂的影响和升级注意事项。',
        },
        icon: 'file_text',
        prompt:
          'Explain these release notes in plain language. Group by breaking changes, notable improvements, migration steps, and risks for existing users. Selected text: {text}',
      },
      {
        id: 'error-log-explainer',
        title: {
          en: 'Error Log Explainer',
          zh: '错误日志解释',
        },
        description: {
          en: 'Extract the likely root cause and the next debugging moves.',
          zh: '提炼可能根因和下一步排查动作。',
        },
        icon: 'terminal',
        prompt:
          'Analyze this error log. Return the likely root cause, the most relevant stack/frame lines, what to check next, and a minimal reproduction or fix path if possible. Selected text: {text}',
      },
      {
        id: 'stackoverflow-answer-distiller',
        title: {
          en: 'StackOverflow Answer Distiller',
          zh: 'StackOverflow 回答提炼',
        },
        description: {
          en: 'Extract the accepted idea, caveats, and reusable snippet pattern.',
          zh: '提炼核心答案、注意事项和可复用代码思路。',
        },
        icon: 'code',
        prompt:
          'Distill this StackOverflow answer or thread. Return the accepted solution, why it works, caveats, and a reusable implementation pattern. Selected text: {text}',
      },
    ],
  },
  {
    id: 'research',
    title: {
      en: 'Research Pack',
      zh: '研究工作流包',
    },
    description: {
      en: 'Compress technical documents and web pages into clear summaries and notes.',
      zh: '把技术文档和网页内容压缩成清晰摘要与笔记。',
    },
    actions: [
      {
        id: 'technical-doc-chinese-summary',
        title: {
          en: 'Technical Doc Chinese Summary',
          zh: '技术文档中文摘要',
        },
        description: {
          en: 'Summarize technical documentation in Chinese with terms preserved.',
          zh: '用中文总结技术文档，同时保留关键术语。',
        },
        icon: 'languages',
        prompt:
          '用中文总结这段技术文档。保留关键英文术语，输出：核心结论、关键概念、使用步骤、注意事项。选中文本：{text}',
      },
      {
        id: 'webpage-key-points',
        title: {
          en: 'Webpage Key Points',
          zh: '网页要点提炼',
        },
        description: {
          en: 'Extract the main claims, evidence, and useful takeaways.',
          zh: '提取主要观点、证据和可复用结论。',
        },
        icon: 'list',
        prompt:
          'Extract the key points from this web content. Return main claims, supporting evidence, useful takeaways, and anything that needs verification. Selected text: {text}',
      },
      {
        id: 'term-explainer',
        title: {
          en: 'Term Explainer',
          zh: '术语解释',
        },
        description: {
          en: 'Explain unfamiliar terms with context and examples.',
          zh: '结合上下文解释陌生术语并给例子。',
        },
        icon: 'explain',
        prompt:
          'Explain the important terms in the selected text. For each term, provide a plain-language definition, why it matters in this context, and a concrete example. Selected text: {text}',
      },
      {
        id: 'research-note',
        title: {
          en: 'Research Note',
          zh: '资料转笔记',
        },
        description: {
          en: 'Turn source material into a structured note with follow-ups.',
          zh: '把资料整理成结构化笔记和后续问题。',
        },
        icon: 'book',
        prompt:
          'Turn the selected material into a research note. Include summary, useful quotes paraphrased, implications, tags, and follow-up questions. Selected text: {text}',
      },
    ],
  },
  {
    id: 'marketing-pm',
    title: {
      en: 'Marketing/PM Pack',
      zh: '营销/产品工作流包',
    },
    description: {
      en: 'Extract positioning, ICP, pricing, CTA, and feedback patterns from live pages.',
      zh: '从真实页面提取定位、ICP、痛点、定价、CTA 和反馈模式。',
    },
    actions: [
      {
        id: 'competitor-value-props',
        title: {
          en: 'Competitor Value Props',
          zh: '竞品卖点提取',
        },
        description: {
          en: 'Identify promises, proof, objections, and differentiation.',
          zh: '识别承诺、证据、异议和差异化。',
        },
        icon: 'star',
        prompt:
          'Analyze this competitor page. Extract target customer, primary value props, proof points, objections handled, differentiation, and weak spots. Selected text: {text}',
      },
      {
        id: 'saas-landing-breakdown',
        title: {
          en: 'SaaS Landing Page Breakdown',
          zh: 'SaaS Landing Page 拆解',
        },
        description: {
          en: 'Extract ICP, pain points, pricing signal, CTA, and offer structure.',
          zh: '提取 ICP、痛点、定价信号、CTA 和 offer 结构。',
        },
        icon: 'globe',
        prompt:
          'Break down this SaaS landing page. Return ICP, pain points, promised outcomes, feature pillars, pricing cues, CTAs, and missing credibility. Selected text: {text}',
      },
      {
        id: 'feedback-classifier',
        title: {
          en: 'User Feedback Classifier',
          zh: '用户反馈归类',
        },
        description: {
          en: 'Classify feedback into bug, feature, complaint, pricing, UX, or other.',
          zh: '把反馈归为 Bug、Feature、Complaint、Pricing、UX 或其他。',
        },
        icon: 'hash',
        prompt:
          'Classify this user feedback. Use categories: Bug, Feature, Complaint, Pricing, UX, Other. Return category, severity, user need, suggested response, and product follow-up. Selected text: {text}',
      },
      {
        id: 'cta-offer-critique',
        title: {
          en: 'CTA and Offer Critique',
          zh: 'CTA 与 Offer 诊断',
        },
        description: {
          en: 'Evaluate whether the page makes the next step obvious and compelling.',
          zh: '判断页面下一步是否清楚、有吸引力。',
        },
        icon: 'zap',
        prompt:
          'Critique this CTA and offer. Assess clarity, urgency, credibility, friction, target user fit, and propose 3 stronger CTA/offer variants. Selected text: {text}',
      },
    ],
  },
];

export const createWorkflowFunctionKey = (packId: string, actionId: string): string => {
  return `workflow-${packId}-${actionId}`;
};

export const getWorkflowPackInstallState = (
  functions: Record<string, FunctionConfig>,
  pack: WorkflowPack
) => {
  const installedCount = pack.actions.filter(
    (action) => createWorkflowFunctionKey(pack.id, action.id) in functions
  ).length;

  return {
    installedCount,
    totalCount: pack.actions.length,
    isComplete: installedCount === pack.actions.length,
  };
};

const getLocalizedText = (value: LocalizedText, locale: WorkflowInstallLocale = 'en') => {
  return value[locale] || value.en;
};

const toFunctionConfig = (
  action: WorkflowPackAction,
  locale: WorkflowInstallLocale = 'en'
): FunctionConfig => ({
  title: getLocalizedText(action.title, locale),
  description: getLocalizedText(action.description, locale),
  icon: action.icon,
  model: 'default',
  prompt: action.prompt,
  autoExecute: false,
  autoExecuteDomains: [],
  autoCloseButtons: true,
  autoCloseResult: true,
  collapsed: false,
  enabled: true,
  displayDomains: [],
  isPremium: false,
  requiresAI: true,
  isBuiltIn: false,
  modelSettings: { thinkingMode: 'auto' },
});

export const installWorkflowPack = (
  config: UserConfig,
  pack: WorkflowPack,
  { isSubscribed, locale = 'en' }: { isSubscribed: boolean; locale?: WorkflowInstallLocale }
): WorkflowPackInstallResult => {
  const existingFunctions = config.functions || {};
  const remainingSlots = getRemainingCustomFunctionSlots(existingFunctions, isSubscribed);
  const nextFunctions = { ...existingFunctions };
  const nextOrder = [...(config.functionOrder || Object.keys(existingFunctions))];
  let installedCount = 0;
  let skippedCount = 0;
  let blockedCount = 0;

  for (const action of pack.actions) {
    const key = createWorkflowFunctionKey(pack.id, action.id);

    if (key in nextFunctions) {
      skippedCount += 1;
      continue;
    }

    if (!isSubscribed && installedCount >= remainingSlots) {
      blockedCount += 1;
      continue;
    }

    nextFunctions[key] = toFunctionConfig(action, locale);
    if (!nextOrder.includes(key)) {
      nextOrder.push(key);
    }
    installedCount += 1;
  }

  return {
    nextConfig: {
      ...config,
      functions: nextFunctions,
      functionOrder: nextOrder.filter((key) => key in nextFunctions),
    },
    installedCount,
    skippedCount,
    blockedCount,
  };
};

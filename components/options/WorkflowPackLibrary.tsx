import { CheckCircle2, PackagePlus, Sparkles } from 'lucide-react';
import React from 'react';

import {
  FREE_CUSTOM_ACTION_LIMIT,
  getCustomFunctionCount,
  getRemainingCustomFunctionSlots,
} from '../../core/config/custom-actions';
import type { UserConfig } from '../../core/config/llm-config';
import {
  getWorkflowPackInstallState,
  WORKFLOW_PACKS,
  type WorkflowPack,
} from '../../core/config/workflow-packs';
import type { SupportedLanguage } from '../../core/i18n/types';
import { getActionIcon } from '../../utils/icon-utils';
import { PALETTE } from './constants';

type WorkflowLocale = 'en' | 'zh';

interface WorkflowPackLibraryProps {
  userConfig: UserConfig;
  isSubscribed: boolean;
  onInstallPack: (pack: WorkflowPack) => void;
  onPremiumClick: () => void;
}

const COPY = {
  en: {
    title: 'Workflow Packs',
    description: 'Install reusable prompt workflows for repeated web text tasks.',
    proLimit: 'Pro: unlimited custom actions',
    freeLimit: (count: number) => `${count}/${FREE_CUSTOM_ACTION_LIMIT} custom actions used`,
    install: 'Install pack',
    installed: 'Installed',
    upgrade: 'Upgrade',
    partial: (installed: number, total: number) => `${installed}/${total} installed`,
  },
  zh: {
    title: '工作流包',
    description: '安装可复用 Prompt 工作流，处理重复网页文本任务。',
    proLimit: 'Pro：无限自定义动作',
    freeLimit: (count: number) => `已用 ${count}/${FREE_CUSTOM_ACTION_LIMIT} 个自定义动作`,
    install: '安装工作流包',
    installed: '已安装',
    upgrade: '升级',
    partial: (installed: number, total: number) => `已安装 ${installed}/${total}`,
  },
};

const getLocale = (language?: SupportedLanguage): WorkflowLocale => {
  return language === 'zh' ? 'zh' : 'en';
};

const getLocalized = (value: { en: string; zh: string }, locale: WorkflowLocale) => {
  return value[locale] || value.en;
};

const PackActionPreview: React.FC<{
  action: WorkflowPack['actions'][number];
  locale: WorkflowLocale;
}> = ({ action, locale }) => {
  const Icon = getActionIcon(action.icon);
  return (
    <li style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <Icon size={14} style={{ color: PALETTE.textSecondary, marginTop: 2, flexShrink: 0 }} />
      <span style={{ color: PALETTE.textSecondary, fontSize: 12, lineHeight: 1.45 }}>
        {getLocalized(action.title, locale)}
      </span>
    </li>
  );
};

export const WorkflowPackLibrary: React.FC<WorkflowPackLibraryProps> = ({
  userConfig,
  isSubscribed,
  onInstallPack,
  onPremiumClick,
}) => {
  const locale = getLocale(userConfig.general?.language);
  const copy = COPY[locale];
  const customCount = getCustomFunctionCount(userConfig.functions);
  const remainingSlots = getRemainingCustomFunctionSlots(userConfig.functions, isSubscribed);
  const canInstallMore = isSubscribed || remainingSlots > 0;

  return (
    <div className="sl-card" style={{ marginBottom: 20 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <PackagePlus size={18} /> {copy.title}
          </h3>
          <p style={{ margin: '6px 0 0 0', color: PALETTE.textSecondary, fontSize: 13 }}>
            {copy.description}
          </p>
        </div>
        <div
          className="sl-badge"
          style={{
            whiteSpace: 'nowrap',
            borderRadius: 8,
            padding: '5px 8px',
            background: isSubscribed ? PALETTE.successSoft : PALETTE.surfaceMuted,
            color: isSubscribed ? PALETTE.success : PALETTE.textSecondary,
          }}
        >
          {isSubscribed ? copy.proLimit : copy.freeLimit(customCount)}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
        }}
      >
        {WORKFLOW_PACKS.map((pack) => {
          const installState = getWorkflowPackInstallState(userConfig.functions, pack);
          const isComplete = installState.isComplete;
          const isBlocked = !isComplete && !canInstallMore;
          const buttonText = isComplete ? copy.installed : isBlocked ? copy.upgrade : copy.install;

          return (
            <div
              key={pack.id}
              style={{
                border: `1px solid ${PALETTE.border}`,
                borderRadius: 10,
                background: PALETTE.surfaceAlt,
                padding: 14,
                display: 'flex',
                minHeight: 250,
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isComplete ? PALETTE.successSoft : PALETTE.primarySoft,
                    color: isComplete ? PALETTE.success : PALETTE.primary,
                    flexShrink: 0,
                  }}
                >
                  {isComplete ? <CheckCircle2 size={17} /> : <Sparkles size={17} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: PALETTE.text }}>
                    {getLocalized(pack.title, locale)}
                  </div>
                  <div style={{ color: PALETTE.textSecondary, fontSize: 12, lineHeight: 1.45 }}>
                    {getLocalized(pack.description, locale)}
                  </div>
                </div>
              </div>

              <ul
                aria-label={getLocalized(pack.title, locale)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                  flex: 1,
                }}
              >
                {pack.actions.map((action) => (
                  <PackActionPreview key={action.id} action={action} locale={locale} />
                ))}
              </ul>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 12, color: PALETTE.textSecondary }}>
                  {copy.partial(installState.installedCount, installState.totalCount)}
                </span>
                <button
                  type="button"
                  className={`sl-btn ${isBlocked ? 'sl-btn-primary' : 'sl-btn-secondary'}`}
                  style={{ padding: '7px 10px', fontSize: 12, whiteSpace: 'nowrap' }}
                  disabled={isComplete}
                  onClick={() => {
                    if (isBlocked) {
                      onPremiumClick();
                      return;
                    }
                    onInstallPack(pack);
                  }}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

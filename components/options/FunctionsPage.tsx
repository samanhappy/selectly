/**
 * FunctionsPage Component
 * Single responsibility: Display and manage function configurations with drag-and-drop reordering
 */

import { Blocks, MousePointer, Plus, Settings as SettingsIcon } from 'lucide-react';
import React, { useState } from 'react';

import {
  getFunctionDisplayFields,
  type FunctionConfig,
  type UserConfig,
} from '../../core/config/llm-config';
import { getActionIcon as baseGetActionIcon } from '../../utils/icon-utils';
import { PALETTE } from './constants';
import { FunctionCard } from './FunctionCard';

interface FunctionsPageProps {
  userConfig: UserConfig;
  i18nConfig: any;
  isSubscribed: boolean;
  onToggle: (key: string, enabled: boolean) => void;
  onEdit: (key: string) => void;
  onReorder: (order: string[]) => void;
  onPremiumClick: () => void;
  onAddCustomFunction: () => void;
  onOpenConfig: () => void;
}

const renderActionIcon = (iconKey: string) => {
  const IconComponent = baseGetActionIcon(iconKey);
  return <IconComponent size={20} />;
};

export const FunctionsPage: React.FC<FunctionsPageProps> = ({
  userConfig,
  i18nConfig,
  isSubscribed,
  onToggle,
  onEdit,
  onReorder,
  onPremiumClick,
  onAddCustomFunction,
  onOpenConfig,
}) => {
  return (
    <div style={{ padding: '12px', background: PALETTE.surfaceAlt, minHeight: '100%' }}>
      <div className="sl-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
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
            <Blocks size={18} /> {i18nConfig.popup.functions.title}
          </h3>
          <button
            className="sl-btn sl-btn-secondary"
            style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={onAddCustomFunction}
          >
            <Plus size={14} />
            {i18nConfig.popup.functions.addCustom}
          </button>
        </div>
        <FunctionList
          userConfig={userConfig}
          i18nConfig={i18nConfig}
          isSubscribed={isSubscribed}
          onToggle={onToggle}
          onEdit={onEdit}
          onReorder={onReorder}
          onPremiumClick={onPremiumClick}
        />
      </div>
      <div className="sl-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
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
            <SettingsIcon size={18} /> {i18nConfig.popup.functions.appearance}
          </h3>
          <button
            className="sl-btn sl-btn-secondary"
            style={{ fontSize: 12, padding: '6px' }}
            onClick={onOpenConfig}
          >
            <SettingsIcon size={16} />
          </button>
        </div>
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: PALETTE.primarySoft,
            border: `1px solid ${PALETTE.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <MousePointer size={20} style={{ color: PALETTE.primary }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                {i18nConfig.popup.general.buttonPosition}
              </div>
              <div style={{ fontSize: 12, color: PALETTE.textSecondary }}>
                {(userConfig.general?.buttonPosition || 'above') === 'above'
                  ? i18nConfig.popup.general.buttonPositionAbove
                  : i18nConfig.popup.general.buttonPositionBelow}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal drag-and-drop function list component
interface FunctionListProps {
  userConfig: UserConfig;
  i18nConfig: any;
  isSubscribed: boolean;
  onToggle: (key: string, enabled: boolean) => void;
  onEdit: (key: string) => void;
  onReorder: (order: string[]) => void;
  onPremiumClick: () => void;
}

const FunctionList: React.FC<FunctionListProps> = ({
  userConfig,
  i18nConfig,
  isSubscribed,
  onToggle,
  onEdit,
  onReorder,
  onPremiumClick,
}) => {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const order =
    userConfig.functionOrder && userConfig.functionOrder.length
      ? userConfig.functionOrder.filter((k) => k in userConfig.functions)
      : Object.keys(userConfig.functions);

  const handleDragStart = (e: React.DragEvent, key: string) => {
    setDragging(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };
  const handleDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    if (key !== over) setOver(key);
  };
  const handleDragLeave = (_e: React.DragEvent, key: string) => {
    if (over === key) setOver(null);
  };
  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const sourceKey = dragging || e.dataTransfer.getData('text/plain');
    if (!sourceKey || sourceKey === targetKey) {
      setDragging(null);
      setOver(null);
      return;
    }
    const current = order.filter((k) => k !== sourceKey);
    const targetIndex = current.indexOf(targetKey);
    current.splice(targetIndex, 0, sourceKey);
    onReorder(current);
    setDragging(null);
    setOver(null);
  };
  const handleDragEnd = () => {
    setDragging(null);
    setOver(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {order.map((key) => {
        const config = userConfig.functions[key];
        if (!config) return null;
        const isDragging = key === dragging;
        const isOver = key === over && dragging && dragging !== over;
        return (
          <div
            key={key}
            className={`sl-fn-draggable ${isDragging ? 'is-dragging' : ''} ${isOver ? 'is-over' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, key)}
            onDragOver={(e) => handleDragOver(e, key)}
            onDragLeave={(e) => handleDragLeave(e, key)}
            onDrop={(e) => handleDrop(e, key)}
            onDragEnd={handleDragEnd}
            style={{ position: 'relative' }}
          >
            <div className="sl-fn-drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
              ⋮⋮
            </div>
            <FunctionCard
              functionKey={key}
              config={config as any}
              title={getFunctionDisplayFields(key, config as any, i18nConfig).title}
              modelLabel={i18nConfig.popup.functions.model}
              getIcon={renderActionIcon}
              isSubscribed={isSubscribed}
              onToggle={onToggle}
              onEdit={onEdit}
              onPremiumClick={onPremiumClick}
            />
          </div>
        );
      })}
    </div>
  );
};

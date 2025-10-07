import { Check, Eye, EyeOff, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

import type { LLMProvider } from '../../../core/config/llm-config';
import { LLMService } from '../../../core/services/llm-service';

interface ProviderConfigFormProps {
  provider: LLMProvider;
  i18n: any;
  palette: any;
  onUpdate: (provider: LLMProvider) => void;
  onRemove?: () => void;
  onClose: () => void;
  allowRemove?: boolean;
}

export const ProviderConfigForm: React.FC<ProviderConfigFormProps> = ({
  provider,
  i18n,
  palette,
  onUpdate,
  onRemove,
  onClose,
  allowRemove = false,
}) => {
  const [formData, setFormData] = useState({
    name: provider.name,
    baseURL: provider.baseURL,
    apiKey: provider.apiKey,
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  const llmService = LLMService.getInstance();

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Reset test status when API key or baseURL changes
    if (field === 'apiKey' || field === 'baseURL') {
      setTestResult('idle');
    }
  };

  const handleTest = async () => {
    if (!formData.apiKey) return;

    setTesting(true);
    setTestResult('idle');

    try {
      const testProvider = {
        ...provider,
        ...formData,
        testStatus: 'testing' as const,
      };

      const success = await llmService.testProvider(testProvider);
      setTestResult(success ? 'success' : 'error');
    } catch (error) {
      console.error('Provider test failed:', error);
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // If API key is provided but hasn't been tested, automatically test it first
    if (formData.apiKey && testResult === 'idle') {
      setTesting(true);
      setTestResult('idle');

      try {
        const testProvider = {
          ...provider,
          ...formData,
          testStatus: 'testing' as const,
        };

        const success = await llmService.testProvider(testProvider);
        const finalTestResult = success ? 'success' : 'error';
        setTestResult(finalTestResult);

        // Only proceed with save if test was successful
        if (!success) {
          setTesting(false);
          return;
        }

        const updatedProvider: LLMProvider = {
          ...provider,
          ...formData,
          testStatus: finalTestResult,
          enabled: finalTestResult === 'success',
        };

        onUpdate(updatedProvider);
        onClose();
      } catch (error) {
        console.error('Provider test failed:', error);
        setTestResult('error');
      } finally {
        setTesting(false);
      }
    } else {
      // If already tested or no API key, proceed with normal save
      const updatedProvider: LLMProvider = {
        ...provider,
        ...formData,
        testStatus: testResult,
        enabled: testResult === 'success',
      };

      onUpdate(updatedProvider);
      onClose();
    }
  };

  const hasChanges =
    formData.name !== provider.name ||
    formData.baseURL !== provider.baseURL ||
    formData.apiKey !== provider.apiKey;

  const getTestStatusIcon = () => {
    switch (testResult) {
      case 'success':
        return <Check size={16} style={{ color: palette.success }} />;
      case 'error':
        return <X size={16} style={{ color: palette.danger }} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Provider Name */}
        <div>
          <label className="sl-label" style={{ marginBottom: 8, display: 'block' }}>
            {i18n.popup.providers.providerName}
          </label>
          <input
            className="sl-input"
            type="text"
            value={formData.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder={i18n.popup.providers.enterProviderName}
            disabled={provider.isBuiltIn}
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="sl-label" style={{ marginBottom: 8, display: 'block' }}>
            {i18n.popup.llm.baseURL}
          </label>
          <input
            className="sl-input"
            type="text"
            value={formData.baseURL}
            onChange={(e) => handleFieldChange('baseURL', e.target.value)}
            placeholder={i18n.popup.providers.baseURLPlaceholder}
          />
        </div>

        {/* API Key */}
        <div>
          <label className="sl-label" style={{ marginBottom: 8, display: 'block' }}>
            {i18n.popup.providers.providerApiKey}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              className="sl-input"
              type={showApiKey ? 'text' : 'password'}
              value={formData.apiKey}
              onChange={(e) => handleFieldChange('apiKey', e.target.value)}
              placeholder={i18n.popup.providers.enterApiKey}
              style={{ paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: palette.textSecondary,
              }}
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Test Connection */}
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <button
              className="sl-btn sl-btn-primary"
              onClick={handleTest}
              disabled={!formData.apiKey || testing}
              style={{ minWidth: 100 }}
            >
              {testing ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    border: '2px solid #fff',
                    borderTop: '2px solid transparent',
                    borderRadius: '50%',
                    animation: 'sl-spin 1s linear infinite',
                  }}
                />
              ) : (
                i18n.popup.providers.testConnection
              )}
            </button>
            {/* {getTestStatusIcon()} */}
          </div>

          {/* Test Status Message */}
          {testResult === 'success' && (
            <div
              style={{
                fontSize: 13,
                color: palette.success,
                background: palette.successSoft,
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${palette.success}40`,
              }}
            >
              {i18n.popup.providers.testSuccessWillEnable}
            </div>
          )}

          {testResult === 'error' && (
            <div
              style={{
                fontSize: 13,
                color: palette.danger,
                background: palette.dangerSoft,
                padding: '8px 12px',
                borderRadius: 6,
                border: `1px solid ${palette.danger}40`,
              }}
            >
              {i18n.popup.providers.testFailedCheckApiKey}
            </div>
          )}

          {/* {testResult === 'idle' && formData.apiKey && hasChanges && (
            <div style={{
              fontSize: 13,
              color: palette.textSecondary,
              background: palette.backgroundSecondary,
              padding: '8px 12px',
              borderRadius: 6,
              border: `1px solid ${palette.border}`
            }}>
              {i18n.popup.providers.willAutoTestOnSave || 'API key will be automatically tested when saving'}
            </div>
          )} */}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 20,
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          <div>
            {allowRemove && (
              <button
                className="sl-btn sl-btn-ghost"
                onClick={onRemove}
                style={{
                  color: palette.danger,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={14} />
                {i18n.popup.providers.deleteProvider}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="sl-btn sl-btn-secondary" onClick={onClose}>
              {i18n.common.cancel}
            </button>
            <button
              className="sl-btn sl-btn-primary"
              onClick={handleSave}
              disabled={!hasChanges && testResult === 'idle'}
            >
              {testing ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      border: '2px solid #fff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'sl-spin 1s linear infinite',
                    }}
                  />
                  {i18n.popup.providers.testing || 'Testing...'}
                </span>
              ) : (
                i18n.popup.providers.save
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

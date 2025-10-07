import { Check, Eye, EyeOff, X } from 'lucide-react';
import React, { useState } from 'react';

import type { LLMProvider } from '../../../core/config/llm-config';
import { LLMService } from '../../../core/services/llm-service';

interface AddProviderFormProps {
  i18n: any;
  palette: any;
  onAdd: (provider: LLMProvider) => void;
  onClose: () => void;
  existingProviderIds: string[];
}

export const AddProviderForm: React.FC<AddProviderFormProps> = ({
  i18n,
  palette,
  onAdd,
  onClose,
  existingProviderIds,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    baseURL: '',
    apiKey: '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const llmService = LLMService.getInstance();

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }

    // Reset test status when API key changes
    if (field === 'apiKey') {
      setTestResult('idle');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = i18n.popup.providers.providerIdRequired;
    } else if (existingProviderIds.includes(formData.id)) {
      newErrors.id = i18n.popup.providers.providerIdExists;
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.id)) {
      newErrors.id = i18n.popup.providers.providerIdInvalid;
    }

    if (!formData.name.trim()) {
      newErrors.name = i18n.popup.providers.providerNameRequired;
    }

    if (!formData.baseURL.trim()) {
      newErrors.baseURL = i18n.popup.providers.baseURLRequired;
    } else if (!formData.baseURL.startsWith('http')) {
      newErrors.baseURL = i18n.popup.providers.baseURLInvalid;
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = i18n.popup.providers.apiKeyRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTest = async () => {
    if (!validateForm()) return;

    setTesting(true);
    setTestResult('idle');

    try {
      const testProvider: LLMProvider = {
        id: formData.id,
        name: formData.name,
        baseURL: formData.baseURL,
        apiKey: formData.apiKey,
        enabled: false,
        isBuiltIn: false,
        testStatus: 'testing',
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

  const handleAdd = () => {
    if (!validateForm()) return;

    const newProvider: LLMProvider = {
      id: formData.id,
      name: formData.name,
      baseURL: formData.baseURL,
      apiKey: formData.apiKey,
      enabled: testResult === 'success',
      isBuiltIn: false,
      testStatus: testResult,
    };

    onAdd(newProvider);
  };

  const canAdd = testResult === 'success' && Object.keys(errors).length === 0;

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
        {/* Provider ID */}
        <div>
          <label className="sl-label" style={{ marginBottom: 8, display: 'block' }}>
            {i18n.popup.providers.providerId}
          </label>
          <input
            className="sl-input"
            type="text"
            value={formData.id}
            onChange={(e) => handleFieldChange('id', e.target.value)}
            placeholder={i18n.popup.providers.providerIdPlaceholder}
            style={{ borderColor: errors.id ? palette.danger : undefined }}
          />
          {errors.id && (
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: palette.danger }}>{errors.id}</p>
          )}
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: palette.textSecondary }}>
            {i18n.popup.providers.providerIdHelp}
          </p>
        </div>

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
            placeholder={i18n.popup.providers.providerNamePlaceholder}
            style={{ borderColor: errors.name ? palette.danger : undefined }}
          />
          {errors.name && (
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: palette.danger }}>
              {errors.name}
            </p>
          )}
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
            style={{ borderColor: errors.baseURL ? palette.danger : undefined }}
          />
          {errors.baseURL && (
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: palette.danger }}>
              {errors.baseURL}
            </p>
          )}
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
              style={{
                paddingRight: 40,
                borderColor: errors.apiKey ? palette.danger : undefined,
              }}
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
          {errors.apiKey && (
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: palette.danger }}>
              {errors.apiKey}
            </p>
          )}
        </div>

        {/* Test Connection */}
        <div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <button
              className="sl-btn sl-btn-primary"
              onClick={handleTest}
              disabled={testing}
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
            {getTestStatusIcon()}
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
              {i18n.popup.providers.testSuccessCanAdd}
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
              {i18n.popup.providers.testFailedCheckConfig}
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            paddingTop: 20,
            borderTop: `1px solid ${palette.border}`,
          }}
        >
          <button className="sl-btn sl-btn-secondary" onClick={onClose}>
            {i18n.common.cancel}
          </button>
          <button className="sl-btn sl-btn-primary" onClick={handleAdd} disabled={!canAdd}>
            {i18n.popup.providers.add}
          </button>
        </div>
      </div>
    </div>
  );
};

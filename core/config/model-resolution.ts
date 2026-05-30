export const resolveModelString = (functionModel: string, defaultModel: string): string => {
  if (functionModel === 'default') {
    return defaultModel;
  }
  return functionModel;
};

export const parseModelString = (
  modelString: string
): { providerId: string; modelName: string } => {
  if (!modelString || modelString === 'default') {
    return { providerId: 'cloud', modelName: 'default' };
  }

  const parts = modelString.split('/');
  if (parts.length === 1) {
    throw new Error(
      `Invalid model format: ${modelString}. Expected format: "providerId/modelName"`
    );
  }

  return {
    providerId: parts[0],
    modelName: parts.slice(1).join('/'),
  };
};

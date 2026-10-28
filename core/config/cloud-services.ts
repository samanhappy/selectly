import { i18n } from '../i18n';
import { isCloudEnabled } from './feature-gates';

/** Build-time switch for official Selectly services; custom providers remain independent. */
export { isCloudEnabled };

export const assertCloudEnabled = () => {
  if (!isCloudEnabled()) throw new Error(i18n.t('errors.cloudDisabled'));
};

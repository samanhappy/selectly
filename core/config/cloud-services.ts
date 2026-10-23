import { i18n } from '../i18n';
import { isCloudEnabled } from './feature-gates';

/** Official Selectly services are opt-in; local data and custom providers are independent. */
export { isCloudEnabled };

export const assertCloudEnabled = () => {
  if (!isCloudEnabled()) throw new Error(i18n.t('errors.cloudDisabled'));
};

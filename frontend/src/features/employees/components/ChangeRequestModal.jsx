/**
 * @file ChangeRequestModal.jsx
 * @description Backward-compatible wrapper delegating to ChangeRequestSubmitModal.
 */

import { ChangeRequestSubmitModal } from './change-requests/ChangeRequestSubmitModal.jsx';

export function ChangeRequestModal(props) {
  return <ChangeRequestSubmitModal {...props} />;
}

export default ChangeRequestModal;

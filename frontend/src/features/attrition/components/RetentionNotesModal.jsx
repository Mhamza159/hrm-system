/**
 * @file RetentionNotesModal.jsx
 * @description Backward-compatible wrapper forwarding to EmployeeRiskDetailModal.
 */

import React from 'react';
import { EmployeeRiskDetailModal } from './EmployeeRiskDetailModal.jsx';

export const RetentionNotesModal = ({ isOpen, onClose, scoreData, score, userRoles }) => {
  return (
    <EmployeeRiskDetailModal
      isOpen={isOpen}
      onClose={onClose}
      score={score || scoreData}
      userRoles={userRoles}
    />
  );
};

export default RetentionNotesModal;

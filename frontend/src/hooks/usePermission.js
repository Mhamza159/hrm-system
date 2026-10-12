/**
 * @file usePermission.js
 * @description Custom React Hook for Imperative Permission Evaluation.
 * 
 * SPECIFICATION:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.6)
 */

import { useAbility } from '../lib/ability.js';
import { useSelector } from 'react-redux';

export const usePermission = () => {
  const ability = useAbility();
  const user = useSelector((state) => state.auth?.user);

  const isSuperAdmin = user?.roles?.some((r) =>
    typeof r === 'string' ? r === 'Super Admin' : r?.name === 'Super Admin'
  );

  const can = (action, subject = 'all', field = undefined) => {
    if (!ability) return false;
    return (
      ability.can('manage', 'all') ||
      ability.can(action, subject, field) ||
      ability.can(action, 'all', field)
    );
  };

  const cannot = (action, subject = 'all', field = undefined) => {
    return !can(action, subject, field);
  };

  return {
    ability,
    can,
    cannot,
    isSuperAdmin
  };
};

export default usePermission;

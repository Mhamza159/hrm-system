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
    if (ability.can('manage', 'all')) return true;
    if (!action) return false;

    if (Array.isArray(action)) {
      return action.some(
        (act) =>
          ability.can(act, subject, field) ||
          ability.can(act, 'all', field)
      );
    }

    return (
      ability.can(action, subject, field) ||
      ability.can(action, 'all', field)
    );
  };

  const canAll = (actions = [], subject = 'all', field = undefined) => {
    if (!ability) return false;
    if (ability.can('manage', 'all')) return true;
    if (!Array.isArray(actions) || actions.length === 0) return false;
    return actions.every((act) => can(act, subject, field));
  };

  const cannot = (action, subject = 'all', field = undefined) => {
    return !can(action, subject, field);
  };

  return {
    ability,
    can,
    canAll,
    cannot,
    isSuperAdmin
  };
};

export default usePermission;

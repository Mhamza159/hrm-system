/**
 * @file Can.jsx
 * @description Declarative Authorization Component for Conditional JSX Rendering.
 * 
 * SPECIFICATION:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.6)
 * - Usage:
 *   <Can I="role.manage" a="Role">
 *     <Button>Create Role</Button>
 *   </Can>
 */

import React from 'react';
import { useAbility } from '../../lib/ability.js';

export const Can = ({
  I: action,
  a: subject = 'all',
  field = undefined,
  children,
  fallback = null
}) => {
  const ability = useAbility();

  if (!ability) {
    return fallback;
  }

  const isAllowed =
    ability.can('manage', 'all') ||
    ability.can(action, subject, field) ||
    ability.can(action, 'all', field);

  return isAllowed ? <>{children}</> : fallback;
};

export default Can;

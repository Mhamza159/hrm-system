/**
 * @file ability.js
 * @description Client-side CASL MongoAbility builder and React context provider.
 * 
 * SPECIFICATION & ARCHITECTURE:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.6)
 * - Layer: Frontend Security & Authorization Primitives
 * - Library: @casl/ability & @casl/react
 */

import React, { createContext, useContext, useMemo } from 'react';
import { AbilityBuilder, createMongoAbility } from '@casl/ability';
import { useSelector } from 'react-redux';

export const AbilityContext = createContext(null);

/**
 * Builds a client-side MongoAbility instance from user permissions or roles array
 * @param {Array} permissions - Array of permission rule objects or role objects
 * @param {Object} [user=null] - Current authenticated user
 * @returns {import('@casl/ability').MongoAbility}
 */
export const buildAbilityFromRules = (permissions = [], user = null) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);

  const roles = user?.roles || [];
  const isSuperAdmin = roles.some((r) =>
    typeof r === 'string' ? r === 'Super Admin' : r?.name === 'Super Admin'
  );

  if (isSuperAdmin) {
    can('manage', 'all');
    return build();
  }

  // Compile all permission rules from passed permissions and populated user.roles
  const rules = [...(Array.isArray(permissions) ? permissions : [])];
  for (const role of roles) {
    if (typeof role === 'object' && Array.isArray(role?.permissions)) {
      rules.push(...role.permissions);
    }
  }

  for (const rule of rules) {
    if (!rule) continue;

    if (rule.action === 'manage' && (rule.subject === 'all' || !rule.subject)) {
      can('manage', 'all');
    } else {
      const subject = rule.subject || 'all';
      const fields = rule.fields?.length ? rule.fields : undefined;
      can(rule.action, subject, fields);
      if (subject !== 'all') {
        can(rule.action, 'all', fields);
      }
    }
  }

  return build();
};

const EMPTY_PERMISSIONS = Object.freeze([]);

/**
 * React Context Provider for CASL ability
 */
export const AbilityProvider = ({ children, initialAbility = null }) => {
  const user = useSelector((state) => state.auth?.user);
  const permissions = useSelector((state) => state.auth?.permissions) || EMPTY_PERMISSIONS;

  const ability = useMemo(() => {
    if (initialAbility) return initialAbility;
    return buildAbilityFromRules(permissions, user);
  }, [permissions, user, initialAbility]);

  return React.createElement(AbilityContext.Provider, { value: ability }, children);
};

/**
 * Hook to access current CASL ability instance
 */
export const useAbility = () => {
  const ability = useContext(AbilityContext);
  if (!ability) {
    // Fail-safe: empty ability with zero rights
    const { build } = new AbilityBuilder(createMongoAbility);
    return build();
  }
  return ability;
};

/**
 * @file errorClassifier.js
 * @description Attribution and root-cause classifier for API and runtime errors.
 * Strictly satisfies Rule 3: Explain what went wrong, whose fault it is, and how to fix it.
 */

/**
 * @typedef {Object} ClassifiedError
 * @property {'auth' | 'permission' | 'server' | 'network' | 'client' | 'gateway'} fault - Domain attribution
 * @property {string} faultLabel - Human readable fault badge label
 * @property {string} title - Plain-English summary of what broke
 * @property {string} message - Specific error message
 * @property {string} explanation - Whose fault it is and why
 * @property {string} resolution - Concrete actionable step for the user to fix it
 * @property {string} code - Traceable reference code (e.g. ERR-500, HTTP-403)
 * @property {boolean} retryable - Whether a re-try makes sense
 */

/**
 * Classify any application or API error into an attributed, actionable diagnosis.
 * @param {any} error
 * @returns {ClassifiedError}
 */
export function classifyError(error) {
  // 1. Extract status code and payload
  const status =
    error?.status ??
    error?.statusCode ??
    error?.response?.status ??
    error?.originalStatus ??
    null;

  const rawMessage =
    error?.data?.message ??
    error?.response?.data?.message ??
    error?.error ??
    error?.message ??
    'An unexpected error occurred.';

  const isNetwork =
    status === 'FETCH_ERROR' ||
    status === 'TIMEOUT_ERROR' ||
    error?.name === 'NetworkError' ||
    (typeof rawMessage === 'string' && rawMessage.toLowerCase().includes('network'));

  // 2. Authentication Expired (401)
  if (status === 401) {
    return {
      fault: 'auth',
      faultLabel: 'Authentication Session',
      title: 'Session Timeout',
      message: 'Your login credentials or refresh token expired.',
      explanation: 'Your active session expired for security reasons after inactivity.',
      resolution: 'Sign back into your account. Unsaved form changes have been preserved.',
      code: 'AUTH-401',
      retryable: false
    };
  }

  // 3. Permission Denied / Forbidden (403)
  if (status === 403) {
    return {
      fault: 'permission',
      faultLabel: 'Security Authorization',
      title: 'Access Restricted',
      message: rawMessage || 'You do not have permission to view or execute this resource.',
      explanation: 'This action is protected by Policy-Based Access Control (PBAC) rules.',
      resolution: 'Contact your Department Head or Super Administrator to request role privileges.',
      code: 'PBAC-403',
      retryable: false
    };
  }

  // 4. Network Disconnection / Gateway Timeout (504 / FETCH_ERROR)
  if (isNetwork || status === 504) {
    return {
      fault: 'network',
      faultLabel: 'Network Connectivity',
      title: 'Connection Dropped',
      message: 'Unable to reach the server.',
      explanation: 'Network connectivity between your browser and our servers was interrupted.',
      resolution: 'Check your internet connection or Wi-Fi status, then click retry.',
      code: 'NET-OFFLINE',
      retryable: true
    };
  }

  // 5. Gateway / Bad Gateway / Service Unavailable (502 / 503)
  if (status === 502 || status === 503) {
    return {
      fault: 'gateway',
      faultLabel: 'Infrastructure Gateway',
      title: 'Service Temporarily Unavailable',
      message: rawMessage || 'The server upstream or database proxy is restarting.',
      explanation: 'Our server infrastructure is undergoing a brief maintenance restart.',
      resolution: 'Wait a few seconds and click Retry to reconnect.',
      code: `GATEWAY-${status}`,
      retryable: true
    };
  }

  // 6. Server Internal Error (500)
  if (typeof status === 'number' && status >= 500) {
    return {
      fault: 'server',
      faultLabel: 'Server Internal Fault',
      title: 'Backend Processing Error',
      message: rawMessage,
      explanation: 'Our server encountered an unhandled exception while computing this request.',
      resolution: 'Click Retry. If the issue persists, share the Error Code with HR IT support.',
      code: `SRV-${status}-${Math.floor(1000 + Math.random() * 9000)}`,
      retryable: true
    };
  }

  // 7. Client Input Validation / Bad Request (400, 422)
  if (status === 400 || status === 422) {
    return {
      fault: 'client',
      faultLabel: 'Input Validation',
      title: 'Invalid Submission',
      message: rawMessage,
      explanation: 'One or more submitted fields did not meet data validation constraints.',
      resolution: 'Review the flagged input fields, correct the formatting, and re-submit.',
      code: `CLIENT-${status}`,
      retryable: false
    };
  }

  // 8. Resource Not Found (404)
  if (status === 404) {
    return {
      fault: 'client',
      faultLabel: 'Resource Missing',
      title: 'Record Not Found',
      message: rawMessage || 'The requested item does not exist or has been archived.',
      explanation: 'The record identifier was not located in the organization database.',
      resolution: 'Return to the list view or verify the record URL.',
      code: 'NOT-FOUND-404',
      retryable: false
    };
  }

  // 9. Generic Fallback
  return {
    fault: 'client',
    faultLabel: 'Application Fault',
    title: 'Unexpected Request Error',
    message: rawMessage,
    explanation: 'An unexpected application state prevented completing this operation.',
    resolution: 'Refresh the page or click Retry. Your previous form inputs remain preserved.',
    code: `ERR-${Math.floor(1000 + Math.random() * 9000)}`,
    retryable: true
  };
}


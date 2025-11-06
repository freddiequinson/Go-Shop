/**
 * API Base URL
 * Single source of truth for API URL across the application
 */

import { getBaseURL } from './config';

export const API_BASE_URL = getBaseURL() + '/api/v1'

import axios from 'axios';
import { CliAuthResponse, CliSubmissionRequest, CliSubmissionResponse } from '@inclu/shared';
import { getCliConfig } from './config';

export function getApiClient() {
  const config = getCliConfig();
  const baseURL = config?.apiUrl || process.env.CLI_BACKEND_URL || 'http://localhost:3001';
  const token = config?.cliToken;

  return axios.create({
    baseURL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });
}

export async function loginWithToken(token: string, apiUrl: string = 'http://localhost:3001'): Promise<CliAuthResponse> {
  const client = axios.create({
    baseURL: apiUrl,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  const response = await client.post<CliAuthResponse>('/api/cli/auth');
  return response.data;
}

export async function submitVerification(payload: CliSubmissionRequest): Promise<CliSubmissionResponse> {
  const client = getApiClient();
  const response = await client.post<CliSubmissionResponse>('/api/cli/submissions', payload);
  return response.data;
}

export async function getStatus(): Promise<CliAuthResponse> {
  const client = getApiClient();
  const response = await client.post<CliAuthResponse>('/api/cli/auth');
  return response.data;
}

/**
 * Type definitions for Whisper Provider
 */

export interface WhisperProviderConfig {
  serviceUrl?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  serviceConfig?: any;
}

export interface WhisperServiceInfo {
  containerName: string;
  dockerImage: string;
  ports: number[];
  composeService: string;
  composeFile: string;
  healthCheckUrl: string;
  network: string;
  serviceDirectory: string;
}

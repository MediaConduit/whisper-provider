/**
 * WhisperDockerProvider
 * 
 * Dynamic provider for OpenAI Whisper speech-to-text processing via Docker.
 * This provider can be loaded dynamically from GitHub repositories.
 */

import { WhisperAPIClient } from './WhisperAPIClient';

// Type definitions for MediaConduit compatibility
interface MediaProvider {
  readonly id: string;
  readonly name: string;
  readonly type: 'api' | 'local' | 'hybrid';
  readonly capabilities: string[];
  
  configure(config: any): Promise<void>;
  isAvailable(): Promise<boolean>;
  getModels(): Promise<any[]>;
  getModel(modelId: string): Promise<any>;
}

interface ProviderConfig {
  serviceUrl?: string;
  serviceConfig?: any;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Docker-based Whisper provider implementation
 */
export class WhisperDockerProvider implements MediaProvider {
  readonly id: string = 'whisper-docker-provider';
  readonly name: string = 'Whisper Docker Provider';
  readonly type: 'local' = 'local';
  readonly capabilities: string[] = ['audio-to-text', 'transcription', 'translation'];
  readonly models: any[] = [
    { id: 'whisper-tiny', name: 'Whisper Tiny', description: 'Fastest Whisper model, lower accuracy' },
    { id: 'whisper-base', name: 'Whisper Base', description: 'Balanced speed and accuracy' },
    { id: 'whisper-small', name: 'Whisper Small', description: 'Good accuracy, moderate speed' },
    { id: 'whisper-medium', name: 'Whisper Medium', description: 'High accuracy, slower processing' },
    { id: 'whisper-large', name: 'Whisper Large', description: 'Highest accuracy, slowest processing' }
  ];

  private apiClient?: WhisperAPIClient;
  private config?: ProviderConfig;

  constructor() {
    console.log('🎯 WhisperDockerProvider initialized');
  }

  /**
   * Configure the provider with service settings
   */
  async configure(config: ProviderConfig): Promise<void> {
    console.log('🔧 Configuring WhisperDockerProvider with:', config);
    this.config = config;

    this.apiClient = new WhisperAPIClient(
      config.baseUrl || 'http://localhost:8080',
      config.timeout || 30000
    );
  }

  /**
   * Check if the provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      if (!this.apiClient) {
        return false;
      }
      return await this.apiClient.checkHealth();
    } catch {
      return false;
    }
  }

  /**
   * Get all available models
   */
  async getModels(): Promise<any[]> {
    return [
      { id: 'whisper-tiny', name: 'Whisper Tiny' },
      { id: 'whisper-base', name: 'Whisper Base' },
      { id: 'whisper-small', name: 'Whisper Small' },
      { id: 'whisper-medium', name: 'Whisper Medium' },
      { id: 'whisper-large', name: 'Whisper Large' }
    ];
  }

  /**
   * Get a specific model by ID
   */
  async getModel(modelId: string): Promise<any> {
    const models = await this.getModels();
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      throw new Error(`Model '${modelId}' not found in WhisperDockerProvider`);
    }
    
    return model;
  }
}

// Export as default for dynamic loading
export default WhisperDockerProvider;
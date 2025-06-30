/**
 * WhisperDockerProvider
 * 
 * Dynamic provider for OpenAI Whisper speech-to-text processing via Docker.
 * This provider can be loaded dynamically from GitHub repositories.
 */

import { AbstractDockerProvider } from '@mediaconduit/mediaconduit/src/media/providers/docker/AbstractDockerProvider';
import { MediaCapability, ProviderModel, ProviderType } from '@mediaconduit/mediaconduit/src/media/types/provider';
import { WhisperAPIClient } from './WhisperAPIClient';
import { WhisperDockerModel } from './WhisperDockerModel';

/**
 * Docker-based Whisper provider implementation extending AbstractDockerProvider
 */
export class WhisperDockerProvider extends AbstractDockerProvider {
  readonly id: string = 'whisper-docker-provider';
  readonly name: string = 'Whisper Docker Provider';
  readonly type: ProviderType = ProviderType.LOCAL;
  readonly capabilities: MediaCapability[] = [MediaCapability.AUDIO_TO_TEXT];

  private _models: ProviderModel[] = [
    { 
      id: 'whisper-tiny', 
      name: 'Whisper Tiny', 
      description: 'Fastest Whisper model, lower accuracy', 
      capabilities: [MediaCapability.AUDIO_TO_TEXT],
      parameters: {}
    },
    { 
      id: 'whisper-base', 
      name: 'Whisper Base', 
      description: 'Balanced speed and accuracy', 
      capabilities: [MediaCapability.AUDIO_TO_TEXT],
      parameters: {}
    },
    { 
      id: 'whisper-small', 
      name: 'Whisper Small', 
      description: 'Good accuracy, moderate speed', 
      capabilities: [MediaCapability.AUDIO_TO_TEXT],
      parameters: {}
    },
    { 
      id: 'whisper-medium', 
      name: 'Whisper Medium', 
      description: 'High accuracy, slower processing', 
      capabilities: [MediaCapability.AUDIO_TO_TEXT],
      parameters: {}
    },
    { 
      id: 'whisper-large', 
      name: 'Whisper Large', 
      description: 'Highest accuracy, slowest processing', 
      capabilities: [MediaCapability.AUDIO_TO_TEXT],
      parameters: {}
    }
  ];

  get models(): ProviderModel[] {
    return this._models;
  }

  private apiClient?: WhisperAPIClient;

  // No constructor needed! AbstractDockerProvider handles everything

  protected getServiceUrl(): string {
    return 'https://github.com/MediaConduit/whisper-service';
  }

  protected getDefaultBaseUrl(): string {
    return 'http://localhost:9000';
  }

  // Called automatically after service is ready with correct dynamic ports
  protected async onServiceReady(): Promise<void> {
    const serviceInfo = this.getDockerService().getServiceInfo();
    const port = serviceInfo.ports[0]; // Always correct dynamic port
    this.apiClient = new WhisperAPIClient(`http://localhost:${port}`, 30000);
    console.log(`� Whisper ready on dynamic port: ${port}`);
  }

  getModelsForCapability(capability: MediaCapability): ProviderModel[] {
    if (capability === MediaCapability.AUDIO_TO_TEXT) {
      return this._models;
    }
    return [];
  }

  async getModel(modelId: string): Promise<WhisperDockerModel> {
    // Ensure service is ready - the base class handles this automatically
    
    const modelConfig = this._models.find(m => m.id === modelId);
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found in ${this.name}`);
    }

    return new WhisperDockerModel({
      id: modelConfig.id,
      name: modelConfig.name,
      description: modelConfig.description,
      apiClient: this.apiClient!
    });
  }

  getAvailableModels(): string[] {
    return this._models.map(model => model.id);
  }

  async createModel(modelId: string): Promise<WhisperDockerModel> {
    return this.getModel(modelId);
  }
}

// Export as default for dynamic loading
export default WhisperDockerProvider;
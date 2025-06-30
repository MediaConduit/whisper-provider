/**
 * WhisperDockerProvider
 * 
 * Provider implementation for Whisper STT models running in Docker containers.
 * Manages the Docker service lifecycle and provides model implementations.
 */

import { 
  MediaProvider,
  ProviderType,
  MediaCapability,
  ProviderModel,
  ProviderConfig,
  AudioToTextProvider,
  AudioToTextModel
} from '@mediaconduit/mediaconduit';
import { WhisperAPIClient } from './WhisperAPIClient';
import { WhisperDockerModel } from './WhisperDockerModel';

/**
 * Provider for Whisper STT models via Docker
 */
export class WhisperDockerProvider implements MediaProvider, AudioToTextProvider {
  readonly id = 'whisper-docker';
  readonly name = 'Whisper Docker Provider';
  readonly type = ProviderType.LOCAL;
  readonly capabilities = [MediaCapability.AUDIO_TO_TEXT];
  readonly models: ProviderModel[] = [];

  private dockerServiceManager?: any; // Generic service from ServiceRegistry
  private config?: ProviderConfig;
  private apiClient?: WhisperAPIClient;

  constructor() {
    // Auto-configure from environment variables (async but non-blocking)
    this.autoConfigureFromEnv().catch(error => {
      // Silent fail - provider will just not be available until manually configured
    });
  }

  private async autoConfigureFromEnv(): Promise<void> {
    const serviceUrl = process.env.WHISPER_SERVICE_URL || 'github:MediaConduit/whisper-service';
    
    try {
      await this.configure({
        serviceUrl: serviceUrl,
        baseUrl: 'http://localhost:9000',
        timeout: 300000,
        retries: 1
      });
    } catch (error) {
      console.warn(`[WhisperProvider] Auto-configuration failed: ${error.message}`);
    }
  }

  /**
   * Get the API client instance
   */
  protected async getAPIClient(): Promise<WhisperAPIClient> {
    if (!this.apiClient) {
      this.apiClient = new WhisperAPIClient();
    }
    return this.apiClient;
  }

  /**
   * Get the Docker service instance from ServiceRegistry
   */
  protected getDockerService(): any {
    if (!this.dockerServiceManager) {
      throw new Error('Service not configured. Please call configure() first.');
    }
    return this.dockerServiceManager;
  }

  /**
   * Start the Docker service
   */
  async startService(): Promise<boolean> {
    try {
      const dockerService = this.getDockerService();
      if (dockerService && typeof dockerService.startService === 'function') {
        return await dockerService.startService();
      } else {
        console.error('Service not properly configured');
        return false;
      }
    } catch (error) {
      console.error('Failed to start Docker service:', error);
      return false;
    }
  }

  /**
   * Stop the Docker service
   */
  async stopService(): Promise<boolean> {
    try {
      const dockerService = this.getDockerService();
      if (dockerService && typeof dockerService.stopService === 'function') {
        return await dockerService.stopService();
      } else {
        console.error('Service not properly configured');
        return false;
      }
    } catch (error) {
      console.error('Failed to stop Docker service:', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus(): Promise<{
    running: boolean;
    healthy: boolean;
    error?: string;
  }> {
    try {
      const dockerService = this.getDockerService();
      if (dockerService && typeof dockerService.getServiceStatus === 'function') {
        const status = await dockerService.getServiceStatus();
        return {
          running: status.running || false,
          healthy: status.health === 'healthy',
          error: status.state === 'error' ? status.state : undefined
        };
      } else {
        return { running: false, healthy: false };
      }
    } catch (error) {
      console.error('Failed to get service status:', error);
      return { running: false, healthy: false };
    }
  }

  /**
   * Get available models from this provider
   */
  getAvailableModels(): string[] {
    return [
      'whisper-stt',
      'whisper-base',
      'whisper-small',
      'whisper-medium',
      'whisper-large'
    ];
  }

  /**
   * Create a model instance
   */
  async createModel(modelId: string): Promise<AudioToTextModel> {
    if (!this.supportsModel(modelId)) {
      throw new Error(`Model '${modelId}' not supported by WhisperDockerProvider`);
    }

    const dockerService = await this.getDockerService();
    const apiClient = await this.getAPIClient();

    // Create Docker-specific model with injected dependencies
    const model = new WhisperDockerModel({
      dockerService,
      apiClient
    });

    return model;
  }

  /**
   * Create an audio-to-text model instance (AudioToTextProvider interface)
   */
  async createAudioToTextModel(modelId: string): Promise<AudioToTextModel> {
    return this.createModel(modelId);
  }

  /**
   * Get supported audio-to-text models (AudioToTextProvider interface)
   */
  getSupportedAudioToTextModels(): string[] {
    return this.getAvailableModels();
  }

  /**
   * Check if provider supports a specific audio-to-text model (AudioToTextProvider interface)
   */
  supportsAudioToTextModel(modelId: string): boolean {
    return this.supportsModel(modelId);
  }

  /**
   * Create a speech-to-text model instance (SpeechToTextProvider interface - alias)
   */
  async createSpeechToTextModel(modelId: string): Promise<AudioToTextModel> {
    return this.createAudioToTextModel(modelId);
  }

  /**
   * Get supported speech-to-text models (SpeechToTextProvider interface - alias)
   */
  getSupportedSpeechToTextModels(): string[] {
    return this.getSupportedAudioToTextModels();
  }

  /**
   * Check if provider supports a specific STT model (SpeechToTextProvider interface - alias)
   */
  supportsSpeechToTextModel(modelId: string): boolean {
    return this.supportsAudioToTextModel(modelId);
  }

  /**
   * Check if provider supports a specific model
   */
  supportsModel(modelId: string): boolean {
    return this.getAvailableModels().includes(modelId);
  }

  /**
   * Get provider information
   */
  getInfo() {
    return {
      description: 'Provides Whisper STT models via Docker containers',
      dockerImage: 'onerahmet/openai-whisper-asr-webservice:latest',
      defaultPort: 9000,
      capabilities: [
        'speech-to-text',
        'transcription',
        'translation',
        'multiple-languages'
      ]
    };
  }

  /**
   * Configure the provider
   */
  async configure(config: ProviderConfig): Promise<void> {
    this.config = config;
    
    // If serviceUrl is provided (e.g., GitHub URL), use ServiceRegistry
    if (config.serviceUrl) {
      // Import ServiceRegistry dynamically from MediaConduit
      const mediaconduit = await import('@mediaconduit/mediaconduit');
      const serviceRegistry = mediaconduit.ServiceRegistry.getInstance();
      this.dockerServiceManager = await serviceRegistry.getService(config.serviceUrl, config.serviceConfig) as any;
      
      // Configure API client with service port
      const serviceInfo = this.dockerServiceManager.getServiceInfo();
      if (serviceInfo.ports && serviceInfo.ports.length > 0) {
        const port = serviceInfo.ports[0];
        this.apiClient = new WhisperAPIClient(`http://localhost:${port}`);
      }
      
      console.log(`🔗 WhisperProvider configured to use service: ${config.serviceUrl}`);
      return;
    }
    
    // Fallback to direct configuration (legacy)
    if (config.baseUrl && !this.apiClient) {
      this.apiClient = new WhisperAPIClient(config.baseUrl);
    }
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const status = await this.getServiceStatus();
      return status.running && status.healthy;
    } catch {
      return false;
    }
  }

  /**
   * Get models for specific capability
   */
  getModelsForCapability(capability: MediaCapability): ProviderModel[] {
    if (capability === MediaCapability.AUDIO_TO_TEXT) {
      return this.models;
    }
    return [];
  }

  /**
   * Get model by ID
   */
  async getModel(modelId: string): Promise<any> {
    // Return a Whisper model instance
    return new WhisperDockerModel();
  }

  /**
   * Get provider health status
   */
  async getHealth(): Promise<any> {
    const status = await this.getServiceStatus();
    return {
      status: status.healthy ? 'healthy' : 'unhealthy',
      details: status
    };
  }

  
}

/**
 * WhisperDockerProvider
 * 
 * Dynamic provider for OpenAI Whisper speech-to-text processing via Docker.
 * This provider can be loaded dynamically from GitHub repositories.
 */

import { WhisperAPIClient } from './WhisperAPIClient';

// Define MediaProvider interface (will be available at runtime from MediaConduit)
interface MediaProvider {
  readonly id: string;
  readonly name: string;
  readonly type: 'api' | 'local' | 'hybrid';
  readonly capabilities: string[];
  readonly models: any[];
  
  configure(config: any): Promise<void>;
  isAvailable(): Promise<boolean>;
  getModelsForCapability(capability: string): any[];
  getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    activeJobs: number;
    queuedJobs: number;
    lastError?: string;
  }>;
  getModel(modelId: string): Promise<any>;
}

// AbstractDockerProvider - will be injected at runtime
class AbstractDockerProvider implements MediaProvider {
  readonly id: string = '';
  readonly name: string = '';
  readonly type: 'local' = 'local';
  readonly capabilities: string[] = [];
  readonly models: any[] = [];
  
  async configure(config: any): Promise<void> { }
  async isAvailable(): Promise<boolean> { return false; }
  getModelsForCapability(capability: string): any[] { return []; }
  async getHealth(): Promise<any> { return { status: 'unhealthy', uptime: 0, activeJobs: 0, queuedJobs: 0 }; }
  async getModel(modelId: string): Promise<any> { return null; }
  
  // Abstract Docker Provider methods (will be available at runtime)
  async startService(): Promise<boolean> { return false; }
  async stopService(): Promise<boolean> { return false; }
  async getServiceStatus(): Promise<{ running: boolean; healthy: boolean; error?: string; }> {
    return { running: false, healthy: false };
  }
}

/**
 * Docker-based Whisper provider implementation extending AbstractDockerProvider
 */
export class WhisperDockerProvider extends AbstractDockerProvider {
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
  private config?: any;
  private dockerServiceManager?: any; // Docker service from ServiceRegistry

  constructor() {
    super();
    console.log('🎯 WhisperDockerProvider initialized');
  }

  /**
   * Configure the provider with service settings and Docker service
   */
  async configure(config: any): Promise<void> {
    console.log('🔧 Configuring WhisperDockerProvider with:', config);
    this.config = config;

    // If configured with a Docker service from the registry
    if ((config as any).dockerServiceManager) {
      this.dockerServiceManager = (config as any).dockerServiceManager;
      console.log('🐳 Docker service manager configured');
    }

    this.apiClient = new WhisperAPIClient(
      config.baseUrl || 'http://localhost:8080',
      config.timeout || 30000
    );
  }

  /**
   * Start the Docker service (AbstractDockerProvider compatibility)
   */
  async startService(): Promise<boolean> {
    try {
      if (this.dockerServiceManager && typeof this.dockerServiceManager.startService === 'function') {
        console.log('🚀 Starting Whisper Docker service...');
        const result = await this.dockerServiceManager.startService();
        console.log('✅ Whisper Docker service started:', result);
        return result;
      } else {
        console.warn('⚠️ No Docker service manager available');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Failed to start Whisper Docker service:', error);
      return false;
    }
  }

  /**
   * Stop the Docker service (AbstractDockerProvider compatibility)
   */
  async stopService(): Promise<boolean> {
    try {
      if (this.dockerServiceManager && typeof this.dockerServiceManager.stopService === 'function') {
        console.log('🛑 Stopping Whisper Docker service...');
        const result = await this.dockerServiceManager.stopService();
        console.log('✅ Whisper Docker service stopped:', result);
        return result;
      } else {
        console.warn('⚠️ No Docker service manager available');
        return false;
      }
    } catch (error: any) {
      console.error('❌ Failed to stop Whisper Docker service:', error);
      return false;
    }
  }

  /**
   * Get Docker service status (AbstractDockerProvider compatibility)
   */
  async getServiceStatus(): Promise<{
    running: boolean;
    healthy: boolean;
    error?: string;
  }> {
    try {
      if (this.dockerServiceManager && typeof this.dockerServiceManager.getServiceStatus === 'function') {
        const status = await this.dockerServiceManager.getServiceStatus();
        return {
          running: status.running || false,
          healthy: status.health === 'healthy',
          error: status.health === 'unhealthy' ? status.error : undefined
        };
      } else {
        return { running: false, healthy: false, error: 'No Docker service manager' };
      }
    } catch (error: any) {
      console.error('Failed to get service status:', error);
      return { running: false, healthy: false, error: error.message };
    }
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

  /**
   * Get available models for a specific capability
   */
  getModelsForCapability(capability: string): any[] {
    // All our models support audio-to-text capability
    if (capability === 'audio-to-text' || capability === 'transcription' || capability === 'translation') {
      return this.models;
    }
    return [];
  }

  /**
   * Get provider health information
   */
  async getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    activeJobs: number;
    queuedJobs: number;
    lastError?: string;
  }> {
    try {
      const isAvailable = await this.isAvailable();
      return {
        status: isAvailable ? 'healthy' : 'unhealthy',
        uptime: Date.now(),
        activeJobs: 0,
        queuedJobs: 0,
        lastError: isAvailable ? undefined : 'Service not available'
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        uptime: 0,
        activeJobs: 0,
        queuedJobs: 0,
        lastError: error.message
      };
    }
  }
}

// Export as default for dynamic loading
export default WhisperDockerProvider;
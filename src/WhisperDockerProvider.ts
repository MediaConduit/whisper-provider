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

  constructor(dockerService?: any) {
    super();
    console.log('🎯 WhisperDockerProvider initialized');
    
    // If a Docker service was passed from ProviderRegistry, use it
    if (dockerService) {
      this.dockerServiceManager = dockerService;
      console.log('🐳 Docker service manager configured via constructor');
      
      // Set up API client with service port information
      this.setupAPIClientFromService();
    }
  }

  /**
   * Set up API client using Docker service port information
   */
  private setupAPIClientFromService(): void {
    if (this.dockerServiceManager && typeof this.dockerServiceManager.getServiceInfo === 'function') {
      try {
        const serviceInfo = this.dockerServiceManager.getServiceInfo();
        const port = serviceInfo.ports?.[0] || 9000;
        const baseUrl = `http://localhost:${port}`;
        
        this.apiClient = new WhisperAPIClient(baseUrl, 30000);
        console.log(`🌐 API client configured for: ${baseUrl}`);
      } catch (error) {
        console.warn('Failed to configure API client from service info:', error);
      }
    }
  }

  /**
   * Update API client with new port after service startup
   */
  private updateAPIClientPort(): void {
    if (this.dockerServiceManager && typeof this.dockerServiceManager.getServiceInfo === 'function') {
      try {
        const serviceInfo = this.dockerServiceManager.getServiceInfo();
        const port = serviceInfo.ports?.[0];
        
        if (port && port !== 9000) {
          const baseUrl = `http://localhost:${port}`;
          console.log(`🔄 [updateAPIClientPort] Updating API client to use dynamic port: ${baseUrl}`);
          this.apiClient = new WhisperAPIClient(baseUrl, 30000);
          console.log(`🌐 API client reconfigured for: ${baseUrl}`);
        } else {
          console.log(`🔍 [updateAPIClientPort] No dynamic port detected, keeping current configuration`);
        }
      } catch (error) {
        console.warn('Failed to update API client port:', error);
      }
    }
  }

  /**
   * Configure the provider with service settings and Docker service
   */
  async configure(config: any): Promise<void> {
    console.log('🔧 Configuring WhisperDockerProvider with:', config);
    this.config = config;

    // Check for Docker service manager in various possible property names (fallback for manual configuration)
    if (!this.dockerServiceManager) {
      if ((config as any).dockerServiceManager) {
        this.dockerServiceManager = (config as any).dockerServiceManager;
        console.log('🐳 Docker service manager configured via config.dockerServiceManager');
      } else if ((config as any).dockerService) {
        this.dockerServiceManager = (config as any).dockerService;
        console.log('🐳 Docker service manager configured via config.dockerService');
      } else if ((config as any).service) {
        this.dockerServiceManager = (config as any).service;
        console.log('🐳 Docker service manager configured via config.service');
      } else {
        console.log('🔍 No Docker service manager found in config. Available properties:', Object.keys(config));
      }
    } else {
      console.log('🐳 Docker service manager already configured via constructor');
    }

    // Set up API client if not already configured
    if (!this.apiClient) {
      const baseUrl = config.baseUrl || this.detectServiceUrl() || 'http://localhost:9000';
      this.apiClient = new WhisperAPIClient(baseUrl, config.timeout || 30000);
      console.log(`🌐 API client configured for: ${baseUrl}`);
    }
  }

  /**
   * Detect service URL from Docker service info
   */
  private detectServiceUrl(): string | undefined {
    if (this.dockerServiceManager && typeof this.dockerServiceManager.getServiceInfo === 'function') {
      try {
        const serviceInfo = this.dockerServiceManager.getServiceInfo();
        const port = serviceInfo.ports?.[0] || 9000;
        return `http://localhost:${port}`;
      } catch (error) {
        console.warn('Failed to detect service URL from Docker service:', error);
      }
    }
    return undefined;
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
        
        // Update API client with the actual dynamic port after service starts
        if (result) {
          this.updateAPIClientPort();
        }
        
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

  /**
   * Get the API client for debugging (expose private member)
   */
  getAPIClient(): WhisperAPIClient | undefined {
    return this.apiClient;
  }
}

// Export as default for dynamic loading
export default WhisperDockerProvider;
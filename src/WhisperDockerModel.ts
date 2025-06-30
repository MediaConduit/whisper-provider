/**
 * WhisperDockerModel
 * 
 * Model implementation for Whisper speech-to-text via Docker containers.
 */

import { WhisperAPIClient } from './WhisperAPIClient';

export interface WhisperDockerModelConfig {
  id: string;
  name: string;
  description?: string;
  apiClient: WhisperAPIClient;
}

/**
 * Whisper Docker model implementation
 */
export class WhisperDockerModel {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  
  private apiClient: WhisperAPIClient;

  constructor(config: WhisperDockerModelConfig) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.apiClient = config.apiClient;
  }

  /**
   * Transform audio input to text using Whisper
   */
  async transform(input: any, options?: any): Promise<any> {
    try {
      // Basic implementation - would be enhanced with actual API calls
      return {
        text: "Transcribed text would be here",
        model: this.id,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      throw new Error(`Whisper transcription failed: ${error.message}`);
    }
  }

  /**
   * Check if the model is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      return this.apiClient ? await this.apiClient.checkHealth() : false;
    } catch {
      return false;
    }
  }
}

export default WhisperDockerModel;
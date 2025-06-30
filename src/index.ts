/**
 * Whisper Provider - Dynamic MediaConduit Provider
 * 
 * A dynamic provider for OpenAI Whisper speech-to-text processing via Docker.
 * This provider is loaded dynamically by MediaConduit from GitHub.
 */

export { WhisperDockerProvider as default } from './WhisperDockerProvider';
export { WhisperDockerProvider } from './WhisperDockerProvider';
export { WhisperDockerModel } from './WhisperDockerModel';
export { WhisperAPIClient } from './WhisperAPIClient';
export type { 
  WhisperTranscriptionRequest, 
  WhisperTranscriptionResponse 
} from './WhisperAPIClient';
export type { WhisperDockerModelConfig } from './WhisperDockerModel';

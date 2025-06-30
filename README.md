# Whisper Provider

A dynamic provider for MediaConduit that enables OpenAI Whisper speech-to-text processing via Docker containers.

## Features

- **Multiple Whisper Models**: Support for base, small, medium, and large Whisper models
- **Dynamic Service Loading**: Automatically loads and manages the Whisper Docker service
- **Multi-language Support**: Transcription and translation for 20+ languages
- **Flexible Options**: Support for word timestamps, language detection, and translation
- **Robust Error Handling**: Comprehensive error handling and service management
- **Production Ready**: Docker-based isolation with health monitoring

## Installation

This provider is loaded dynamically by MediaConduit. No manual installation required.

```typescript
// Provider is loaded automatically via MediaConduit registry
const provider = await registry.getProvider('https://github.com/MediaConduit/whisper-provider');
```

## Usage

### Basic Speech-to-Text

```typescript
import { getProviderRegistry } from '@mediaconduit/mediaconduit';

async function transcribeAudio() {
  const registry = getProviderRegistry();
  const provider = await registry.getProvider('https://github.com/MediaConduit/whisper-provider');
  
  // Get the default Whisper model
  const model = await provider.getModel('whisper-stt');
  
  // Load audio file
  const audioInput = AssetLoader.load('speech.wav');
  
  // Transcribe audio
  const result = await model.transform(audioInput, {
    language: 'en',
    task: 'transcribe'
  });
  
  console.log('Transcription:', result.content);
}
```

### With Word Timestamps

```typescript
const result = await model.transform(audioInput, {
  language: 'auto',
  task: 'transcribe',
  wordTimestamps: true
});

console.log('Transcription:', result.content);
console.log('Segments:', result.metadata?.segments);
```

### Language Translation

```typescript
// Translate Spanish audio to English text
const result = await model.transform(spanishAudio, {
  language: 'es',
  task: 'translate' // Translate to English
});

console.log('Translation:', result.content);
```

## Configuration

The provider supports the following configuration options:

### Service Configuration

```typescript
await provider.configure({
  serviceUrl: 'https://github.com/MediaConduit/whisper-service', // Default
  timeout: 300000, // 5 minutes
  retries: 1
});
```

### Direct HTTP Configuration

```typescript
await provider.configure({
  baseUrl: 'http://localhost:9000',
  timeout: 300000
});
```

## Models

### whisper-stt (Default)
- **Capabilities**: audio-to-text, transcription, translation
- **Input**: Audio files (mp3, wav, flac, m4a, ogg, etc.)
- **Output**: Transcribed text with optional metadata

### whisper-base
- **Description**: Base Whisper model for general transcription
- **Performance**: Fast, lower accuracy
- **Use Case**: Quick transcription tasks

### whisper-small  
- **Description**: Small model with faster processing
- **Performance**: Faster than base, good accuracy
- **Use Case**: Real-time applications

### whisper-medium
- **Description**: Medium model with balanced speed and accuracy
- **Performance**: Good balance of speed and quality
- **Use Case**: Production applications

### whisper-large
- **Description**: Large model with highest accuracy
- **Performance**: Slower but most accurate
- **Use Case**: High-quality transcription needs

## Supported Languages

Auto-detection plus 20+ explicit languages:
- English (en), Spanish (es), French (fr), German (de)
- Italian (it), Portuguese (pt), Russian (ru), Japanese (ja)
- Korean (ko), Chinese (zh), Arabic (ar), Hindi (hi)
- Dutch (nl), Swedish (sv), Danish (da), Norwegian (no)
- Finnish (fi), Polish (pl), Turkish (tr), and more

## Audio Format Support

**Input Formats**: mp3, wav, flac, m4a, ogg, wma, aac, opus, webm

**Maximum File Size**: 25MB  
**Maximum Duration**: 10 minutes

## API Reference

### WhisperDockerProvider

Main provider class implementing MediaProvider interface.

```typescript
class WhisperDockerProvider implements MediaProvider, AudioToTextProvider {
  readonly id: string = 'whisper-docker';
  readonly name: string = 'Whisper Docker Provider';
  readonly type: ProviderType = ProviderType.LOCAL;
  
  // Configure the provider
  async configure(config: ProviderConfig): Promise<void>
  
  // Get available models
  getAvailableModels(): string[]
  
  // Create model instance
  async createModel(modelId: string): Promise<AudioToTextModel>
  
  // Service management
  async startService(): Promise<boolean>
  async stopService(): Promise<boolean>
  async getServiceStatus(): Promise<ServiceStatus>
}
```

### AudioToTextOptions

```typescript
interface AudioToTextOptions {
  language?: string;          // Language code (auto, en, es, etc.)
  task?: 'transcribe' | 'translate';  // Task type
  wordTimestamps?: boolean;   // Include word-level timestamps
}
```

### Transcription Result

```typescript
interface TranscriptionResult {
  content: string;           // Transcribed text
  language: string;          // Detected/specified language  
  confidence: number;        // Confidence score (0-1)
  metadata?: {
    segments?: Array<{       // Word/phrase segments
      start: number;         // Start time (seconds)
      end: number;           // End time (seconds)
      text: string;          // Segment text
      confidence?: number;   // Segment confidence
    }>;
    processingTime: number;  // Processing duration (ms)
    model: string;           // Model used
    provider: string;        // Provider name
    duration?: number;       // Audio duration (seconds)
  };
}
```

## Service Dependencies

This provider requires the Whisper Docker service:

- **Service Repository**: https://github.com/MediaConduit/whisper-service
- **Docker Image**: onerahmet/openai-whisper-asr-webservice:latest
- **Default Port**: 9000 (dynamically assigned)
- **Health Check**: Automatic service monitoring

The service is automatically loaded and managed by MediaConduit's ServiceRegistry.

## Error Handling

The provider includes comprehensive error handling:

```typescript
try {
  const result = await model.transform(audio);
  console.log('Success:', result.content);
} catch (error) {
  if (error.message.includes('Invalid audio data')) {
    console.error('Audio file is corrupted or invalid format');
  } else if (error.message.includes('service not healthy')) {
    console.error('Docker service is not running properly');
  } else if (error.message.includes('timeout')) {
    console.error('Request timed out - try a shorter audio file');
  } else {
    console.error('Transcription failed:', error.message);
  }
}
```

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Requirements

- **Node.js**: >=18.0.0
- **Docker**: >=20.0.0  
- **Memory**: 2GB RAM recommended
- **Disk Space**: 1GB for models and temporary files

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Support

- **Issues**: https://github.com/MediaConduit/whisper-provider/issues
- **Documentation**: https://github.com/MediaConduit/whisper-provider#readme
- **MediaConduit Core**: https://github.com/MediaConduit/mediaconduit

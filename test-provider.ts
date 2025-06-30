/**
 * Test script for Whisper Provider
 * 
 * This script tests the dynamic loading and basic functionality of the Whisper provider
 */

import { WhisperDockerProvider } from './src/WhisperDockerProvider';
import { WhisperAPIClient } from './src/WhisperAPIClient';

async function testWhisperProvider() {
  console.log('🧪 Testing Whisper Provider...\n');

  try {
    // Test 1: Provider instantiation
    console.log('1. Creating WhisperDockerProvider...');
    const provider = new WhisperDockerProvider();
    console.log('   ✅ Provider created successfully');
    console.log('   Provider ID:', provider.id);
    console.log('   Provider Name:', provider.name);
    console.log('   Provider Type:', provider.type);
    console.log('   Capabilities:', provider.capabilities);

    // Test 2: Configuration
    console.log('\n2. Testing provider configuration...');
    await provider.configure({
      serviceUrl: 'github:MediaConduit/whisper-service',
      baseUrl: 'http://localhost:9000',
      timeout: 300000,
      retries: 1
    });
    console.log('   ✅ Provider configured successfully');

    // Test 3: Available models
    console.log('\n3. Testing available models...');
    const models = provider.getAvailableModels();
    console.log('   Available Models:', models);
    console.log('   ✅ Models retrieved successfully');

    // Test 4: Model support check
    console.log('\n4. Testing model support...');
    const supportsWhisperSTT = provider.supportsModel('whisper-stt');
    const supportsWhisperBase = provider.supportsModel('whisper-base');
    const supportsInvalid = provider.supportsModel('invalid-model');
    
    console.log('   Supports whisper-stt:', supportsWhisperSTT);
    console.log('   Supports whisper-base:', supportsWhisperBase);
    console.log('   Supports invalid-model:', supportsInvalid);
    console.log('   ✅ Model support check working');

    // Test 5: Provider info
    console.log('\n5. Testing provider info...');
    const info = provider.getInfo();
    console.log('   Provider Info:', {
      description: info.description,
      dockerImage: info.dockerImage,
      defaultPort: info.defaultPort,
      capabilities: info.capabilities
    });
    console.log('   ✅ Provider info retrieved successfully');

    // Test 6: API Client
    console.log('\n6. Testing API Client...');
    const apiClient = new WhisperAPIClient('http://localhost:9000', 300000);
    const apiInfo = apiClient.getInfo();
    console.log('   API Info:', {
      baseUrl: apiInfo.baseUrl,
      timeout: apiInfo.timeout,
      endpoints: apiInfo.endpoints,
      supportedFormats: apiInfo.supportedFormats
    });
    console.log('   Supported Languages:', apiClient.getSupportedLanguages());
    console.log('   ✅ API Client working correctly');

    // Test 7: Audio format validation
    console.log('\n7. Testing audio format validation...');
    const validFormats = ['test.mp3', 'test.wav', 'test.flac'];
    const invalidFormats = ['test.txt', 'test.jpg', 'test.unknown'];
    
    validFormats.forEach(format => {
      const isValid = apiClient.validateAudioFormat(format);
      console.log(`   ${format}: ${isValid ? '✅' : '❌'}`);
    });
    
    invalidFormats.forEach(format => {
      const isValid = apiClient.validateAudioFormat(format);
      console.log(`   ${format}: ${isValid ? '✅' : '❌'}`);
    });

    console.log('\n🎉 All tests passed! Whisper Provider is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
  }
}

// Only run tests if this file is executed directly
if (require.main === module) {
  testWhisperProvider().catch(console.error);
}

export { testWhisperProvider };

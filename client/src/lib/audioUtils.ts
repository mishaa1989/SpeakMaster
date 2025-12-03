export async function mergeAudioBlobs(blobs: Blob[]): Promise<Blob> {
  if (blobs.length === 0) {
    throw new Error('No audio blobs to merge');
  }
  
  if (blobs.length === 1) {
    const audioContext = new AudioContext();
    const arrayBuffer = await blobs[0].arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const monoBuffer = convertToMono(audioContext, audioBuffer);
    const wavBlob = audioBufferToWav(monoBuffer);
    await audioContext.close();
    return wavBlob;
  }

  const audioContext = new AudioContext();
  const audioBuffers: AudioBuffer[] = [];

  for (const blob of blobs) {
    const arrayBuffer = await blob.arrayBuffer();
    try {
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioBuffers.push(audioBuffer);
    } catch (error) {
      console.error('Failed to decode audio blob:', error);
      throw new Error('오디오 디코딩에 실패했습니다');
    }
  }

  const targetSampleRate = 44100;
  const normalizedBuffers = audioBuffers.map(buffer => 
    normalizeAudioBuffer(audioContext, buffer, targetSampleRate)
  );

  const totalLength = normalizedBuffers.reduce((sum, buffer) => sum + buffer.length, 0);
  const mergedBuffer = audioContext.createBuffer(1, totalLength, targetSampleRate);

  let offset = 0;
  for (const buffer of normalizedBuffers) {
    const channelData = mergedBuffer.getChannelData(0);
    channelData.set(buffer.getChannelData(0), offset);
    offset += buffer.length;
  }

  const wavBlob = audioBufferToWav(mergedBuffer);
  
  await audioContext.close();
  
  return wavBlob;
}

function convertToMono(audioContext: AudioContext, buffer: AudioBuffer): AudioBuffer {
  if (buffer.numberOfChannels === 1) {
    return buffer;
  }

  const monoBuffer = audioContext.createBuffer(1, buffer.length, buffer.sampleRate);
  const monoData = monoBuffer.getChannelData(0);

  for (let i = 0; i < buffer.length; i++) {
    let sum = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      sum += buffer.getChannelData(channel)[i];
    }
    monoData[i] = sum / buffer.numberOfChannels;
  }

  return monoBuffer;
}

function normalizeAudioBuffer(audioContext: AudioContext, buffer: AudioBuffer, targetSampleRate: number): AudioBuffer {
  const monoBuffer = convertToMono(audioContext, buffer);
  
  if (monoBuffer.sampleRate === targetSampleRate) {
    return monoBuffer;
  }

  const ratio = monoBuffer.sampleRate / targetSampleRate;
  const newLength = Math.round(monoBuffer.length / ratio);
  const resampledBuffer = audioContext.createBuffer(1, newLength, targetSampleRate);
  const oldData = monoBuffer.getChannelData(0);
  const newData = resampledBuffer.getChannelData(0);

  for (let i = 0; i < newLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, oldData.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    newData[i] = oldData[srcIndexFloor] * (1 - fraction) + oldData[srcIndexCeil] * fraction;
  }

  return resampledBuffer;
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1;
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numberOfChannels * bytesPerSample;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, bufferLength - 8, true);
  writeString(view, 8, 'WAVE');

  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

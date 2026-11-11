/**
 * MP4 Export Engine for CodeMotion Studio
 * Uses WebCodecs VideoEncoder + mp4-muxer when available in the browser.
 * Falls back to canvas.captureStream + MediaRecorder seamlessly.
 */

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { Project, Scene } from '../types';
import { renderScene, globalImageCache } from './renderer';

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  status: 'initializing' | 'rendering' | 'muxing' | 'completed' | 'cancelled' | 'error';
  errorMessage?: string;
  blobUrl?: string;
}

export type ProgressCallback = (progress: ExportProgress) => void;

export class ProjectExporter {
  private isCancelled = false;

  cancel() {
    this.isCancelled = true;
  }

  async exportVideo(
    project: Project,
    selectedSceneOnly: boolean = false,
    activeSceneId?: string,
    onProgress?: ProgressCallback
  ): Promise<string> {
    this.isCancelled = false;

    const width = project.canvas.width || 1080;
    const height = project.canvas.height || 1920;
    const fps = project.canvas.fps || 30;

    // Filter scenes
    const scenesToExport: Scene[] = selectedSceneOnly && activeSceneId
      ? project.scenes.filter((s) => s.id === activeSceneId)
      : project.scenes;

    if (scenesToExport.length === 0) {
      throw new Error('No scenes to export');
    }

    // Calculate total duration & frames
    const totalDurationMs = scenesToExport.reduce((acc, s) => acc + s.durationMs, 0);
    const totalFrames = Math.max(1, Math.round((totalDurationMs / 1000) * fps));

    onProgress?.({
      currentFrame: 0,
      totalFrames,
      percentage: 0,
      status: 'initializing',
    });

    // Create offscreen render canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) {
      throw new Error('Could not create 2D canvas context for video export');
    }

    // Try WebCodecs + mp4-muxer first
    const hasWebCodecs =
      typeof window !== 'undefined' &&
      'VideoEncoder' in window &&
      'VideoFrame' in window;

    if (hasWebCodecs) {
      try {
        return await this.exportWithWebCodecs(
          canvas,
          ctx,
          scenesToExport,
          width,
          height,
          fps,
          totalFrames,
          onProgress
        );
      } catch (err) {
        console.warn('WebCodecs export failed or unsupported codec, falling back to MediaRecorder:', err);
      }
    }

    // Fallback: MediaRecorder
    return await this.exportWithMediaRecorder(
      canvas,
      ctx,
      scenesToExport,
      width,
      height,
      fps,
      totalFrames,
      onProgress
    );
  }

  private async exportWithWebCodecs(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    scenes: Scene[],
    width: number,
    height: number,
    fps: number,
    totalFrames: number,
    onProgress?: ProgressCallback
  ): Promise<string> {
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width,
        height,
      },
      fastStart: 'in-memory',
    });

    let encoderError: Error | null = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        encoderError = e;
      },
    });

    // avc1.42001f is H.264 Baseline, avc1.4d002a is Main Profile Level 4.2
    // avc1.64002a is High Profile
    const config: VideoEncoderConfig = {
      codec: 'avc1.4d002a',
      width,
      height,
      bitrate: 8_000_000,
      framerate: fps,
    };

    const isSupported = await VideoEncoder.isConfigSupported(config);
    if (!isSupported.supported) {
      // Try baseline profile
      config.codec = 'avc1.42001f';
    }

    encoder.configure(config);

    let currentFrame = 0;

    // Render frame-by-frame
    for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex++) {
      const scene = scenes[sceneIndex];
      const sceneFrames = Math.round((scene.durationMs / 1000) * fps);

      for (let f = 0; f < sceneFrames; f++) {
        if (this.isCancelled) {
          encoder.close();
          onProgress?.({
            currentFrame,
            totalFrames,
            percentage: Math.round((currentFrame / totalFrames) * 100),
            status: 'cancelled',
          });
          throw new Error('Export cancelled by user');
        }

        if (encoderError) {
          throw encoderError;
        }

        const sceneMs = (f / fps) * 1000;
        renderScene(ctx, scene, sceneMs, width, height, globalImageCache);

        const timestampMicroseconds = Math.round((currentFrame * 1_000_000) / fps);
        const videoFrame = new VideoFrame(canvas, {
          timestamp: timestampMicroseconds,
        });

        encoder.encode(videoFrame, { keyFrame: currentFrame % (fps * 2) === 0 });
        videoFrame.close();

        currentFrame++;

        // Batch yield to avoid blocking the event loop
        if (f % 5 === 0 || f === sceneFrames - 1) {
          onProgress?.({
            currentFrame,
            totalFrames,
            percentage: Math.round((currentFrame / totalFrames) * 100),
            status: 'rendering',
          });
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    }

    onProgress?.({
      currentFrame: totalFrames,
      totalFrames,
      percentage: 100,
      status: 'muxing',
    });

    await encoder.flush();
    encoder.close();
    muxer.finalize();

    const buffer = muxer.target.buffer;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);

    onProgress?.({
      currentFrame: totalFrames,
      totalFrames,
      percentage: 100,
      status: 'completed',
      blobUrl: url,
    });

    return url;
  }

  private async exportWithMediaRecorder(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    scenes: Scene[],
    width: number,
    height: number,
    fps: number,
    totalFrames: number,
    onProgress?: ProgressCallback
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Pick best supported MIME
      const mimeTypes = [
        'video/mp4; codecs="avc1.424028"',
        'video/mp4',
        'video/webm; codecs=vp9',
        'video/webm',
      ];
      let selectedMime = 'video/webm';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          selectedMime = m;
          break;
        }
      }

      const stream = canvas.captureStream(fps);
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 8_000_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const ext = selectedMime.includes('mp4') ? 'video/mp4' : 'video/webm';
        const blob = new Blob(chunks, { type: ext });
        const url = URL.createObjectURL(blob);
        onProgress?.({
          currentFrame: totalFrames,
          totalFrames,
          percentage: 100,
          status: 'completed',
          blobUrl: url,
        });
        resolve(url);
      };

      recorder.onerror = (e) => {
        reject(new Error(`MediaRecorder error: ${e}`));
      };

      recorder.start();

      let currentFrame = 0;
      const frameInterval = 1000 / fps;

      const runLoop = async () => {
        for (let sIdx = 0; sIdx < scenes.length; sIdx++) {
          const scene = scenes[sIdx];
          const sceneFrames = Math.round((scene.durationMs / 1000) * fps);

          for (let f = 0; f < sceneFrames; f++) {
            if (this.isCancelled) {
              recorder.stop();
              onProgress?.({
                currentFrame,
                totalFrames,
                percentage: Math.round((currentFrame / totalFrames) * 100),
                status: 'cancelled',
              });
              reject(new Error('Export cancelled'));
              return;
            }

            const sceneMs = (f / fps) * 1000;
            renderScene(ctx, scene, sceneMs, width, height, globalImageCache);
            currentFrame++;

            onProgress?.({
              currentFrame,
              totalFrames,
              percentage: Math.round((currentFrame / totalFrames) * 100),
              status: 'rendering',
            });

            await new Promise((r) => setTimeout(r, frameInterval));
          }
        }

        recorder.stop();
      };

      runLoop().catch(reject);
    });
  }
}

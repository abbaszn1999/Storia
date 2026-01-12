import { ProviderRequestError, MissingApiKeyError } from "../errors";
import { getProviderConfig } from "../config";
import type { AiProviderAdapter } from "./base-provider";
import { registerProvider } from "./base-provider";

function trimTrailingSlash(url: string | undefined): string {
  if (!url) return "";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function extractOutputText(data: any): string | undefined {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  if (Array.isArray(data?.output)) {
    const textSegments: string[] = [];
    for (const message of data.output) {
      if (!message?.content) continue;
      for (const part of message.content) {
        if (part?.type === "output_text" && typeof part.text === "string") {
          textSegments.push(part.text);
        }
      }
    }
    if (textSegments.length > 0) {
      return textSegments.join("\n").trim();
    }
  }
  return undefined;
}

const openAiAdapter: AiProviderAdapter = {
  name: "openai",
  supports(model: string) {
    const provider = getProviderConfig("openai");
    return Boolean(provider.models[model]);
  },
  async call({ request, providerConfig, modelConfig }) {
    if (!providerConfig.apiKey) {
      throw new MissingApiKeyError("openai");
    }

    const baseUrl = trimTrailingSlash(providerConfig.baseUrl);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VIDEO GENERATION (Sora 2 / Sora 2 Pro)
    // ═══════════════════════════════════════════════════════════════════════════
    if (request.task === "video-generation" || request.task === "image-to-video") {
      const url = `${baseUrl}/videos`; // Use /videos endpoint for Sora (baseUrl already includes /v1)
      const headers: Record<string, string> = {
        Authorization: `Bearer ${providerConfig.apiKey}`,
      };

      if (providerConfig.organizationId) {
        headers["OpenAI-Organization"] = providerConfig.organizationId;
      }
      // Content-Type will be set conditionally below based on request type

      // Extract payload (should contain: prompt, duration, resolution, image?)
      const payload = request.payload as Record<string, unknown>;
      
      if (!payload.prompt || typeof payload.prompt !== "string") {
        throw new ProviderRequestError("openai", "Missing or invalid 'prompt' parameter for video generation");
      }
      
      if (!payload.duration || typeof payload.duration !== "number") {
        throw new ProviderRequestError("openai", "Missing or invalid 'duration' parameter for video generation");
      }
      
      if (!payload.resolution || typeof payload.resolution !== "string") {
        throw new ProviderRequestError("openai", "Missing or invalid 'resolution' parameter for video generation");
      }

      const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes for video generation
      const startTime = Date.now();

      // Prepare request body and headers
      // For image-to-video, we need to send input_reference as a file (multipart/form-data)
      // For text-to-video, we can use JSON
      let requestBody: string | any; // FormData from form-data package
      let requestHeaders = { ...headers };

      if (request.task === "image-to-video" && payload.image) {
        const imageUrl = payload.image as string;
        
        console.log("[openai:sora] Downloading image for file upload:", imageUrl.substring(0, 80) + "...");
        
        // Download image from CDN
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
          throw new ProviderRequestError("openai", `Failed to download image from URL: ${imageResponse.status} ${imageResponse.statusText}`);
        }
        
        let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
        
        // Parse resolution to get width and height
        // Format: "1280x720", "720x1280", etc.
        const resolution = payload.resolution as string;
        const [targetWidth, targetHeight] = resolution.split('x').map(Number);
        
        if (!targetWidth || !targetHeight || isNaN(targetWidth) || isNaN(targetHeight)) {
          throw new ProviderRequestError("openai", `Invalid resolution format: ${resolution}. Expected format: "WIDTHxHEIGHT"`);
        }
        
        // Get current image dimensions using sharp
        const sharp = (await import('sharp')).default;
        const imageMetadata = await sharp(imageBuffer).metadata();
        const currentWidth = imageMetadata.width || 0;
        const currentHeight = imageMetadata.height || 0;
        
        // Only resize if dimensions don't match
        if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
          console.log("[openai:sora] Image dimensions don't match - resizing:", {
            current: `${currentWidth}x${currentHeight}`,
            target: `${targetWidth}x${targetHeight}`,
          });
          
          // Resize image to exact video dimensions
          imageBuffer = await sharp(imageBuffer)
            .resize(targetWidth, targetHeight, {
              fit: 'cover', // Maintain aspect ratio, crop to fit (better than stretching)
            })
            .toBuffer();
          
          console.log("[openai:sora] Image resized successfully");
        } else {
          console.log("[openai:sora] Image dimensions match - no resize needed:", {
            dimensions: `${currentWidth}x${currentHeight}`,
          });
        }
        
        // Determine file extension from content type
        const extensionMap: Record<string, string> = {
          "image/jpeg": "jpg",
          "image/jpg": "jpg",
          "image/png": "png",
          "image/webp": "webp",
        };
        const extension = extensionMap[contentType] || "jpg";
        
        // Use Node.js native FormData and Blob (Node.js 18+)
        // Native FormData is fully compatible with built-in fetch API
        // This avoids compatibility issues with the form-data package
        const formData = new FormData();
        
        // Create a Blob from the image buffer (resized if needed)
        // Convert Buffer to Uint8Array for Blob compatibility
        const imageBlob = new Blob([new Uint8Array(imageBuffer)], { type: contentType });
        
        // Append form fields
        formData.append('model', modelConfig.name);
        formData.append('prompt', payload.prompt as string);
        formData.append('seconds', String(payload.duration));
        formData.append('size', payload.resolution as string);
        formData.append('input_reference', imageBlob, `reference.${extension}`);
        
        // CRITICAL FIX: Remove Content-Type before using FormData
        // Native FormData will set Content-Type with boundary automatically
        // Don't set it manually - fetch will handle it
        const { 'Content-Type': _, 'Content-Length': __, ...headersWithoutContentType } = requestHeaders;
        requestHeaders = {
          ...headersWithoutContentType,
          // Don't set Content-Type - fetch will set it automatically with the correct boundary
        };
        
        // Native FormData works directly with Node.js fetch
        requestBody = formData;
        
        // Log headers for debugging
        console.log("[openai:sora] Request headers:", {
          hasContentType: !!requestHeaders['Content-Type'],
          contentType: requestHeaders['Content-Type'],
          hasAuthorization: !!requestHeaders['Authorization'],
        });
        
        console.log("[openai:sora] Generating video with image reference:", {
          model: modelConfig.name,
          seconds: String(payload.duration),
          size: payload.resolution,
          promptLength: typeof payload.prompt === 'string' ? payload.prompt.length : 0,
          imageSize: `${(imageBuffer.length / 1024).toFixed(1)}KB`,
          imageType: contentType,
        });
      } else {
        // Text-to-video: use JSON
        const body: Record<string, unknown> = {
          model: modelConfig.name,
          prompt: payload.prompt,
          seconds: String(payload.duration),
          size: payload.resolution,
        };
        
        requestBody = JSON.stringify(body);
        
        // Set Content-Type for JSON requests
        requestHeaders['Content-Type'] = 'application/json';
        
        console.log("[openai:sora] Generating video:", {
          model: modelConfig.name,
          seconds: body.seconds,
          size: body.size,
          promptLength: typeof body.prompt === 'string' ? body.prompt.length : 0,
        });
      }

      try {
        // Step 1: Create video generation job
        const createResponse = await fetch(url, {
          method: "POST",
          headers: requestHeaders,
          body: requestBody,
        });

        if (!createResponse.ok) {
          const details = await createResponse.text();
          
          // Check for Content-Type errors specifically
          if (details.includes('unsupported_content_type') || details.includes('Content-Type')) {
            console.error("[openai:sora] Content-Type error - Headers sent:", {
              contentType: requestHeaders['Content-Type'],
              allHeaders: Object.keys(requestHeaders),
              headerValues: Object.entries(requestHeaders).map(([key, value]) => ({
                key,
                value: key === 'Authorization' ? 'Bearer ***' : value,
              })),
            });
          }
          
          console.error("[openai:sora] API error creating job:", {
            status: createResponse.status,
            statusText: createResponse.statusText,
            details: details.substring(0, 500),
          });
          throw new ProviderRequestError("openai", details);
        }

        const jobData = await createResponse.json();
        const jobId = jobData.id;
        
        if (!jobId) {
          throw new ProviderRequestError("openai", "No job ID in response. Response: " + JSON.stringify(jobData));
        }

        console.log("[openai:sora] Video generation job created:", {
          jobId,
          status: jobData.status || "pending",
        });

        // Step 2: Poll for job completion
        const pollUrl = `${baseUrl}/videos/${jobId}`;
        let pollAttempts = 0;
        const maxPollAttempts = 450; // 15 minutes / 2 seconds = 450 attempts
        const initialPollInterval = 2000; // Start with 2 seconds
        let pollInterval = initialPollInterval;

        while (true) {
          // Check timeout
          if (Date.now() - startTime > TIMEOUT_MS) {
            throw new ProviderRequestError(
              "openai",
              `Video generation timeout after ${TIMEOUT_MS / 1000 / 60} minutes. Job ID: ${jobId}`
            );
          }

          // Wait before polling (except first attempt)
          if (pollAttempts > 0) {
            await new Promise(resolve => setTimeout(resolve, pollInterval));
            // Exponential backoff: increase interval gradually, max 10 seconds
            pollInterval = Math.min(pollInterval * 1.1, 10000);
          }

          pollAttempts++;
          
          if (pollAttempts > maxPollAttempts) {
            throw new ProviderRequestError(
              "openai",
              `Video generation exceeded maximum polling attempts (${maxPollAttempts}). Job ID: ${jobId}`
            );
          }

          const pollResponse = await fetch(pollUrl, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${providerConfig.apiKey}`,
              ...(providerConfig.organizationId && { "OpenAI-Organization": providerConfig.organizationId }),
            },
          });

          if (!pollResponse.ok) {
            const errorDetails = await pollResponse.text();
            console.error("[openai:sora] Polling error:", {
              status: pollResponse.status,
              statusText: pollResponse.statusText,
              details: errorDetails.substring(0, 500),
            });
            throw new ProviderRequestError("openai", `Failed to poll job status: ${errorDetails}`);
          }

          const pollData = await pollResponse.json();
          const status = pollData.status;

          console.log(`[openai:sora] Poll attempt ${pollAttempts}:`, {
            jobId,
            status,
            elapsed: Math.round((Date.now() - startTime) / 1000) + "s",
          });

          if (status === "completed") {
            // According to Sora API docs, we need to call /content endpoint to get the video
            // The job status response doesn't include a video URL - we must download it
            console.log("[openai:sora] Job completed, downloading video content from /content endpoint...");
            
            const contentUrl = `${baseUrl}/videos/${jobId}/content`;
            const contentResponse = await fetch(contentUrl, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${providerConfig.apiKey}`,
                ...(providerConfig.organizationId && { "OpenAI-Organization": providerConfig.organizationId }),
              },
            });

            if (!contentResponse.ok) {
              const errorDetails = await contentResponse.text();
              throw new ProviderRequestError("openai", `Failed to download video content: ${errorDetails}`);
            }

            // The /content endpoint returns the video file directly as a stream
            // Download it as a buffer
            const videoBuffer = Buffer.from(await contentResponse.arrayBuffer());
            const contentType = contentResponse.headers.get("content-type") || "video/mp4";
            const contentLength = contentResponse.headers.get("content-length");
            
            // Calculate cost based on duration and resolution
            const duration = Number(payload.duration);
            const resolution = payload.resolution as string;
            const isHighRes = resolution.includes("1024") || resolution.includes("1792");
            const pricePerSecond = modelConfig.name === "sora-2-pro" 
              ? (isHighRes ? 0.50 : 0.30) 
              : 0.10;
            const totalCost = duration * pricePerSecond;

            console.log("[openai:sora] Video downloaded successfully:", {
              jobId,
              videoSize: `${(videoBuffer.length / 1024 / 1024).toFixed(2)}MB`,
              contentType,
              cost: totalCost,
              totalTime: Math.round((Date.now() - startTime) / 1000) + "s",
            });

            // Return the video buffer in the output
            // The route handler will check for videoBuffer and upload it directly
            return {
              provider: "openai",
              model: modelConfig.name,
              output: {
                videoBuffer: videoBuffer, // Include buffer for direct upload
                fileName: `video_${jobId}.mp4`,
                fileSize: videoBuffer.length,
                contentType: contentType,
              },
              usage: {
                totalCostUsd: totalCost,
                unit: "seconds",
              },
              rawResponse: pollData,
            };
          } else if (status === "failed" || status === "cancelled") {
            const errorMessage = pollData.error?.message || pollData.error || "Video generation failed";
            throw new ProviderRequestError("openai", `Video generation ${status}: ${errorMessage}`);
          } else if (status === "pending" || status === "processing" || status === "in_progress") {
            // Continue polling
            continue;
          } else {
            // Unknown status
            console.warn("[openai:sora] Unknown job status:", status);
            // Continue polling but log warning
            continue;
          }
        }
      } catch (error) {
        if (error instanceof ProviderRequestError) {
          throw error;
        }
        if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND'))) {
          throw new ProviderRequestError(
            "openai",
            `Network error: ${error.message}. This may occur if OpenAI finished processing but the connection was interrupted.`
          );
        }
        throw error;
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // TEXT GENERATION (Existing logic - GPT models)
    // ═══════════════════════════════════════════════════════════════════════════
    const url = `${baseUrl}/responses`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${providerConfig.apiKey}`,
    };

    if (providerConfig.organizationId) {
      headers["OpenAI-Organization"] = providerConfig.organizationId;
    }

    const basePayload: Record<string, unknown> = {
      model: modelConfig.name,
      ...request.payload,
    };

    if (request.cache?.key) {
      basePayload.prompt_cache_key = request.cache.key;
    }

    if (request.cache?.retention === "24h") {
      basePayload.prompt_cache_retention = request.cache.retention;
    }

    const body = JSON.stringify(basePayload);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dce8bcc2-d9cf-48dc-80b9-5e2289140a64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:68',message:'Request body being sent to OpenAI',data:{url,body:body.substring(0,2000),payloadKeys:Object.keys(basePayload),inputStructure:basePayload.input?JSON.stringify(basePayload.input).substring(0,500):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // ═══════════════════════════════════════════════════════════════════════════
    // ADD TIMEOUT FOR FETCH (10 minutes for long-running requests with reasoning)
    // ═══════════════════════════════════════════════════════════════════════════
    const controller = new AbortController();
    const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: controller.signal, // Add abort signal for timeout
      });

      // Clear timeout immediately when response is received (no delay)
      clearTimeout(timeoutId);

      if (!response.ok) {
        const details = await response.text();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/dce8bcc2-d9cf-48dc-80b9-5e2289140a64',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'openai.ts:77',message:'OpenAI API error response',data:{status:response.status,statusText:response.statusText,details,bodyPreview:body.substring(0,1000)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        throw new ProviderRequestError("openai", details);
      }

      // Process response immediately when received (no delay)
      const data = await response.json();
      const output = extractOutputText(data) ?? data.output ?? data;

      return {
        provider: "openai",
        model: modelConfig.name,
        output,
        rawResponse: data,
        usage: data.usage
          ? {
              inputTokens: data.usage.input_tokens,
              outputTokens: data.usage.output_tokens,
              reasoningTokens: data.usage.reasoning_tokens,
              cachedTokens: data.usage.prompt_tokens_details?.cached_tokens,
            }
          : undefined,
      };
    } catch (error) {
      // Clear timeout on error
      clearTimeout(timeoutId);
      
      // Handle timeout specifically
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderRequestError(
          "openai",
          `Request timeout after ${TIMEOUT_MS / 1000 / 60} minutes. The request may have completed on OpenAI's side but the response was not received in time.`
        );
      }
      
      // Handle network errors
      if (error instanceof Error && (error.message.includes('fetch failed') || error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND'))) {
        throw new ProviderRequestError(
          "openai",
          `Network error: ${error.message}. This may occur if OpenAI finished processing but the connection was interrupted.`
        );
      }
      
      // Re-throw other errors (including ProviderRequestError)
      throw error;
    }
  },
};

registerProvider(openAiAdapter);

export { openAiAdapter };


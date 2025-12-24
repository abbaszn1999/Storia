Seedance 1.0 Pro
ByteDance's Seedance 1.0 Pro model represents the flagship professional-grade video generation solution with cinematic storytelling capabilities, multi-shot support, and high-resolution output up to 1080p.

Model AIR ID: bytedance:2@1.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-3000 characters.
Supported dimensions: 864×480 (16:9), 736×544 (4:3), 640×640 (1:1), 544×736 (3:4), 480×864 (9:16), 416×960 (9:21), 960×416 (21:9), 1920×1088 (16:9), 1664×1248 (4:3), 1440×1440 (1:1), 1248×1664 (3:4), 1088×1920 (9:16), 928×2176 (9:21), 2176×928 (21:9).
Frame rate: 24 FPS.
Duration: 1.2 to 12 seconds in 0.1 second increments (default: 5).
Frame images: Supports first and last frame for frameImages.
Input image requirements: Width and height between 300-6000 pixels, 10MB file size limit.
Provider-specific settings:

Parameters supported: cameraFixed.

{
  "taskType": "videoInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d1",
  "model": "bytedance:2@1",
  "positivePrompt": "Cinematic multi-shot sequence: close-up of a coffee cup, camera pulls back to reveal a busy café, then cuts to street view through window",
  "duration": 10,
  "width": 1920,
  "height": 1088,
  "providerSettings": {
    "bytedance": {
      "cameraFixed": false
    }
  }
}

{
  "taskType": "videoInference",
  "taskUUID": "b8c4d952-7f27-4a6e-bc9a-83f01d1c6d59",
  "model": "bytedance:2@1",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    }
  ],
  "duration": 5,
  "width": 1440,
  "height": 1440,
  "providerSettings": {
    "bytedance": {
      "cameraFixed": true
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


Seedance 1.5 Pro
ByteDance's Seedance 1.5 Pro represents the next generation of AI video generation with native synchronized audio capabilities. This model generates cinematic videos directly from text or image inputs with precise audio-visual timing, strong motion coherence, expressive camera control, and advanced narrative prompt handling for professional short video creation.

Model AIR ID: bytedance:seedance@1.5-pro.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-3000 characters.
Supported dimensions:
480p: 864×496 (16:9), 752×560 (4:3), 640×640 (1:1), 560×752 (3:4), 496×864 (9:16), 992×432 (21:9).
720p: 1280×720 (16:9), 1112×834 (4:3), 960×960 (1:1), 834×1112 (3:4), 720×1280 (9:16), 1470×630 (21:9).
Dimension behavior:
Text-to-video: Specify explicit width and height from the supported dimensions above.
Image-to-video: Two options available:
Specify width and height explicitly for precise control.
Use resolution parameter (480p or 720p) to automatically match the aspect ratio from the first frame image.
Frame rate: 24 FPS.
Duration: 4-12 seconds, or "auto" to let the model select optimal length within range (default: 5).
Frame images: Supports first and last frame for frameImages.
Input image requirements: Width and height between 300-6000 pixels, 10MB file size limit.
Audio generation: Native synchronized audio support.
Provider-specific settings:

Parameters supported: cameraFixed, audio.

{
  "taskType": "videoInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d7",
  "model": "bytedance:seedance@1.5-pro",
  "positivePrompt": "A musician playing acoustic guitar in a cozy coffee shop, ambient conversations and coffee machine sounds in background",
  "duration": 8,
  "width": 1280,
  "height": 720,
  "providerSettings": {
    "bytedance": {
      "audio": true,
      "cameraFixed": false
    }
  }
}
{
  "taskType": "videoInference",
  "taskUUID": "b8c4d952-7f27-4a6e-bc9a-83f01d1c6d63",
  "model": "bytedance:seedance@1.5-pro",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    },
    {
      "inputImage": "24351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "last"
    }
  ],
  "positivePrompt": "Character begins speaking with synchronized lip movements and natural ambient sound",
  "duration": 6,
  "resolution": "720p",
  "providerSettings": {
    "bytedance": {
      "audio": true,
      "cameraFixed": true
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


KlingAI 2.1 Pro
KlingAI's 2.1 Pro model unlocks higher frame fidelity and Full HD output, providing a middle ground between Standard and Master tiers.

Model AIR ID: klingai:5@2.

Supported workflows: Image-to-video.

Technical specifications:

CFG Scale: 0-1 (default: 0.5).
Supported dimensions: 1920×1080 (16:9), 1080×1080 (1:1), 1080×1920 (9:16).
Frame rate: 24 FPS.
Duration: 5 or 10 seconds.
Frame images: Supports first and last frame for frameImages.
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
KlingAI 2.1 Pro supports image-to-video generation only and does not support text-to-video workflows.

{
  "taskType": "videoInference",
  "taskUUID": "f3a2b8c9-1e47-4d3a-9b2f-8c7e6d5a4b3c",
  "model": "klingai:5@2",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    }
  ],
  "duration": 5,
  "width": 1920,
  "height": 1080
}

--------------------------------------------------------------------------------------------------------------------------


KlingAI 2.5 Turbo Pro
KlingAI's 2.5 Turbo Pro model delivers next-level creativity with turbocharged motion and cinematic visuals, featuring precise prompt adherence for both text-to-video and image-to-video workflows. This model combines enhanced motion fluidity with professional-grade cinematic capabilities.

Model AIR ID: klingai:6@1.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-2500 characters.
Negative prompt: 2-2500 characters (optional).
CFG Scale: 0-1 (default: 0.5).
Supported dimensions: 1280×720 (16:9), 720×720 (1:1), 720×1280 (9:16).
Frame rate: 30 FPS.
Duration: 5 or 10 seconds.
Frame images: Supports first and last frame for frameImages.
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
{
  "taskType": "videoInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d2",
  "model": "klingai:6@1",
  "positivePrompt": "Cinematic aerial drone shot following a motorcycle racing through winding mountain roads at golden hour",
  "duration": 10,
  "width": 1280,
  "height": 720
}
{
  "taskType": "videoInference",
  "taskUUID": "b8c4d952-7f27-4a6e-bc9a-83f01d1c6d60",
  "model": "klingai:6@1",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    }
  ],
  "duration": 5
}

--------------------------------------------------------------------------------------------------------------------------


Kling VIDEO 2.6 Pro
Kling VIDEO 2.6 Pro is a next-generation video-and-audio AI model that delivers cinematic-quality visuals and native synchronized audio including dialogue, sound effects, and ambience. This model combines strong prompt fidelity with scene consistency, flexible artistic control, custom voice cloning, and motion control capabilities for professional video production workflows.

Model AIR ID: klingai:kling-video@2.6-pro.

Supported workflows: Text-to-video, image-to-video, motion-control.

Technical specifications:

Positive prompt: 2-2500 characters.
Negative prompt: 2-2500 characters (optional).
CFG Scale: 0-1 (default: 0.5).
Supported dimensions: 1920×1080 (16:9), 1080×1080 (1:1), 1080×1920 (9:16).
Dimension behavior:
Text-to-video: Specify explicit width and height from the supported dimensions above.
Image-to-video: Dimensions are automatically inferred from the reference image.
Duration: 5 or 10 seconds (default: 5).
Frame images: Supports first frame for inputs.frameImages.
Reference voices: Supports multiple audio files via inputs.referenceVoices (MP3, WAV, MP4, MOV formats; 5-30 seconds duration; clean, single-speaker audio required).
Reference videos: Supports 1 video via inputs.referenceVideos for motion control (3-30 seconds duration; max 100MB; min 340px short edge, max 3850px long edge).
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
Provider-specific settings:

Parameters supported: sound, keepOriginalSound, characterOrientation.

{
  "taskType": "videoInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d4",
  "model": "klingai:kling-video@2.6-pro",
  "positivePrompt": "A bustling city street at night with people talking and traffic sounds",
  "duration": 10,
  "width": 1920,
  "height": 1080,
  "providerSettings": {
    "klingai": {
      "sound": true
    }
  }
}

{
  "taskType": "videoInference",
  "taskUUID": "b8c4d952-7f27-4a6e-bc9a-83f01d1c6d63",
  "model": "klingai:kling-video@2.6-pro",
  "inputs": {
    "frameImages": [
      {
        "image": "c64351d5-4c59-42f7-95e1-eace013eddab",
        "frame": "first"
      }
    ]
  },
  "positivePrompt": "Bring this scene to life with natural motion and ambient sounds",
  "duration": 5,
  "providerSettings": {
    "klingai": {
      "sound": true
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


Kling VIDEO O1
Kling VIDEO O1 is a unified multimodal video foundation model designed for high-control video workflows that merge generation with instruction-based editing and visual reference compositing. It allows creators to direct pacing, transitions, objects, and style revisions through natural language without switching tools.

Model AIR ID: klingai:kling@o1.

Supported workflows: Text-to-video, image-to-video, reference-to-video, video-edit.

Technical specifications:

Positive prompt: 2-2500 characters.
Supported dimensions: 1920×1080 (16:9), 1080×1080 (1:1), 1080×1920 (9:16) (only text-to-video).
Duration:
Text-to-video: 5 or 10 seconds (default: 5).
Image-to-video: 5 or 10 seconds (default: 5).
Reference-to-video: 3-10 seconds (default: 5).
Video-edit: Matches input video duration (3-10 seconds, 6-20 seconds for fast mode).
Frame images: Supports first and last frame for inputs.frameImages (image-to-video only).
Reference images:
Reference-to-video: 1-7 images via inputs.referenceImages (at least 1 required).
Video-edit: Supports up to 4 images via inputs.referenceImages (optional).
Reference videos: Supports inputs.referenceVideos with 1 video (reference-to-video only).
Input video: Supports inputs.video with 3-10 second clips (6-20 seconds for fast mode, video-edit only).
Input requirements: 32MB file size limit.
Provider-specific settings:

Parameters supported: keepOriginalSound, fast.

Kling O1 automatically determines the workflow based on provided inputs: referenceImages or referenceVideos trigger reference-to-video, frameImages triggers image-to-video, inputs.video triggers video editing, and no inputs triggers text-to-video generation.

{
  "taskType": "videoInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d3",
  "model": "klingai:kling@o1",
  "positivePrompt": "A serene mountain landscape at sunrise with mist rolling through valleys",
  "duration": 5,
  "width": 1920,
  "height": 1080
}

{
  "taskType": "videoInference",
  "taskUUID": "b8c4d952-7f27-4a6e-bc9a-83f01d1c6d62",
  "model": "klingai:kling@o1",
  "inputs": {
    "frameImages": [
      {
        "image": "c64351d5-4c59-42f7-95e1-eace013eddab",
        "frame": "first"
      }
    ]
  },
  "positivePrompt": "Camera slowly zooms into the scene with smooth motion",
  "duration": 10
}

--------------------------------------------------------------------------------------------------------------------------


Veo 3
Google's Veo 3 model represents Google's latest video generation technology, featuring native audio generation that creates synchronized dialogue, music, and sound effects alongside high-fidelity video content.

Model AIR ID: google:3@0.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-3000 characters.
Supported dimensions: 1280×720 (16:9), 720×1280 (9:16), 1920×1080 (16:9), 1080×1920 (9:16).
Frame rate: 24 FPS.
Duration: 8 seconds.
Frame images: Supports first frame for frameImages.
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
Provider-specific parameters supported: generateAudio.

In Veo 3, enhancePrompt is always enabled and cannot be disabled.

{
  "taskType": "videoInference",
  "taskUUID": "f3a2b8c9-1e47-4d3a-9b2f-8c7e6d5a4b3c",
  "model": "google:3@0",
  "positivePrompt": "Ocean waves crashing against rocky cliffs during a storm",
  "duration": 8,
  "width": 1280,
  "height": 720,
  "providerSettings": {
    "google": {
      "generateAudio": true
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


Veo 3 Fast
Google's Veo 3 Fast model represents a faster and more cost-effective variant of Veo 3, optimized for speed and affordability while maintaining native audio generation capabilities.

Model AIR ID: google:3@1.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-3000 characters.
Supported dimensions: 1280×720 (16:9), 720×1280 (9:16), 1920×1080 (16:9), 1080×1920 (9:16).
Frame rate: 24 FPS.
Duration: 8 seconds.
Frame images: Supports first and last frame for frameImages.
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
Provider-specific parameters supported: generateAudio.

In Veo 3, enhancePrompt is always enabled and cannot be disabled.

{
  "taskType": "videoInference",
  "taskUUID": "f3a2b8c9-1e47-4d3a-9b2f-8c7e6d5a4b3c",
  "model": "google:3@1",
  "positivePrompt": "Fast-paced street scene with cars and pedestrians, urban ambient sounds",
  "duration": 8,
  "width": 1280,
  "height": 720,
  "providerSettings": {
    "google": {
      "generateAudio": true
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


Veo 3.1
Google's newest Veo model for cinematic video generation, capable of turning images or text into realistic, story-driven scenes with natural sound and smooth motion.

Model AIR ID: google:3@2.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-3000 characters.
Supported dimensions: 1280×720 (16:9), 720×1280 (9:16), 1920×1080 (16:9), 1080×1920 (9:16).
Frame rate: 24 FPS.
Duration: 8 seconds.
Frame images: Supports first and last frame for frameImages.
Reference images: Supports inputs.references with typed image roles (asset or style).
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
Video extension: Supports extending videos by 7 seconds via inputs.video (input video max 30 seconds, 1280×720 or 720×1280 only, 24 FPS only). When extending videos, positivePrompt and duration: 7 are required and width/height must not be specified.
Provider-specific parameters supported: generateAudio.

Reference image constraints: When using reference images, only 16:9 aspect ratio (1280×720 or 720×1280) and 8-second duration are supported. You can use up to 3 asset images or 1 style image, but cannot mix image types. Reference images cannot be used together with frame images.

In Veo 3.1, enhancePrompt is always enabled and cannot be disabled.

{
  "taskType": "videoInference",
  "taskUUID": "f3a2b8c9-1e47-4d3a-9b2f-8c7e6d5a4b3d",
  "model": "google:3@2",
  "positivePrompt": "Cinematic shot of a person walking through a rain-soaked city street at night",
  "duration": 8,
  "width": 1280,
  "height": 720,
  "providerSettings": {
    "google": {
      "generateAudio": true
    }
  }
}

{
  "taskType": "videoInference",
  "taskUUID": "e4d3c2b1-5a6f-4c8e-b2d7-1f0e9d8c7b6b",
  "model": "google:3@2",
  "positivePrompt": "Animate this product with smooth 360-degree rotation",
  "duration": 8,
  "width": 1280,
  "height": 720,
  "inputs": {
    "references": [
      { "image": "c64351d5-4c59-42f7-95e1-eace013eddab", "type": "asset" }
    ]
  }
}

{
  "taskType": "videoInference",
  "taskUUID": "b2c3d4e5-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
  "model": "google:3@2",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    },
    {
      "inputImage": "d7e8f9a0-2b5c-4e7f-a1d3-9c8b7a6e5d4f",
      "frame": "last"
    }
  ],
  "positivePrompt": "Smooth transition between the two scenes",
  "duration": 8,
  "width": 1280,
  "height": 720
}

--------------------------------------------------------------------------------------------------------------------------


Veo 3.1 Fast
Optimized variant of Veo 3.1 for high-speed generation, balancing cinematic quality with ultra-low latency and rapid creative iteration.

Model AIR ID: google:3@3.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-3000 characters.
Supported dimensions: 1280×720 (16:9), 720×1280 (9:16), 1920×1080 (16:9), 1080×1920 (9:16).
Frame rate: 24 FPS.
Duration: 8 seconds.
Frame images: Supports first and last frame for frameImages.
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
Video extension: Supports extending videos by 7 seconds via inputs.video (input video max 30 seconds, 1280×720 or 720×1280 only, 24 FPS only). When extending videos, positivePrompt and duration: 7 are required and width/height must not be specified.
Provider-specific parameters supported: generateAudio.

In Veo 3.1, enhancePrompt is always enabled and cannot be disabled.

{
  "taskType": "videoInference",
  "taskUUID": "f3a2b8c9-1e47-4d3a-9b2f-8c7e6d5a4b3e",
  "model": "google:3@3",
  "positivePrompt": "Quick cut of a bustling marketplace with vendors and shoppers",
  "duration": 8,
  "width": 1280,
  "height": 720,
  "providerSettings": {
    "google": {
      "generateAudio": true
    }
  }
}

{
  "taskType": "videoInference",
  "taskUUID": "e4d3c2b1-5a6f-4c8e-b2d7-1f0e9d8c7b6c",
  "model": "google:3@3",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    },
    {
      "inputImage": "d7e8f9a0-2b5c-4e7f-a1d3-9c8b7a6e5d4f",
      "frame": "last"
    }
  ],
  "positivePrompt": "Fast-paced animation between the two frames",
  "duration": 8,
  "width": 720,
  "height": 1280
}

--------------------------------------------------------------------------------------------------------------------------


PixVerse v5.5
PixVerse v5.5 advances video storytelling with multi-image fusion for maintaining character consistency across sequences. The model introduces comprehensive audio generation that includes background music, sound effects, and dialogue, alongside multi-shot camera control for dynamic cinematography.

Model AIR ID: pixverse:1@6.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-2048 characters.
Negative prompt: 2-2048 characters (optional).
Supported dimensions:
360p: 640×360 (16:9), 480×360 (4:3), 360×360 (1:1), 360×480 (3:4), 360×640 (9:16).
540p: 960×540 (16:9), 720×540 (4:3), 540×540 (1:1), 540×720 (3:4), 540×960 (9:16).
720p: 1280×720 (16:9), 960×720 (4:3), 720×720 (1:1), 720×960 (3:4), 720×1280 (9:16).
1080p: 1920×1080 (16:9), 1440×1080 (4:3), 1080×1080 (1:1), 1080×1440 (3:4), 1080×1920 (9:16).
Duration: 5, 8, or 10 seconds (default: 5, 10 seconds unavailable at 1080p).
Frame images: Supports first and last frame for frameImages.
Input image requirements: Width and height between 300-4000 pixels, 20MB file size limit.
Provider-specific settings:

Parameters supported: style, audio, multiClip, thinking.

{
  "taskType": "videoInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d483",
  "model": "pixverse:1@6",
  "positivePrompt": "A cinematic scene of a character walking through a busy marketplace, with ambient sounds and dialogue",
  "duration": 10,
  "width": 1280,
  "height": 720,
  "providerSettings": {
    "pixverse": {
      "style": "3d_animation",
      "audio": true,
      "thinking": "auto"
    }
  }
}
{
  "taskType": "videoInference",
  "taskUUID": "6ba7b828-9dad-11d1-80b4-00c04fd430c8",
  "model": "pixverse:1@6",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    }
  ],
  "positivePrompt": "A dynamic sequence with push-in shots, camera switching, and scale changes",
  "duration": 8,
  "width": 1920,
  "height": 1080,
  "providerSettings": {
    "pixverse": {
      "multiClip": true,
      "audio": true
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


Hailuo 2.3
Built for cinematic storytelling and expressive motion, MiniMax Hailuo 2.3 transforms text or images into visually rich videos with lifelike human physics and precise prompt adherence. It delivers fluid movement and emotional realism with consistent scene composition, ideal for creators seeking artistry and technical polish.

Model AIR ID: minimax:4@1.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-2000 characters (optional when using frameImages).
Supported dimensions: 1366×768 (16:9), 1920×1080 (16:9).
Frame rate: 25 FPS.
Duration: 6 or 10 seconds (1366×768, default: 6), 6 seconds (1920×1080).
Frame images: Supports first frame for frameImages.
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
Provider-specific settings:

Parameters supported: promptOptimizer.

{
  "taskType": "videoInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d2",
  "model": "minimax:4@1",
  "positivePrompt": "Cinematic aerial shot of a coastal cliff at sunset with crashing waves",
  "duration": 10,
  "width": 1366,
  "height": 768,
  "providerSettings": {
    "minimax": {
      "promptOptimizer": true
    }
  }
}

{
  "taskType": "videoInference",
  "taskUUID": "b8c4d952-7f27-4a6e-bc9a-83f01d1c6d60",
  "model": "minimax:4@1",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    }
  ],
  "positivePrompt": "Bring the scene to life with natural movement and atmospheric depth",
  "duration": 10,
  "width": 1366,
  "height": 768
}

--------------------------------------------------------------------------------------------------------------------------


Sora 2 Pro
Higher-quality variant of Sora 2 with additional resolution options, refined control, and better consistency for demanding professional use cases.

Model AIR ID: openai:3@2.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 1-4000 characters.
Frame images: Supports first frame for frameImages. The input image dimensions determine the output video dimensions and must match one of the supported dimensions.
Supported dimensions: 1280×720 (16:9), 720×1280 (9:16), 1792×1024 (7:4), 1024×1792 (4:7).
Duration: 4, 8, or 12 seconds.
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
{
  "taskType": "videoInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d493",
  "model": "openai:3@2",
  "positivePrompt": "Cinematic aerial shot of a coastal landscape with waves crashing against cliffs, photorealistic detail",
  "duration": 12,
  "width": 1792,
  "height": 1024
}

{
  "taskType": "videoInference",
  "taskUUID": "6ba7b832-9dad-11d1-80b4-00c04fd430c8",
  "model": "openai:3@2",
  "frameImages": [
    { "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab" }
  ],
  "positivePrompt": "Smooth camera movement revealing the scene with cinematic quality",
  "duration": 8,
  "width": 1024,
  "height": 1792
}

--------------------------------------------------------------------------------------------------------------------------


LTX-2 Pro
Professional edition of LTX-2 built for cinematic video creation. It focuses on realistic motion and precise lighting control, giving creators full command over pacing and atmosphere.

Model AIR ID: lightricks:2@0.

Supported workflows: Text-to-video, image-to-video.

Technical specifications:

Positive prompt: 2-10000 characters.
No seed support.
Supported dimensions:
1080p: 1920×1080 (16:9).
1440p: 2560×1440 (16:9).
2160p (4K): 3840×2160 (16:9).
Frame rate: 25 or 50 FPS (Default: 25).
Duration: 6, 8 or 10 seconds (default: 6).
Frame images: Supports first frame for frameImages.
Input image requirements: Maximum 7MB file size.
Provider-specific settings:

Parameters supported: generateAudio.

{
  "taskType": "videoInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d492",
  "model": "lightricks:2@0",
  "positivePrompt": "A cinematic tracking shot of a character walking through a rain-soaked city street at night, neon lights reflecting in puddles",
  "duration": 8,
  "width": 1920,
  "height": 1080,
  "providerSettings": {
    "lightricks": {
      "generateAudio": true
    }
  }
}
{
  "taskType": "videoInference",
  "taskUUID": "6ba7b831-9dad-11d1-80b4-00c04fd430c8",
  "model": "lightricks:2@0",
  "frameImages": [
    {
      "inputImage": "c64351d5-4c59-42f7-95e1-eace013eddab",
      "frame": "first"
    }
  ],
  "positivePrompt": "Camera slowly pushes in as dramatic lighting illuminates the scene",
  "duration": 6,
  "width": 3840,
  "height": 1440
}

--------------------------------------------------------------------------------------------------------------------------

Runway Gen-4 Turbo
Runway’s Gen-4 Turbo is a high-speed image-to-video model built for instant creative experimentation. It produces dynamic, cinematic motion with exceptional fluidity and detail, transforming a single image into a fully realized video in seconds.

Model AIR ID: runway:1@1.

Supported workflows: Image-to-video.

Technical specifications:

Positive prompt: 1-1000 characters (optional).
Supported dimensions: 1280×720 (16:9), 720×1280 (9:16), 1104×832, 832×1104, 960×960 (1:1), 1584×672 (21:9).
Duration: 2-10 seconds (default: 10).
Frame images: Supports first frame for inputs.frameImages (required).
Input image requirements: 20MB file size limit.
Provider-specific settings:

Parameters supported: contentModeration.publicFigureThreshold.

{
  "taskType": "videoInference",
  "taskUUID": "6ba7b829-9dad-11d1-80b4-00c04fd430c8",
  "model": "runway:1@1",
  "inputs": {
    "frameImages": [
      {
        "image": "c64351d5-4c59-42f7-95e1-eace013eddab",
        "frame": "first"
      }
    ],
    "positivePrompt": "The scene comes to life with dynamic movement",
    "duration": 10,
    "width": 1280,
    "height": 720
  }
}

--------------------------------------------------------------------------------------------------------------------------


Wan2.6
Alibaba's Wan2.6 model delivers multimodal video generation with native audio support and multi-shot sequencing capabilities. This model emphasizes temporal stability, consistent visual structure across shots, and reliable alignment between visuals and audio for short-form narrative video production.

Model AIR ID: alibaba:wan@2.6.

Supported workflows: Text-to-video, image-to-video, reference-to-video.

Technical specifications:

Positive prompt: 1-1500 characters (supports English and Chinese).
Negative prompt: 1-500 characters (optional).
Frame images: Supports first frame via inputs.frameImages (image-to-video only).
Reference videos: Supports up to 3 videos via inputs.referenceVideos (reference-to-video only).
Audio input: Supports custom audio via inputs.audio.
Supported dimensions:
720p: 1280×720 (16:9), 720×1280 (9:16), 960×960 (1:1), 1088×832 (17:13), 832×1088 (13:17).
1080p: 1920×1080 (16:9), 1080×1920 (9:16), 1440×1440 (1:1), 1632×1248 (17:13), 1248×1632 (13:17).
Dimension behavior:
Text-to-video: Specify explicit width and height from the supported dimensions above.
Image-to-video: Two options available:
Specify width and height explicitly for precise control.
Use resolution parameter (720p or 1080p) to automatically match the aspect ratio from the first frame image.
Duration: 5, 10, or 15 seconds (default: 5).
Input image requirements: 360-2000 pixels, 10MB file size limit.
Reference video requirements: Maximum 30MB per video.
Audio requirements: WAV/MP3, 3-30 seconds duration, 15MB file size limit.
Reference videos cannot be used together with frame images. Choose either image-to-video or reference-to-video workflow.

Provider-specific settings:

Parameters supported: promptExtend, audio, shotType.

{
  "taskType": "videoInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d7",
  "model": "alibaba:wan@2.6",
  "positivePrompt": "A cinematic chase through a rain-soaked city, opening with a wide street shot, cutting to a close-up of footsteps splashing through puddles, followed by an overhead tracking shot",
  "duration": 10,
  "width": "1920",
  "height": "1080",
  "providerSettings": {
    "alibaba": {
      "promptExtend": true,
      "audio": true,
      "shotType": "multi"
    }
  }
}

{
  "taskType": "videoInference",
  "taskUUID": "6ba7b833-9dad-11d1-80b4-00c04fd430c8",
  "model": "alibaba:wan@2.6",
  "inputs": {
    "frameImages": ["c64351d5-4c59-42f7-95e1-eace013eddab"]
  },
  "positivePrompt": "The scene comes alive with gentle movement and atmospheric effects",
  "duration": 5,
  "resolution": "720p",
  "providerSettings": {
    "alibaba": {
      "audio": true
    }
  }
}
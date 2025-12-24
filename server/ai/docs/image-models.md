GPT Image 1
OpenAI's GPT Image 1 model leverages GPT-4o architecture to deliver high-fidelity images with enhanced prompt following, superior text rendering, and advanced multimodal capabilities, including precise inpainting and image editing.

Model AIR ID: openai:1@1.

Supported workflows: Text-to-image, image-to-image.

Technical specifications:

Positive prompt: 1-32000 characters.
Supported dimensions: 1024×1024, 1536×1024, 1024×1536.
Reference images: Supports up to 16 images via referenceImages.
Provider-specific settings:

Parameters supported: quality, background.

{
  "taskType": "imageInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d1",
  "model": "openai:1@1",
  "positivePrompt": "A professional product photograph of a minimalist watch on a clean white surface with subtle reflections and precise typography showing the brand name",
  "width": 1536,
  "height": 1024,
  "providerSettings": {
    "openai": {
      "quality": "high",
      "background": "opaque"
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


GPT Image 1.5
OpenAI's GPT Image 1.5 represents the newest flagship image model powering ChatGPT Images, delivering significantly faster generation with enhanced instruction following and more precise edits that preserve original details. This model excels at believable transformations, improved rendering of dense or small text, and detailed design tasks, making it ideal for practical creative workflows and production use cases.

Model AIR ID: openai:4@1.

Supported workflows: Text-to-image, image-to-image, image-editing.

Technical specifications:

Positive prompt: 2-32000 characters.
Supported dimensions: 1024×1024, 1536×1024, 1024×1536.
Reference images: Supports up to 16 images via referenceImages.
Provider-specific settings:

Parameters supported: quality, background.

{
  "taskType": "imageInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d6",
  "model": "openai:4@1",
  "positivePrompt": "A professional product photograph featuring intricate typography and detailed small text, rendered with perfect clarity and precision",
  "width": 1536,
  "height": 1024,
  "providerSettings": {
    "openai": {
      "quality": "high",
      "background": "opaque"
    }
  }
}

{
  "taskType": "imageInference",
  "taskUUID": "550e8400-e29b-41d4-a716-446655440014",
  "model": "openai:4@1",
  "inputs": {
    "referenceImages": [
      "c64351d5-4c59-42f7-95e1-eace013eddab"
    ]
  },
  "positivePrompt": "Combine these elements into a cohesive design with enhanced instruction following and faster generation",
  "width": 1024,
  "height": 1536,
  "providerSettings": {
    "openai": {
      "quality": "auto",
      "background": "transparent"
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


Runway Gen-4 Image
Runway's Gen-4 Image is a high-fidelity text-to-image model offering advanced stylistic control and visual consistency across scenes and characters. Built for professional creative workflows, it delivers exceptional detail and artistic precision with optional reference image support.

Model AIR ID: runway:4@1.

Supported workflows: Text-to-image, image-to-image.

Technical specifications:

Positive prompt: 1-1000 characters (required).
Reference images: Supports up to 3 images via inputs.referenceImages (optional).
Reference tags: Use @tag syntax in prompts to reference specific images. Tags must be 3-16 alphanumeric characters starting with a letter.
Supported dimensions: 1920×1080 (16:9), 1080×1920 (9:16), 1024×1024 (1:1), 1360×768 (~16:9), 1080×1080 (1:1), 1168×880 (~4:3), 1440×1080 (4:3), 1080×1440 (3:4), 1808×768 (~21:9), 2112×912 (~21:9), 1280×720 (16:9), 720×1280 (9:16), 720×720 (1:1), 960×720 (4:3), 720×960 (3:4), 1680×720 (~21:9).
Provider-specific settings:

Parameters supported: contentModeration.

{
  "taskType": "imageInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d493",
  "model": "runway:4@1",
  "positivePrompt": "A cinematic portrait with dramatic lighting and rich color palette",
  "width": 1920,
  "height": 1080
}

{
  "taskType": "imageInference",
  "taskUUID": "6ba7b831-9dad-11d1-80b4-00c04fd430c8",
  "model": "runway:4@1",
  "inputs": {
    "referenceImages": [
      {
        "image": "c64351d5-4c59-42f7-95e1-eace013eddab",
        "tag": "character"
      },
      {
        "image": "d7e8f9a0-2b5c-4e7f-a1d3-9c8b7a6e5d4f",
        "tag": "style"
      }
    ]
  },
  "positivePrompt": "Create a scene with @character in the artistic style of @style",
  "width": 1440,
  "height": 1080
}
--------------------------------------------------------------------------------------------------------------------------


Kling IMAGE O1
Kling IMAGE O1 is a high-control image model built for consistent character handling, precise modification, and strong stylization. It interprets inputs with high accuracy and supports detailed edits without structural drift, enabling stable creative workflows across complex compositions.

Model AIR ID: klingai:kling-image@o1.

Supported workflows: Text-to-image, image-to-image.

Technical specifications:

Positive prompt: 3-2500 characters.
Reference images: Supports up to 10 images via inputs.referenceImages.
Supported dimensions:
1K: 1024×1024 (1:1), 1248×832 (3:2), 832×1248 (2:3), 1168×880 (4:3), 880×1168 (3:4), 768×1360 (9:16), 1360×768 (16:9), 1552×656 (21:9).
2K: 2048×2048 (1:1), 2496×1664 (3:2), 1664×2496 (2:3), 2336×1760 (4:3), 1760×2336 (3:4), 1536×2720 (9:16), 2720×1536 (16:9), 3104×1312 (21:9).
Dimension behavior:
Text-to-image: Requires explicit width and height from the supported dimensions above.
Image-to-image: Two options available:
Specify width and height explicitly for precise control over output dimensions.
Omit width and height to automatically match the aspect ratio from the first reference image, then use the resolution parameter to control the output resolution tier (1k or 2k).
{
  "taskType": "imageInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d492",
  "model": "klingai:kling-image@o1",
  "positivePrompt": "A detailed character portrait with consistent features and strong stylization",
  "width": 1024,
  "height": 1024
}

{
  "taskType": "imageInference",
  "taskUUID": "6ba7b829-9dad-11d1-80b4-00c04fd430c8",
  "model": "klingai:kling-image@o1",
  "inputs": {
    "referenceImages": [
      "c64351d5-4c59-42f7-95e1-eace013eddab"
    ]
  },
  "positivePrompt": "Enhance the character with more detailed clothing and refined features",
  "width": 2048,
  "height": 2048
}

--------------------------------------------------------------------------------------------------------------------------

Nano Banana (Gemini Flash Image 2.5)
Google DeepMind's Gemini Flash Image 2.5, nicknamed "Nano Banana", represents a breakthrough in multimodal AI image generation and editing. This model specializes in rapid, interactive image workflows with sophisticated editing capabilities including prompt-based modifications, multi-image fusion, and conversational editing flows. Built with deep real-world understanding, it enables context-aware edits that go beyond simple aesthetic manipulations.

Model AIR ID: google:4@1.

Supported workflows: Text-to-image, image-to-image.

Technical specifications:

Positive prompt 2-3000 characters.
Reference images: Supports up to 8 images via referenceImages.
Supported dimensions: :
Text-to-image: 1024×1024 (1:1), 1248×832 (3:2), 832×1248 (2:3), 1184×864 (4:3), 864×1184 (3:4), 1152×896 (5:4), 896×1152 (4:5), 1344×768 (16:9), 768×1344 (9:16), 1536×672 (21:9).
Image-to-image: Automatically matches reference image aspect ratio (width/height parameters ignored).
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
Watermarking: Includes invisible SynthID digital watermark on all generated images.
{
  "taskType": "imageInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d484",
  "model": "google:4@1",
  "positivePrompt": "A modern living room with minimalist furniture and natural lighting",
  "width": 1344,
  "height": 768
}

{
  "taskType": "imageInference",
  "taskUUID": "550e8400-e29b-41d4-a716-446655440005",
  "model": "google:4@1",
  "referenceImages": [
    "c64351d5-4c59-42f7-95e1-eace013eddab"
  ],
  "positivePrompt": "Combine these images into a cohesive outdoor scene"
}

--------------------------------------------------------------------------------------------------------------------------


Nano Banana 2 Pro (Gemini 3 Pro Image Preview)
Google DeepMind's Gemini 3 Pro Image Preview, nicknamed "Nano Banana 2 Pro", represents the advanced tier of image generation with professional-grade controls and enhanced reasoning capabilities. This model excels at controlled visual creation with sophisticated handling of lighting, camera angles, aspect ratio control, high-resolution output up to 2K, and advanced text rendering for logos, posters, and diagrams.

Model AIR ID: google:4@2.

Supported workflows: Text-to-image, image-to-image.

Technical specifications:

Positive prompt: 3-45000 characters.
Reference images: Supports up to 14 images via referenceImages.
Supported dimensions:
1K: 1024×1024 (1:1), 1264×848 (3:2), 848×1264 (2:3), 1200×896 (4:3), 896×1200 (3:4), 928×1152 (4:5), 1152×928 (5:4), 768×1376 (9:16), 1376×768 (16:9), 1548×672 or 1584×672 (21:9).
2K: 2048×2048 (1:1), 2528×1696 (3:2), 1696×2528 (2:3), 2400×1792 (4:3), 1792×2400 (3:4), 1856×2304 (4:5), 2304×1856 (5:4), 1536×2752 (9:16), 2752×1536 (16:9), 3168×1344 (21:9).
4K: 4096×4096 (1:1), 5096×3392 or 5056×3392 (3:2), 3392×5096 or 3392×5056 (2:3), 4800×3584 (4:3), 3584×4800 (3:4), 3712×4608 (4:5), 4608×3712 (5:4), 3072×5504 (9:16), 5504×3072 (16:9), 6336×2688 (21:9).
Dimension behavior:
Text-to-image: Requires explicit width and height from the supported dimensions above.
Image-to-image: Two options available:
Specify width and height explicitly for precise control over output dimensions.
Omit width and height to automatically match the aspect ratio from the first reference image, then use the resolution parameter to control the output resolution tier (1k, 2k, or 4k).
Input image requirements: Width and height between 300-2048 pixels, 20MB file size limit.
Watermarking: Includes invisible SynthID digital watermark on all generated images.
{
  "taskType": "imageInference",
  "taskUUID": "6ba7b829-9dad-11d1-80b4-00c04fd430c8",
  "model": "google:4@2",
  "positivePrompt": "Design a music festival poster with text 'SUMMER VIBES 2025', vibrant sunset colors, silhouettes of palm trees, modern typography with clear readable text",
  "width": 1536,
  "height": 672
}

{
  "taskType": "imageInference",
  "taskUUID": "550e8400-e29b-41d4-a716-446655440010",
  "model": "google:4@2",
  "referenceImages": [
    "c64351d5-4c59-42f7-95e1-eace013eddab",
    "d7e8f9a0-2b5c-4e7f-a1d3-9c8b7a6e5d4f",
    "454639ca-4717-4f8b-a031-b593e96b8cd4"
  ],
  "positivePrompt": "Apply the color palette and lighting style from the first image to blend all images into a cohesive autumn landscape scene"
}

--------------------------------------------------------------------------------------------------------------------------

Seedream 4.0
ByteDance's Seedream 4.0 model represents a major leap in multimodal AI image generation, combining ultra-fast 2K/4K rendering with unique sequential image capabilities. The model excels at maintaining character consistency across multiple outputs while supporting complex editing operations through natural language commands, making it particularly valuable for storyboard creation and professional design workflows.

Model AIR ID: bytedance:5@0.

Supported workflows: Text-to-image, image-to-image.

Technical specifications:

Positive prompt: 1-2000 characters.
Reference images: Supports up to 14 images via referenceImages.
Sequential images: Generates multiple related output images (configure with maxSequentialImages).
Combined limit: Reference images + sequential images cannot exceed 15 total.
Supported dimensions:
1K: 1024×1024 (1:1).
2K: 2048×2048 (1:1), 2304×1728 (4:3), 1728×2304 (3:4), 2560×1440 (16:9), 1440×2560 (9:16), 2496×1664 (3:2), 1664×2496 (2:3), 3024×1296 (21:9).
4K: 4096×4096 (1:1), 4608×3456 (4:3), 3456×4608 (3:4), 5120×2880 (16:9), 2880×5120 (9:16), 4992×3328 (3:2), 3328×4992 (2:3), 6048×2592 (21:9).
Provider-specific settings:

Parameters supported: maxSequentialImages.

The model may generate fewer sequential images than requested via maxSequentialImages. The actual number depends on the complexity of the prompt and generation context.

{
  "taskType": "imageInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d483",
  "model": "bytedance:5@0",
  "positivePrompt": "A character walking through different seasons: spring, summer, autumn, winter",
  "width": 1280,
  "height": 720,
  "providerSettings": {
    "bytedance": {
      "maxSequentialImages": 4
    }
  }
}

{
  "taskType": "imageInference",
  "taskUUID": "6ba7b822-9dad-11d1-80b4-00c04fd430c8",
  "model": "bytedance:5@0",
  "referenceImages": ["c64351d5-4c59-42f7-95e1-eace013eddab"],
  "positivePrompt": "Transform this character through different emotional states",
  "width": 2048,
  "height": 2048,
  "providerSettings": {
    "bytedance": {
      "maxSequentialImages": 3
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------


Seedream 4.5
ByteDance's Seedream 4.5 model focuses on production reliability. Previous versions struggled with distant faces becoming distorted and text rendering poorly. This update solves those core issues, shifting from unpredictable results to consistent output. The model handles multi-image fusion better and produces sharp 2K and 4K images suitable for professional work.

Model AIR ID: bytedance:seedream@4.5.

Supported workflows: Text-to-image, image-to-image.

Technical specifications:

Positive prompt: 1-2000 characters.
Reference images: Supports up to 14 images via inputs.referenceImages.
Supported dimensions: Minimum 2560×1440 total pixels (3,686,400), maximum 4096×4096 total pixels (16,777,216), aspect ratio between 1:16 and 16:1.
Recommended 2K: 2048×2048 (1:1), 2304×1728 (4:3), 1728×2304 (3:4), 2560×1440 (16:9), 1440×2560 (9:16), 2496×1664 (3:2), 1664×2496 (2:3), 3024×1296 (21:9).
Recommended 4K: 4096×4096 (1:1), 4608×3456 (4:3), 3456×4608 (3:4), 5120×2880 (16:9), 2880×5120 (9:16), 4992×3328 (3:2), 3328×4992 (2:3), 6048×2592 (21:9).
Dimension behavior:
Text-to-image: Specify explicit width and height from the supported dimensions above.
Image-to-image: Two options available:
Specify width and height explicitly for precise control.
Use resolution parameter (2k or 4k) to automatically match the aspect ratio from the first reference image.
Sequential images: Generates multiple related output images (configure with maxSequentialImages).
Combined limit: Reference images + sequential images cannot exceed 15 total.
Input image requirements: Minimum 14×14 pixels, maximum 6000×6000 pixels, aspect ratio between 1:16 and 16:1, 10MB file size limit.
Provider-specific settings:

Parameters supported: maxSequentialImages, optimizePromptMode.

The model may generate fewer sequential images than requested via maxSequentialImages. The actual number depends on the complexity of the prompt and generation context.

{
  "taskType": "imageInference",
  "taskUUID": "f47ac10b-58cc-4372-a567-0e02b2c3d484",
  "model": "bytedance:seedream@4.5",
  "positivePrompt": "A cinematic portrait with intricate facial details and sharp text overlay",
  "width": 2560,
  "height": 1440
}
{
  "taskType": "imageInference",
  "taskUUID": "a770f077-f413-47de-9dac-be0b26a35da7",
  "model": "bytedance:seedream@4.5",
  "referenceImages": ["c64351d5-4c59-42f7-95e1-eace013eddab"],
  "positivePrompt": "Transform into a professional studio portrait with dramatic lighting",
  "width": 4096,
  "height": 4096
}

--------------------------------------------------------------------------------------------------------------------------


FLUX.2 [dev]
Black Forest Labs' FLUX.2 [dev] model is the open weights release offering full architectural control for developers who need to experiment with custom pipelines and advanced workflows. Available through Runware with optimized inference for fast, cost-effective generation while maintaining complete control over sampling behavior and guidance strategies.

Model AIR ID: runware:400@1.

Supported workflows: Text-to-image, reference-to-image.

Technical specifications:

Positive prompt: 1-32000 characters.
Supported dimensions: 512-2048 pixels (width and height, multiples of 16).
Reference images: Supports up to 4 images via referenceImages.
CFG Scale: 1-20 (default: 4).
Steps: 1-50.
Acceleration: Supports none, low, medium or high values (Default: medium).
{
  "taskType": "imageInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d2",
  "model": "runware:400@1",
  "positivePrompt": "Experimental digital art with abstract geometric patterns and vibrant color gradients",
  "width": 1024,
  "height": 1024,
  "steps": 30,
  "CFGScale": 5
}

{
  "taskType": "imageInference",
  "taskUUID": "550e8400-e29b-41d4-a716-446655440010",
  "model": "runware:400@1",
  "positivePrompt": "Character in similar style and composition to reference images",
  "inputs": {
    "referenceImages": [
      "c64351d5-4c59-42f7-95e1-eace013eddab",
      "d7e8f9a0-2b5c-4e7f-a1d3-9c8b7a6e5d4f"
    ]
  },
  "width": 768,
  "height": 1024,
  "steps": 35,
  "CFGScale": 4.0
}

--------------------------------------------------------------------------------------------------------------------------

FLUX.2 [pro]
Black Forest Labs' FLUX.2 [pro] model delivers high-quality production-ready output with robust reference-image editing capabilities. Built for reliability and speed, this model excels at consistent results across high-volume workflows where dependable performance matters more than deep customization.

Model AIR ID: bfl:5@1.

Supported workflows: Text-to-image, reference-to-image.

Technical specifications:

Positive prompt: 1-32000 characters.
Supported dimensions: 256-2048 pixels (width and height, multiples of 16).
Reference images: Supports up to 9 images via referenceImages.
Total input capacity: 9 megapixels.
Provider-specific settings:

Parameters supported: promptUpsampling, safetyTolerance.

{
  "taskType": "imageInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d3",
  "model": "bfl:5@1",
  "positivePrompt": "Professional product photography of modern electronics on clean white background",
  "width": 1280,
  "height": 720,
  "providerSettings": {
    "bfl": {
      "promptUpsampling": true
    }
  }
}
{
  "taskType": "imageInference",
  "taskUUID": "6ba7b830-9dad-11d1-80b4-00c04fd430c8",
  "model": "bfl:5@1",
  "positivePrompt": "Maintain consistent lighting and brand aesthetic across product variations",
  "inputs": {
    "referenceImages": [
      "c64351d5-4c59-42f7-95e1-eace013eddab",
      "d7e8f9a0-2b5c-4e7f-a1d3-9c8b7a6e5d4f",
      "e8f9a0b1-3c6d-4e8f-b2e4-0d9e8f7c6b5a"
    ]
  },
  "width": 1024,
  "height": 1024
}

--------------------------------------------------------------------------------------------------------------------------

FLUX.2 [flex]
Black Forest Labs' FLUX.2 [flex] model provides the strongest text rendering accuracy in the FLUX family with fine-grained control over composition and layout. Designed specifically for branded design, posters, and typography-driven work, this model maintains character and product consistency across multiple reference images with precise placement and readability.

Model AIR ID: bfl:6@1.

Supported workflows: Text-to-image, reference-to-image.

Technical specifications:

Positive prompt: 1-32000 characters.
Supported dimensions: 256-2048 pixels (width and height, multiples of 16).
Reference images: Supports up to 10 images via referenceImages.
Total input capacity: 14 megapixels.
CFG Scale: 1-20 (default: 2.5).
Steps: 1-50.
Provider-specific settings:

Parameters supported: promptUpsampling, safetyTolerance.

{
  "taskType": "imageInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d4",
  "model": "bfl:6@1",
  "positivePrompt": "Modern poster with bold typography 'INNOVATION SUMMIT 2025' and structured layout with geometric elements",
  "width": 1024,
  "height": 1440,
  "steps": 28,
  "CFGScale": 6
}

{
  "taskType": "imageInference",
  "taskUUID": "6ba7b831-9dad-11d1-80b4-00c04fd430c8",
  "model": "bfl:6@1",
  "positivePrompt": "Product packaging design maintaining consistent brand character and visual identity",
  "inputs": {
    "referenceImages": [
      "c64351d5-4c59-42f7-95e1-eace013eddab"
    ]
  },
  "width": 768,
  "height": 1024,
  "providerSettings": {
    "bfl": {
      "promptUpsampling": true
    }
  }
}

--------------------------------------------------------------------------------------------------------------------------

FLUX.2 [max]
Black Forest Labs' FLUX.2 [max] represents the pinnacle of the FLUX.2 model family, delivering professional-grade visual intelligence for maximum quality image generation and editing. This top-tier variant excels at complex multi-reference workflows, grounded generation with real-world context, and maintaining exceptional style fidelity across production-grade outputs for marketing assets, product visuals, and cinematic compositions.

Model AIR ID: bfl:7@1.

Supported workflows: Text-to-image, reference-to-image.

Technical specifications:

Positive prompt: 1-32000 characters.
Supported dimensions: 256-2048 pixels (width and height, multiples of 16).
Reference images: Supports up to 8 images via referenceImages.
Grounded generation: Supports real-world context integration.
Provider-specific settings:

Parameters supported: promptUpsampling, safetyTolerance.

{
  "taskType": "imageInference",
  "taskUUID": "24cd5dff-cb81-4db5-8506-b72a9425f9d5",
  "model": "bfl:7@1",
  "positivePrompt": "High-end product photography with perfect lighting, professional studio setup, and commercial quality composition",
  "width": 1920,
  "height": 1080,
  "providerSettings": {
    "bfl": {
      "promptUpsampling": true
    }
  }
}{
  "taskType": "imageInference",
  "taskUUID": "6ba7b832-9dad-11d1-80b4-00c04fd430c8",
  "model": "bfl:7@1",
  "positivePrompt": "Create a realistic, high-quality image of a person using all provided reference images to preserve the same character identity."
  "inputs": {
    "referenceImages": [
      "c64351d5-4c59-42f7-95e1-eace013eddab",
      "d7e8f9a0-2b5c-4e7f-a1d3-9c8b7a6e5d4f",
      "e8f9a0b1-3c6d-4e8f-b2e4-0d9e8f7c6b5a",
      "f9a0b1c2-4d7e-5f9g-c3f5-1e0f9g8d7c6b",
      "a1b2c3d4-5e6f-7g8h-d4f6-2f1g0h9i8h7g"
    ]
  },
  "width": 1280,
  "height": 720
}
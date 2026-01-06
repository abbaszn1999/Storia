API Documentation
Complete guide for using our APIs with your API keys
Video-to-Audio API
API Example
curl -X POST https://mmaudio.net/api/video-to-audio \
  -H "Authorization: Bearer your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://assets.mmaudio.net/cut-glass-blueberry.mp4",
    "prompt": "cutting glass on wooden board",
    "duration": 8,
    "num_steps": 25,
    "cfg_strength": 4.5,
    "negative_prompt": "distorted, noisy",
    "seed": 0
  }'

Request Parameters
video_url
string (required)
URL of the video file to generate audio for
prompt
string (required)
Text description of audio to generate
duration
number (1-30)
Audio duration in seconds (default: 8)
num_steps
number (1-50)
Inference steps for quality (default: 25)
cfg_strength
number (1-10)
Guidance strength (default: 4.5)
negative_prompt
string (optional)
What to avoid in generated audio
seed
number (≥0)
Random seed for reproducibility (optional)
Response Format
{
  "video": {
    "url": "https://example.com/video_with_audio.mp4",
    "content_type": "application/octet-stream", 
    "file_name": "video_with_audio.mp4",
    "file_size": 2299595
  }
}

• API keys have the same permissions as your account

• All API requests consume credits from your account balance

• Text-to-Audio: 1 credit per generation

• Video-to-Audio: 2 credit per generation

• You can create up to 10 API keys per account

• Deleted API keys cannot be recovered

• Generated audio/video files are available for 24 hours

• Video input files must be accessible via public URLs

• Maximum file size is approximately 5MB per generation
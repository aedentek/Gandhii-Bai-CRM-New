# Patient Call Records Folder Structure

This folder contains audio recordings and files related to patient call records.

## Directory Structure

```
Patient Call Records/
├── {patientId}/          # e.g., P0001, P0042, etc.
│   └── audio/            # Audio recordings for this patient's calls
│       ├── call_record_1692345678901.mp3
│       ├── call_record_1692345679123.wav
│       └── ...
├── P0001/
│   └── audio/
├── P0002/
│   └── audio/
└── ...
```

## File Naming Convention

Audio files are automatically named with timestamps:
- Format: `call_record_{timestamp}.{extension}`
- Example: `call_record_1692345678901.mp3`

## Supported Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- M4A (.m4a)
- OGG (.ogg)

## Access

Files are served statically via the `/Photos/Patient Call Records/` endpoint.

Example URL: `http://localhost:4000/Photos/Patient%20Call%20Records/P0001/audio/call_record_1692345678901.mp3`

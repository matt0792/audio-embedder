import sys 
import json 
import soundfile as sf 
import openl3
import numpy as np
import tensorflow as tf

gpus = tf.config.list_physical_devices('GPU')
if gpus:
    print(f"✓ GPU available: {gpus[0].name}", file=sys.stderr)
else: 
    print("WARN: No GPU detected. TensorFlow will run on CPU.", file=sys.stderr)

# strict check for gpu 
# gpus = tf.config.list_physical_devices('GPU')
# if not gpus:
#     print("ERROR: No GPU detected.", file=sys.stderr)
#     sys.exit(1)
# else:
#     print(f"✓ GPU available: {gpus[0].name}", file=sys.stderr)

def get_embedding(audio_path):
    audio, sr = sf.read(audio_path)
    if len(audio.shape) == 2:
        audio = np.mean(audio, axis=1) # convert audio to mono (if needed)
        
    # resample to 48k (if needed)
    if sr != 48000: 
        import librosa 
        audio = librosa.resample(audio, orig_sr=sr, target_sr=48000)
        sr=48000
        
    embeddings, _ = openl3.get_audio_embedding(
        audio,
        sr,
        input_repr="mel256",
        content_type="music",
        embedding_size=512,
        verbose=False
    )
    # average over time (also possibly change)
    return embeddings.mean(axis=0).tolist()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python embed_audio.py <path_to_audio>", file=sys.stderr)
        sys.exit(1)

    path = sys.argv[1]
    try:
        embedding = get_embedding(path)
        print(json.dumps(embedding))  # send to stdout 
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
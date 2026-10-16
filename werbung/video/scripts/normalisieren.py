"""Lautheit auf −14 LUFS (EBU R128, zwei Durchgänge mit ffmpeg loudnorm); Video als H.264 yuv420p mit TV-Farbumfang (Instagram, WhatsApp).
Aufruf: python scripts/normalisieren.py out/roh-9x16.mp4 out/lernhelfer-9x16.mp4"""
import json, re, subprocess, sys
import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
ein, aus = sys.argv[1], sys.argv[2]
ZIEL = "I=-14:TP=-1.5:LRA=11"
mess = subprocess.run([FF, "-hide_banner", "-i", ein, "-af", f"loudnorm={ZIEL}:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(re.findall(r"\{[^{}]*\}", mess)[-1])
filt = (f"loudnorm={ZIEL}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
        f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=json")
r = subprocess.run([FF, "-hide_banner", "-y", "-i", ein, "-vf", "scale=in_range=full:out_range=tv,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv", "-af", filt, "-ar", "48000", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", aus], capture_output=True, text=True)
if r.returncode: sys.exit(r.stderr[-2000:])
n = json.loads(re.findall(r"\{[^{}]*\}", r.stderr)[-1])
print(f"vorher {m['input_i']} LUFS, True Peak {m['input_tp']} dBTP -> nachher {n['output_i']} LUFS, True Peak {n['output_tp']} dBTP ({n['normalization_type']})")

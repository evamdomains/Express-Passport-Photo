# Glasses detection model — `glasses.onnx`

The app loads an ONNX glasses detector from **`/public/models/glasses.onnx`**
(this folder). **Until you add that file, the app automatically falls back to the
built-in heuristic** — no crash, no code change needed. Drop the model in and it
takes over on the next load.

## Model contract (so swapping models needs NO code changes)
`src/lib/face/glassesInference.ts` is generic and accepts either output shape:

- **Input:** one `float32` NCHW tensor `[1, 3, H, W]`, RGB, normalized `0..1`,
  square `H = W = GLASSES_INPUT` (default **224** — change that one constant if
  your model uses a different size).
- **Output (either):**
  - **Classifier** `[1, K]` (or `[K]`) of logits/probabilities. `K=1` → sigmoid
    = P(glasses). `K>1` → softmax; the glasses class is `GLASSES_CLASS_INDEX`
    (default `-1` = last class).
  - **YOLO detection** `[1, 4+nc, N]` or `[1, N, 4+nc]` → the max class score is
    taken as the glasses confidence.

Detection threshold: `GLASSES_MODEL_THRESHOLD` (default 0.5) in
`src/lib/face/GlassesDetector.ts`.

## Recommended open-source models (permissive licenses)

1. **Train/export a tiny YOLOv8 classifier (recommended, Ultralytics AGPL or
   commercial):**
   ```bash
   pip install ultralytics
   # Dataset: "Glasses or No Glasses" (Kaggle) or MeGlass (academic).
   yolo classify train model=yolov8n-cls.pt data=glasses_dataset epochs=20 imgsz=224
   yolo export model=runs/classify/train/weights/best.pt format=onnx imgsz=224
   # → best.onnx  →  rename to glasses.onnx, place in this folder.
   ```
   Output is `[1, 2]` (no_glasses, glasses) — set `GLASSES_CLASS_INDEX = 1` (or
   keep `-1` if glasses is the last class).

2. **MobileNetV2 / EfficientNet glasses classifier (Apache-2.0 backbones):** train
   a binary head, export to ONNX at `imgsz=224`, output `[1,1]` or `[1,2]`.

3. **MeGlass / CelebA `Eyeglasses` attribute** are good datasets (transparent,
   rimless, thin metal, thick plastic, sunglasses) to cover the required cases.

> Convert any PyTorch model with:
> `torch.onnx.export(model, dummy[1,3,224,224], "glasses.onnx", opset_version=12, input_names=["input"], output_names=["logits"])`

## After adding the file
No rebuild of detection code is required — `loadGlassesModel.ts` lazily loads and
caches the session on first use, reusing it for every upload and live frame.
If the input size or class index differs, adjust the two constants noted above.

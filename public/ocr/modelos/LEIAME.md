# Modelos do leitor de placa

Rodam no navegador (onnxruntime-web), sem enviar imagens para fora.

- `placa-detector.onnx`: detector de placas `yolo-v9-t-512-license-plates-end2end`, do projeto
  [open-image-models](https://github.com/ankandrew/open-image-models) (MIT).
- `placa-leitor.onnx`: leitor de caracteres `cct_s_v2_global`, do projeto
  [fast-plate-ocr](https://github.com/ankandrew/fast-plate-ocr) (MIT).

O runtime WASM (`public/ocr/ort/`) é copiado de `node_modules` por `scripts/copy-ocr-assets.mjs`.

// =============================================================================
// 上传前图片压缩（S27）
//
// 为什么在上传前压而不是在服务端压：作者常直接拖 1~2MB 的截图，压到长边 1600 + q0.85
// 通常能降到 200KB 量级，省的是读者流量与首屏字节——服务端压只能省存储，传输照旧。
//
// 设计原则：压缩是优化，**任何异常都必须回落原文件**，绝不能阻断上传。
// =============================================================================

export interface CompressOptions {
  /** 长边上限，默认 1600（正文 66ch ≈ 700px，2 倍屏需要 1400，1600 有富余） */
  maxEdge?: number
  /** JPEG 质量，默认 0.85 */
  quality?: number
}

/** 尺寸与体积都已经很小、且无需缩放时，跳过的体积阈值 */
const ALREADY_SMALL = 400 * 1024

/**
 * 压缩图片；不满足压缩条件或失败时返回原文件。
 *
 * 跳过的情况：
 * - GIF：canvas 只取第一帧，动图会变静图
 * - SVG：矢量图没有像素可压，重绘反而失真
 * - 尺寸已达标且体积很小：二次编码会掉画质，且常常变大
 * - 压缩结果 ≥ 原体积
 */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const { maxEdge = 1600, quality = 0.85 } = opts

  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file
  }
  if (typeof document === 'undefined' || typeof createImageBitmap !== 'function') {
    return file
  }

  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    const longest = Math.max(width, height)
    const scale = Math.min(1, maxEdge / longest)

    // 尺寸与体积都够小：不重编码
    if (scale >= 1 && file.size <= ALREADY_SMALL) {
      bitmap.close()
      return file
    }

    const w = Math.max(1, Math.round(width * scale))
    const h = Math.max(1, Math.round(height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close()
      return file
    }
    // 缩小用高质量重采样，避免锯齿
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    // PNG 保持 PNG（转 JPEG 会把透明区变黑），其余一律转 JPEG（收益最大）
    const isPng = file.type === 'image/png'
    const type = isPng ? 'image/png' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, type, quality)
    })

    if (!blob || blob.size >= file.size) {
      return file
    }

    // 保留文件名（只改扩展名），否则 OSS 里全是 blob
    const ext = isPng ? '.png' : '.jpg'
    const base = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${base}${ext}`, { type, lastModified: Date.now() })
  } catch (err) {
    console.error('[imageCompress] 压缩失败，回落原文件', err)
    return file
  }
}

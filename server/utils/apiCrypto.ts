// api-decrypt 加密链路（Node 侧，仅 server 运行）。与后端 RuoYi-Vue-Plus + plus-ui 完全对齐：
//   请求：随机 32 字符 AES key → AES/ECB/PKCS7 加密 body(base64) → 用「前端加密公钥」RSA 加密 base64(key) 放 encrypt-key 头。
//   响应：用「前端解密私钥」RSA 解密 encrypt-key 头 → base64 解码得 AES key 字节 → AES/ECB 解密 body → JSON 字符串。
import { createCipheriv, createDecipheriv, randomBytes, publicEncrypt, privateDecrypt, constants } from 'node:crypto'

export const ENC_HEADER = 'encrypt-key'

/** 32 位十六进制字符 AES key（ASCII 32 字节 = AES-256），与 plus-ui generateRandomString 等长等价 */
function generateAesKeyStr(): string {
  return randomBytes(16).toString('hex')
}

function aesEcbEncryptB64(plain: string, keyStr: string): string {
  const c = createCipheriv('aes-256-ecb', Buffer.from(keyStr, 'utf8'), null)
  return Buffer.concat([c.update(plain, 'utf8'), c.final()]).toString('base64')
}

function aesEcbDecryptStr(b64: string, keyBytes: Buffer): string {
  const d = createDecipheriv('aes-256-ecb', keyBytes, null)
  return Buffer.concat([d.update(Buffer.from(b64, 'base64')), d.final()]).toString('utf8')
}

function rsaEncryptB64(text: string, pubKeyB64: string): string {
  const der = Buffer.from(pubKeyB64, 'base64')
  return publicEncrypt(
    { key: der, format: 'der', type: 'spki', padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(text, 'utf8')
  ).toString('base64')
}

function rsaDecryptStr(b64: string, privKeyB64: string): string {
  const der = Buffer.from(privKeyB64, 'base64')
  return privateDecrypt(
    { key: der, format: 'der', type: 'pkcs8', padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(b64, 'base64')
  ).toString('utf8')
}

/** 加密请求体，返回 { body, encryptKeyHeader }（body 为 AES base64 串，作为 raw 文本发送） */
export function encryptRequest(obj: unknown, pubKeyB64: string): { body: string; encryptKey: string } {
  const aesKeyStr = generateAesKeyStr()
  const body = aesEcbEncryptB64(JSON.stringify(obj), aesKeyStr)
  const encryptKey = rsaEncryptB64(Buffer.from(aesKeyStr, 'utf8').toString('base64'), pubKeyB64)
  return { body, encryptKey }
}

/** 解密响应体（响应带 encrypt-key 头时）；返回明文字符串 */
export function decryptResponse(bodyB64: string, encryptKeyHeader: string, privKeyB64: string): string {
  const keyB64Str = rsaDecryptStr(encryptKeyHeader, privKeyB64) // base64 of AES key
  const keyBytes = Buffer.from(keyB64Str, 'base64')
  return aesEcbDecryptStr(bodyB64, keyBytes)
}

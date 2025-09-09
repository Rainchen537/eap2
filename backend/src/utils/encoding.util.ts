/**
 * 后端中文编码修复工具
 */

/**
 * 检测是否包含乱码字符
 */
function hasGarbledChars(str: string): boolean {
  // 检测常见的乱码模式
  const garbledPatterns = [
    /[æ-ÿ]{2,}/, // 连续的扩展ASCII字符
    /Â|Ã|Ä|Å|Æ|Ç|È|É|Ê|Ë/, // 常见的UTF-8误解码字符
    /â|ã|ä|å|æ|ç|è|é|ê|ë/, // 小写版本
    /[\u00C0-\u00FF]{2,}/, // 连续的Latin-1补充字符
  ];
  
  return garbledPatterns.some(pattern => pattern.test(str));
}

/**
 * 检测字符串是否为有效的UTF-8编码
 */
function isValidUTF8(str: string): boolean {
  try {
    return Buffer.from(str, 'utf8').toString('utf8') === str;
  } catch {
    return false;
  }
}

/**
 * 修复中文文件名编码问题
 */
export function fixChineseFilename(filename: string): string {
  if (!filename) return filename;
  
  // 如果文件名看起来正常，直接返回
  if (!hasGarbledChars(filename) && isValidUTF8(filename)) {
    return filename;
  }
  
  console.log('检测到可能的乱码文件名:', filename);
  
  try {
    // 方法1: 从latin1转utf8
    const latin1ToUtf8 = Buffer.from(filename, 'latin1').toString('utf8');
    if (isValidUTF8(latin1ToUtf8) && !latin1ToUtf8.includes('�') && /[\u4e00-\u9fa5]/.test(latin1ToUtf8)) {
      console.log('latin1->utf8 成功:', latin1ToUtf8);
      return latin1ToUtf8;
    }
  } catch (e) {
    console.log('latin1->utf8 失败:', e);
  }
  
  try {
    // 方法2: URL解码
    const urlDecoded = decodeURIComponent(escape(filename));
    if (isValidUTF8(urlDecoded) && !urlDecoded.includes('�') && /[\u4e00-\u9fa5]/.test(urlDecoded)) {
      console.log('URL解码成功:', urlDecoded);
      return urlDecoded;
    }
  } catch (e) {
    console.log('URL解码失败:', e);
  }
  
  try {
    // 方法3: 尝试从Buffer重新解码
    const buffer = Buffer.from(filename, 'binary');
    const binaryToUtf8 = buffer.toString('utf8');
    if (isValidUTF8(binaryToUtf8) && !binaryToUtf8.includes('�') && /[\u4e00-\u9fa5]/.test(binaryToUtf8)) {
      console.log('binary->utf8 成功:', binaryToUtf8);
      return binaryToUtf8;
    }
  } catch (e) {
    console.log('binary->utf8 失败:', e);
  }
  
  try {
    // 方法4: 尝试从UTF-8字节序列解码
    // 将每个字符当作字节，重新组合成UTF-8字符串
    const bytes: number[] = [];
    for (let i = 0; i < filename.length; i++) {
      bytes.push(filename.charCodeAt(i) & 0xFF);
    }
    
    // 将字节数组转换为UTF-8字符串
    const uint8Array = new Uint8Array(bytes);
    const decoded = Buffer.from(uint8Array).toString('utf8');
    
    // 检查解码结果是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(decoded) && !decoded.includes('�')) {
      console.log('UTF-8字节序列解码成功:', decoded);
      return decoded;
    }
  } catch (e) {
    console.log('UTF-8字节序列解码失败:', e);
  }
  
  // 如果所有方法都失败，返回原始文件名
  console.log('所有解码方法都失败，返回原始文件名');
  return filename;
}

/**
 * 批量修复文件名数组
 */
export function fixFilenameArray<T extends { originalFilename: string }>(files: T[]): T[] {
  return files.map(file => ({
    ...file,
    originalFilename: fixChineseFilename(file.originalFilename)
  }));
}

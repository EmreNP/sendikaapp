/**
 * Logger utility — production ortamında console çıktılarını bastırır.
 * Hassas bilgilerin (token, kullanıcı verisi vb.) üretim loglarına sızmasını önler.
 *
 * Kullanım:
 *   import { logger } from '../utils/logger';
 *   logger.log('mesaj');
 *   logger.error('hata:', error);
 *   logger.warn('uyarı');
 */

const noop = (..._args: unknown[]) => {};

export const logger = {
  log: __DEV__ ? console.log.bind(console) : noop,
  error: __DEV__ ? console.error.bind(console) : noop,
  warn: __DEV__ ? console.warn.bind(console) : noop,
  info: __DEV__ ? console.info.bind(console) : noop,
  debug: __DEV__ ? console.debug.bind(console) : noop,
};

export default logger;

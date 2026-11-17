/**
 * Wrapper para tratamento de erros assíncronos no Express.
 * Evita try/catch repetitivo em rotas async.
 *
 * @param {Function} fn - Função async handler (req, res, next)
 * @returns {Function} Handler que captura erros e passa para next()
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default asyncHandler;

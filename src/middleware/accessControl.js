/**
 * Middleware de Control de Acceso Freemium
 * Verifica la vigencia del plan y gestiona los créditos diarios
 */
const accessControl = async (req, res, next) => {
  // Token logic is handled directly in generator.controller.js now.
  return next();
};

module.exports = accessControl;

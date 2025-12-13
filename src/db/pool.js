const { Pool } = require('pg');

/**
 * @param {{ connectionString: string }} params
 */
function createPool(params) {
  return new Pool({ connectionString: params.connectionString });
}

module.exports = {
  createPool,
};

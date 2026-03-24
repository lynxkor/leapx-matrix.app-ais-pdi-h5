import { post } from './request'

const prefix = 'vehstock/app/store/storeInventoryLedger'

/**
 * 门店库存台账分页查询
 * @param {Object} data
 */
export function getList(data) {
  return post(prefix + '/page', data)
}

/**
 * 门店库存台账生成在库PDI单
 * @param {Object} data
 */
export function generatePdi(data) {
  return post(prefix + '/generatePdi', data)
}

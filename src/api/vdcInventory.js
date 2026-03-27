import { post } from './request'

const prefix = 'vehstock/app/store/vehicleVdcInventoryStatistics'

/**
 * 厂端整车库存分页查询
 * @param {Object} data
 */
export function getList(data) {
  return post(prefix + '/statistics', data)
}

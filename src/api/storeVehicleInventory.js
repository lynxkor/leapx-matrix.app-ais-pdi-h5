import { post } from './request'

const prefix = 'vehstock/app/store/storeVehicleInventory'

/**
 * 低电量查询
 * @param {Object} data
 */
export function getList(data) {
  return post(prefix + '/report', data)
}

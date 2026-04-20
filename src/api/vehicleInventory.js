import { post } from './request'

const prefix = 'vehstock/app/store/storeVehicleInventory'

/**
 * 低电量查询
 * @param {Object} data
 * @param {number} timeout - 超时时间(ms)，默认10秒
 */
export function getList(data, timeout = 1000000) {
  return post(prefix + '/report', data, timeout)
}

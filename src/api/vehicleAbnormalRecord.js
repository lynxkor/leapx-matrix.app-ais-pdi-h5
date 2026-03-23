import { get, post, postJson } from './request'

const prefix = 'vehstock/app/store/vehicleAbnormalRecord'

/**
 * 新增或修改Table配置
 * @param {Object} data
 */
export function getList(data) {
  return post(prefix + '/page', data)
}

import { post } from './request'

export function getList(data) {
  return post('/datacenter/vehiclePartsMaintenance/page', data)
}

import { post, postJson } from './request'

// ==================== APP 端 风险车辆排查 ====================
// 上下文前缀与 pdi 保持一致：/vehstock/app/...

// 任务分页列表（门店维度统计）
export function getRiskCheckTaskList(data) {
  return post('/vehstock/app/risktask/riskCheckTask/list', data)
}

// 任务详情
export function getRiskCheckTaskDetail(data) {
  return postJson('/vehstock/app/risktask/riskCheckTask/detail', data)
}

// 车辆清单分页（门店维度筛选）
export function getRiskCheckVehiclePage(data) {
  return post('/vehstock/app/risktask/riskCheckTask/detail/page', data)
}

// 门店提交排查结果
export function submitRiskCheckResult(data) {
  return postJson('/vehstock/app/risktask/riskCheckAudit/submit', data)
}

// 审核列表分页（门店维度，2 Tab：待审核/已审核）
export function getRiskCheckAuditPage(data) {
  return post('/vehstock/app/risktask/riskCheckAudit/page', data)
}

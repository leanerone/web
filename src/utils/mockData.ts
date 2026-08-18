import type { Equipment, Requirement, ChangeRecord } from '@/types';

// 机台 mock 数据（API 失败时的本地回退）
export const mockEquipment: Equipment[] = [
  { id: 1, ap_id: 1, ap_name: 'AP-001', eq_name: 'CATEOX-57', eq_type: 'CPC', eq_model: 'KEDJ-8350V-LPT', vendor: 'ASML', server_id: 'SRV-001', driver_type: 'TCP/IP', driver_version: 'v3.2.1', snmp_ip: '192.168.1.101', snmp_port: '161', driver1_ip: '192.168.1.101', driver1_port: '5000', driver2_ip: '', driver2_port: '', area: 'DF', baud_rate: '', status: 'online', location: 'Fab-A-1F-Bay01', installed_at: '2025-06-15', updated_at: '2026-07-13' },
  { id: 2, ap_id: 2, ap_name: 'AP-002', eq_name: 'GATEOX-57', eq_type: 'GATEOX', eq_model: 'KEDJ-82800S', vendor: 'TEL', server_id: 'SRV-002', driver_type: 'TCP/IP', driver_version: 'v3.2.1', snmp_ip: '192.168.1.102', snmp_port: '161', driver1_ip: '192.168.1.102', driver1_port: '5001', driver2_ip: '', driver2_port: '', area: 'TF', baud_rate: '', status: 'online', location: 'Fab-A-1F-Bay02', installed_at: '2025-08-20', updated_at: '2026-07-13' },
  { id: 3, ap_id: 3, ap_name: 'AP-003', eq_name: 'CPC-55', eq_type: 'CPC', eq_model: 'DNSA8S2000', vendor: 'DNS', server_id: 'SRV-003', driver_type: 'TCP/IP', driver_version: 'v2.1.0', snmp_ip: '192.168.1.103', snmp_port: '161', driver1_ip: '192.168.1.103', driver1_port: '5002', driver2_ip: '', driver2_port: '', area: 'TF', baud_rate: '', status: 'maintenance', location: 'Fab-B-2F-Bay05', installed_at: '2024-12-01', updated_at: '2026-07-12' },
  { id: 4, ap_id: 4, ap_name: 'AP-004', eq_name: 'TTOX-54', eq_type: 'TTOX', eq_model: 'Thermawave OP5205T', vendor: 'Thermawave', server_id: 'SRV-004', driver_type: 'TCP/IP', driver_version: 'v4.0.0', snmp_ip: '192.168.1.104', snmp_port: '161', driver1_ip: '192.168.1.104', driver1_port: '5003', driver2_ip: '', driver2_port: '', area: 'FF', baud_rate: '', status: 'online', location: 'Fab-C-3F-Bay03', installed_at: '2025-03-10', updated_at: '2026-07-13' },
  { id: 5, ap_id: 5, ap_name: 'AP-005', eq_name: 'CATEOX-58', eq_type: 'CPC', eq_model: 'KEDJ-8350V-LPT', vendor: 'ASML', server_id: 'SRV-005', driver_type: 'TCP/IP', driver_version: 'v3.2.1', snmp_ip: '192.168.1.105', snmp_port: '161', driver1_ip: '192.168.1.105', driver1_port: '5004', driver2_ip: '', driver2_port: '', area: 'DF', baud_rate: '', status: 'online', location: 'Fab-A-1F-Bay03', installed_at: '2025-07-01', updated_at: '2026-07-13' },
  { id: 6, ap_id: 6, ap_name: 'AP-006', eq_name: 'GATEOX-58', eq_type: 'GATEOX', eq_model: 'KEDJ-82800S', vendor: 'TEL', server_id: 'SRV-006', driver_type: 'TCP/IP', driver_version: 'v3.2.1', snmp_ip: '192.168.1.106', snmp_port: '161', driver1_ip: '192.168.1.106', driver1_port: '5005', driver2_ip: '', driver2_port: '', area: 'TF', baud_rate: '', status: 'offline', location: 'Fab-A-1F-Bay04', installed_at: '2025-09-15', updated_at: '2026-07-10' },
];

// 需求 mock 数据
export const mockRequirements: Requirement[] = [
  { id: 1, title: 'Lot Tracking功能增强', description: '增加Lot实时追踪功能，支持跨机台追踪，提供实时位置和状态信息。需要修改EAP驱动代码，新增追踪模块，并更新机台配置文件。涉及SECS-II协议消息扩展和数据库表结构变更。', priority: 'high', status: 'pending', equipment_id: 1, created_at: '2026-07-10', updated_at: '2026-07-10' },
  { id: 2, title: 'EPI机台参数调整', description: '调整EPI机台工艺参数配置，优化沉积效果，提高薄膜均匀性。涉及config文件修改和驱动参数调优。需要更新配方参数表并验证沉积速率和均匀性指标。', priority: 'medium', status: 'in_progress', equipment_id: 2, created_at: '2026-07-08', updated_at: '2026-07-12' },
  { id: 3, title: 'WAT数据采集优化', description: '优化WAT测试数据采集效率，减少数据传输延迟。需要重构数据采集模块并优化Oracle数据库查询性能，添加批量写入和异步采集功能。', priority: 'high', status: 'pending', equipment_id: 3, created_at: '2026-07-11', updated_at: '2026-07-11' },
  { id: 4, title: 'CMP设备驱动更新', description: '更新CMP设备驱动至v2.0版本，修复已知bug，提升设备稳定性。涉及驱动代码重构和配置兼容性测试，需要处理研磨终点检测和抛光头压力控制逻辑。', priority: 'critical', status: 'in_progress', equipment_id: 4, created_at: '2026-07-05', updated_at: '2026-07-13' },
  { id: 5, title: 'Litho机台配置修改', description: '修改光刻机曝光参数配置文件，支持新工艺配方。需要更新config文件并进行机台验证测试，涉及对准精度和曝光能量参数调整。', priority: 'medium', status: 'testing', equipment_id: 1, created_at: '2026-07-03', updated_at: '2026-07-12' },
  { id: 6, title: 'Etch设备监控增强', description: '增加刻蚀设备实时监控告警功能，支持异常状态自动推送通知。已完成开发和部署，包含RF功率监控和腔体温度告警模块。', priority: 'low', status: 'completed', equipment_id: 2, created_at: '2026-06-20', updated_at: '2026-07-01' },
  { id: 7, title: 'Diffusion炉管温控优化', description: '优化Diffusion炉管温度控制算法，提高温控精度。涉及驱动代码修改和PID参数调优，需要处理升降温曲线优化和温度均匀性提升。', priority: 'high', status: 'pending', equipment_id: 3, created_at: '2026-07-09', updated_at: '2026-07-09' },
  { id: 8, title: 'PVD设备通信协议升级', description: '升级PVD设备通信协议从SECS-I到SECS-II，提升数据传输效率。需要重写驱动通信层，处理消息格式转换和兼容性测试。', priority: 'critical', status: 'in_progress', equipment_id: 4, created_at: '2026-07-06', updated_at: '2026-07-13' },
];

// 变更记录 mock 数据
export const mockChangeRecords: ChangeRecord[] = [
  { id: 1, requirement_id: 4, change_type: '驱动代码修改', description: '更新CMP设备驱动主程序，修复内存泄漏问题', file_path: '/drivers/cmp/driver_main.py', applied_at: '2026-07-12' },
  { id: 2, requirement_id: 4, change_type: '配置文件更新', description: '更新设备参数配置文件，优化工艺参数', file_path: '/config/cmp/params.cfg', applied_at: '2026-07-13' },
  { id: 3, requirement_id: 8, change_type: '驱动代码修改', description: '重写PVD设备通信层，支持SECS-II协议', file_path: '/drivers/pvd/comm_layer.py', applied_at: '2026-07-10' },
  { id: 4, requirement_id: 2, change_type: '配置文件更新', description: '调整EPI沉积参数，优化薄膜均匀性', file_path: '/config/epi/recipe.cfg', applied_at: '2026-07-11' },
  { id: 5, requirement_id: 5, change_type: '测试验证', description: '光刻机新配方验证测试通过', file_path: '', applied_at: '2026-07-12' },
];

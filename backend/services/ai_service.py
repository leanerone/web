import json
from typing import List, Dict
from config.settings import settings


def generate_work_plan(input_text: str, tasks: List[Dict] = None, projects: List[Dict] = None) -> Dict:
    if settings.openai_api_key:
        return _call_openai_plan(input_text, tasks, projects)
    else:
        return _mock_plan(input_text, tasks, projects)


def optimize_tasks(tasks: List[Dict]) -> Dict:
    if settings.openai_api_key:
        return _call_openai_optimize(tasks)
    else:
        return _mock_optimize(tasks)


def generate_weekly_report(start_date: str, end_date: str, projects: List[Dict] = None, 
                           requirements: List[Dict] = None, tasks: List[Dict] = None) -> Dict:
    if settings.openai_api_key:
        return _call_openai_weekly_report(start_date, end_date, projects, requirements, tasks)
    else:
        return _mock_weekly_report(start_date, end_date, projects, requirements, tasks)


def _call_openai_plan(input_text: str, tasks: List[Dict] = None, projects: List[Dict] = None) -> Dict:
    from openai import OpenAI
    
    client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_api_base)
    
    task_summary = "\n".join([f"- {t['title']} ({t.get('status', 'pending')})" for t in (tasks or [])])
    project_summary = "\n".join([f"- {p['name']} ({p.get('status', 'active')}, {p.get('progress', 0)}%)" for p in (projects or [])])
    
    prompt = f"""
    作为一名半导体CIM EAP工程师的AI助手，请根据以下信息制定工作规划：
    
    用户输入: {input_text}
    
    当前任务列表:
    {task_summary if task_summary else '无'}
    
    当前项目列表:
    {project_summary if project_summary else '无'}
    
    请提供：
    1. 详细的工作规划建议
    2. 3-5条具体的行动建议
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "你是一位专业的半导体CIM EAP工程师助手，擅长项目管理、机台维护和工作规划。"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7
    )
    
    content = response.choices[0].message.content
    suggestions = []
    
    lines = content.split('\n')
    suggestion_start = False
    for line in lines:
        if '行动建议' in line or '建议' in line:
            suggestion_start = True
            continue
        if suggestion_start and line.strip():
            if line.strip().startswith('-'):
                suggestions.append(line.strip()[2:])
            elif line.strip().startswith('*'):
                suggestions.append(line.strip()[2:])
    
    return {
        "suggestions": suggestions[:5] if suggestions else ["合理规划项目进度", "优先处理高优先级任务", "定期更新机台状态"],
        "plan": content
    }


def _call_openai_optimize(tasks: List[Dict]) -> Dict:
    from openai import OpenAI
    
    client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_api_base)
    
    task_summary = json.dumps(tasks, ensure_ascii=False)
    
    prompt = f"""
    作为一名半导体CIM EAP工程师的AI助手，请优化以下任务列表的执行顺序：
    
    当前任务列表:
    {task_summary}
    
    请提供：
    1. 优化后的任务执行顺序
    2. 3-5条优化建议
    
    请以JSON格式返回，包含optimized_tasks和suggestions两个字段。
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "你是一位专业的半导体CIM EAP工程师助手，擅长任务管理和优化。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )
        
        content = response.choices[0].message.content
        start_idx = content.find('{')
        end_idx = content.rfind('}') + 1
        if start_idx >= 0 and end_idx > start_idx:
            result = json.loads(content[start_idx:end_idx])
            return result
    except Exception:
        pass
    
    return _mock_optimize(tasks)


def _call_openai_weekly_report(start_date: str, end_date: str, projects: List[Dict] = None,
                               requirements: List[Dict] = None, tasks: List[Dict] = None) -> Dict:
    from openai import OpenAI
    
    client = OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_api_base)
    
    project_summary = "\n".join([f"- {p['name']}: {p.get('progress', 0)}%" for p in (projects or [])])
    req_summary = "\n".join([f"- {r['title']} ({r.get('status', 'pending')})" for r in (requirements or [])])
    task_summary = "\n".join([f"- {t['title']} ({t.get('status', 'pending')})" for t in (tasks or [])])
    
    prompt = f"""
    作为一名半导体CIM EAP工程师的AI助手，请根据以下信息生成周报：
    
    时间范围: {start_date} 至 {end_date}
    
    本周项目进展:
    {project_summary if project_summary else '无'}
    
    需求处理情况:
    {req_summary if req_summary else '无'}
    
    任务完成情况:
    {task_summary if task_summary else '无'}
    
    请按照以下格式生成专业的周报：
    1. 本周工作概述
    2. 项目进展详情
    3. 需求处理情况
    4. 机台维护情况（如适用）
    5. 下周工作计划
    6. 问题与建议
    """
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "你是一位专业的半导体CIM EAP工程师助手，擅长撰写专业的工作周报。"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.6
    )
    
    return {
        "content": response.choices[0].message.content
    }


def _mock_plan(input_text: str, tasks: List[Dict] = None, projects: List[Dict] = None) -> Dict:
    return {
        "suggestions": [
            "合理规划项目进度，优先完成高优先级任务",
            "定期检查机台状态，确保生产稳定性",
            "与团队保持沟通，及时同步项目进展",
            "关注用户需求变更，灵活调整工作计划",
            "预留时间处理突发问题和技术支持"
        ],
        "plan": f"""
工作规划建议

基于您的输入：{input_text}

当前任务概览：
{len(tasks) if tasks else 0} 个任务待处理

当前项目概览：
{len(projects) if projects else 0} 个项目进行中

建议行动：
1. 优先处理高优先级的机台驱动开发任务
2. 定期更新项目进度，确保按时交付
3. 关注机台上线流程，确保顺利完成
4. 准备周报内容，总结本周工作成果
"""
    }


def _mock_optimize(tasks: List[Dict]) -> Dict:
    prioritized = sorted(tasks, key=lambda x: {'critical': 0, 'high': 1, 'medium': 2, 'low': 3}.get(x.get('priority', 'medium'), 2))
    
    return {
        "optimized_tasks": prioritized,
        "suggestions": [
            "优先处理critical和high优先级任务",
            "按项目相关性分组执行任务",
            "预留缓冲时间处理突发需求",
            "完成任务后及时更新状态"
        ]
    }


def _mock_weekly_report(start_date: str, end_date: str, projects: List[Dict] = None,
                        requirements: List[Dict] = None, tasks: List[Dict] = None) -> Dict:
    return {
        "content": f"""
周报 - {start_date} 至 {end_date}

一、本周工作概述
本周主要完成了项目开发、需求处理和机台维护等工作。

二、项目进展详情
{len(projects) if projects else 0} 个项目进行中

三、需求处理情况
{len(requirements) if requirements else 0} 个需求待处理

四、机台维护情况
持续监控1000+机台运行状态，确保生产稳定

五、下周工作计划
1. 继续推进重点项目开发
2. 处理待办用户需求
3. 完成本周机台上线任务
4. 准备下周周报内容

六、问题与建议
暂无重大问题，建议继续保持良好的工作节奏。
"""
    }

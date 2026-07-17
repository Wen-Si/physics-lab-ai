package com.physicslab.ai.workflow.nodes;

import com.physicslab.ai.agent.PhysicsExperimentAgent;
import com.physicslab.ai.model.WorkflowNodeInfo;
import com.physicslab.ai.workflow.WorkflowContext;
import com.physicslab.ai.workflow.WorkflowNode;
import org.springframework.stereotype.Component;

/**
 * Node 2 - Experiment Classifier.
 *
 * <p>Classifies the experiment into one of six categories using keyword
 * matching: mechanics / electromagnetism / optics / thermodynamics / waves /
 * modern_physics.</p>
 */
@Component
public class ExperimentClassifierNode implements WorkflowNode {

    private static final WorkflowNodeInfo INFO = new WorkflowNodeInfo(
            2, "experiment_classifier", "实验分类", "分类实验类型：力学/电磁学/光学/热力学/波动/现代物理");

    @Override
    public WorkflowNodeInfo getNodeInfo() {
        return INFO;
    }

    @Override
    public void execute(WorkflowContext context, PhysicsExperimentAgent agent) {
        String input = context.getInput() == null ? "" : context.getInput();

        String experimentType;
        if (containsAny(input, "力", "运动", "质量", "速度", "加速度", "落体", "摆", "弹簧",
                "碰撞", "斜面", "抛", "圆周", "轨道", "行星", "滑轮", "动量", "摩擦")) {
            experimentType = "mechanics";
        } else if (containsAny(input, "电", "磁", "电磁", "电荷", "电场", "磁场", "电流",
                "电压", "电路", "感应", "线圈")) {
            experimentType = "electromagnetism";
        } else if (containsAny(input, "光", "折射", "反射", "透镜", "棱镜", "干涉", "衍射",
                "光谱", "激光")) {
            experimentType = "optics";
        } else if (containsAny(input, "热", "温度", "热量", "比热", "气体", "膨胀", "导热",
                "熵", "卡诺")) {
            experimentType = "thermodynamics";
        } else if (containsAny(input, "波", "振动", "声波", "频率", "波长", "振幅", "周期",
                "共振")) {
            experimentType = "waves";
        } else if (containsAny(input, "量子", "相对论", "原子", "核", "光子", "电子", "粒子",
                "波粒")) {
            experimentType = "modern_physics";
        } else {
            // Default to mechanics as it is the most common experiment type.
            experimentType = "mechanics";
        }

        context.setExperimentType(experimentType);
    }

    private boolean containsAny(String input, String... keywords) {
        for (String keyword : keywords) {
            if (input.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}

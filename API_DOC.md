# H3C 画板系统接口与业务文档

## 1. 系统概述
本系统是一个基于 **React Flow** 构建的高性能、无限画布白板应用，集成了 **Google Gemini AI** 能力。支持多模态内容生成（流程图、思维导图、Markdown文章）、自定义节点（形状、图片、视频、分区）、以及图层管理和资源市场功能。

## 2. 核心数据类型 (Types)

### 2.1 工具类型 (ToolType)
系统支持多种工具模式，用于创建不同类型的节点：
```typescript
enum ToolType {
  SELECT = 'SELECT',           // 选择模式
  RECTANGLE, CIRCLE, ...       // 基础形状
  MINDMAP = 'MINDMAP',         // 思维导图
  CUSTOM_AGENT = 'CUSTOM_AGENT', // 自定义智能体
  MARKDOWN = 'MARKDOWN',       // Markdown 编辑器
  SECTION = 'SECTION',         // 分区容器
  ...
}
```

### 2.2 节点数据 (NodeData)
React Flow 节点的 `data` 属性接口：
```typescript
interface NodeData {
  label?: string;              // 文本标签
  backgroundColor: string;     // 背景色
  borderColor: string;         // 边框色
  borderWidth: number;         // 边框宽度
  // ... 样式属性
  mindMapRoot?: MindMapItem;   // 思维导图根数据
  markdownContent?: string;    // Markdown 内容
  agentOutputType?: 'MARKDOWN' | 'MINDMAP'; // 智能体输出类型
}
```

### 2.3 状态管理 (Zustand Store)
全局状态 `AppState` 管理画布的核心数据：
- `nodes`: 所有节点数组。
- `edges`: 所有连线数组。
- `tool`: 当前激活的工具。
- `selectedNodes`: 选中的节点 ID 列表。
- `savedResources`: 资源市场中保存的组件模板。

## 3. AI 业务接口 (Google GenAI)

系统使用 `@google/genai` SDK (`gemini-2.5-flash` 模型) 实现智能化功能。

### 3.1 智能助手 (AIGenerator)
**功能**: 根据用户提示词和可选的参考图片生成内容。
**模式**:
1. **智能创作 (Default)**: 生成综合布局（海报、架构图）。
   - **输入**: 提示词 + 当前画布选中节点作为上下文。
   - **输出**: JSON 格式的节点 (`elements` 数组) 和连线，直接渲染到画布。
2. **通用流图 (General)**: 生成标准流程图。
   - **逻辑**: 强制垂直布局规则，自动连接节点。
3. **思维导图 (MindMap)**: 生成思维导图结构。
   - **输出**: JSON (`nodes` 扁平数组)，前端重构为树形结构渲染。
4. **富文本 (Markdown)**: 生成文章或大纲。
   - **输出**: Markdown 文本流，实时显示在编辑器节点中。

### 3.2 自定义智能体 (CustomAgentNode)
**功能**: 画布上的独立 AI 节点，可以串联执行任务。
**逻辑**:
1. **上下文感知**: 自动读取上游连接节点的内容（Markdown、思维导图、普通文本）作为 Context。
2. **执行**: 根据用户在节点内输入的指令 + 上下文，调用 AI。
3. **输出**: 自动创建下游节点（Markdown 或 MindMap）并连接。

### 3.3 Markdown 扩写 (MarkdownNode)
**功能**: 内置 AI 辅助写作。
**逻辑**: 读取当前编辑器内容作为 Context，调用 AI 进行续写或总结，结果追加或生成新节点。

## 4. 资源市场接口
- **保存**: 将当前选中的节点和连线序列化为 JSON，存储在 `savedResources` 数组中。
- **拖拽使用**: 从资源面板拖拽组件到画布时，反序列化 JSON，重新生成唯一 ID，并计算相对坐标进行放置。

## 5. 交互规范
- **快捷键**: 
  - `Ctrl+C/V`: 复制粘贴
  - `Ctrl+G`: 组合
  - `Space`: 拖拽画布
  - `Del`: 删除
- **多选**: 框选或按住 Shift 点击。
- **导出**: 支持导出为 PNG 图片或 JSON 数据文件。

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useTeamStore } from '@/stores/useTeamStore';
import { cn } from '@/utils/cn';

interface Node {
  id: string;
  type: 'episode' | 'task' | 'member';
  label: string;
  x: number;
  y: number;
  color: string;
  status?: string;
  progress?: number;
}

interface Edge {
  from: string;
  to: string;
  type: 'contains' | 'assigned' | 'dependency';
}

// 노드 위치 계산 (원형 레이아웃)
function calculateNodePositions(
  episodes: { id: string; name: string; projectId: string; taskIds: string[]; progress: number }[],
  tasks: { id: string; title: string; episodeId: string; assigneeId?: string; status: string }[],
  members: { id: string; name: string; status: string }[],
  projects: { id: string; color: string }[],
  centerX: number,
  centerY: number
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 에피소드 노드 (중앙 원)
  const episodeRadius = 200;
  episodes.forEach((ep, i) => {
    const angle = (2 * Math.PI * i) / episodes.length - Math.PI / 2;
    const project = projects.find((p) => p.id === ep.projectId);
    nodes.push({
      id: ep.id,
      type: 'episode',
      label: ep.name,
      x: centerX + episodeRadius * Math.cos(angle),
      y: centerY + episodeRadius * Math.sin(angle),
      color: project?.color || '#6B7280',
      progress: ep.progress,
    });
  });

  // 태스크 노드 (에피소드 주변)
  const taskRadius = 80;
  episodes.forEach((ep, epIndex) => {
    const epTasks = tasks.filter((t) => t.episodeId === ep.id);
    const epAngle = (2 * Math.PI * epIndex) / episodes.length - Math.PI / 2;
    const epX = centerX + episodeRadius * Math.cos(epAngle);
    const epY = centerY + episodeRadius * Math.sin(epAngle);
    const project = projects.find((p) => p.id === ep.projectId);

    epTasks.forEach((task, taskIndex) => {
      const taskAngle = epAngle + ((taskIndex - (epTasks.length - 1) / 2) * 0.3);
      const taskX = epX + taskRadius * Math.cos(taskAngle);
      const taskY = epY + taskRadius * Math.sin(taskAngle);

      nodes.push({
        id: task.id,
        type: 'task',
        label: task.title,
        x: taskX,
        y: taskY,
        color: project?.color || '#6B7280',
        status: task.status,
      });

      // 에피소드 -> 태스크 연결
      edges.push({
        from: ep.id,
        to: task.id,
        type: 'contains',
      });

      // 태스크 -> 팀원 연결
      if (task.assigneeId) {
        edges.push({
          from: task.id,
          to: task.assigneeId,
          type: 'assigned',
        });
      }
    });
  });

  // 팀원 노드 (외곽 원)
  const memberRadius = 380;
  const activeMembers = members.filter((m) =>
    tasks.some((t) => t.assigneeId === m.id)
  );
  activeMembers.forEach((member, i) => {
    const angle = (2 * Math.PI * i) / activeMembers.length - Math.PI / 2;
    nodes.push({
      id: member.id,
      type: 'member',
      label: member.name,
      x: centerX + memberRadius * Math.cos(angle),
      y: centerY + memberRadius * Math.sin(angle),
      color: getStatusColor(member.status),
      status: member.status,
    });
  });

  return { nodes, edges };
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'working':
    case 'progress':
      return '#22C55E';
    case 'review':
      return '#F59E0B';
    case 'done':
      return '#6366F1';
    case 'waiting':
    default:
      return '#6B7280';
  }
}

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  scale: number;
}

function NodeComponent({ node, isSelected, isDragging, onSelect, onDragStart, scale }: NodeComponentProps) {
  const size = node.type === 'episode' ? 60 : node.type === 'task' ? 40 : 36;

  return (
    <motion.g
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={(e) => onDragStart(node.id, e)}
      onClick={() => onSelect(node.id)}
    >
      {/* 선택 하이라이트 */}
      {isSelected && (
        <circle
          cx={node.x}
          cy={node.y}
          r={size / 2 + 8}
          fill="none"
          stroke={node.color}
          strokeWidth={2}
          strokeDasharray="4 2"
          className="animate-pulse"
        />
      )}

      {/* 메인 노드 */}
      <circle
        cx={node.x}
        cy={node.y}
        r={size / 2}
        fill={node.color}
        className={cn(
          'transition-all duration-200',
          isSelected ? 'filter drop-shadow-lg' : 'hover:filter hover:brightness-110'
        )}
      />

      {/* 진행률 표시 (에피소드) */}
      {node.type === 'episode' && node.progress !== undefined && (
        <circle
          cx={node.x}
          cy={node.y}
          r={size / 2 - 3}
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={4}
          strokeDasharray={`${(node.progress / 100) * Math.PI * (size - 6)} ${Math.PI * (size - 6)}`}
          transform={`rotate(-90 ${node.x} ${node.y})`}
        />
      )}

      {/* 상태 아이콘 (태스크/멤버) */}
      {node.type !== 'episode' && (
        <circle
          cx={node.x}
          cy={node.y}
          r={size / 4}
          fill="white"
          fillOpacity={0.9}
        />
      )}

      {/* 라벨 */}
      <text
        x={node.x}
        y={node.y + size / 2 + 14}
        textAnchor="middle"
        className="fill-current text-light-text dark:text-dark-text"
        style={{ fontSize: `${12 / scale}px`, fontWeight: node.type === 'episode' ? 600 : 400 }}
      >
        {node.label.length > 15 ? node.label.slice(0, 15) + '...' : node.label}
      </text>

      {/* 타입 아이콘 */}
      {node.type === 'episode' && (
        <text
          x={node.x}
          y={node.y + 5}
          textAnchor="middle"
          className="fill-white"
          style={{ fontSize: `${14 / scale}px`, fontWeight: 700 }}
        >
          {node.progress}%
        </text>
      )}
    </motion.g>
  );
}

export function NodeMapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const { episodes, projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { members: teamMembers } = useTeamStore();

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [filterType, setFilterType] = useState<'all' | 'episode' | 'task' | 'member'>('all');

  // 노드와 엣지 계산
  const { nodes: initialNodes, edges } = useMemo(() => {
    const centerX = 500;
    const centerY = 400;
    return calculateNodePositions(episodes, tasks, teamMembers, projects, centerX, centerY);
  }, [episodes, tasks, teamMembers, projects]);

  // 노드 위치 (드래그 적용)
  const nodes = useMemo(() => {
    return initialNodes.map((node) => ({
      ...node,
      x: nodePositions[node.id]?.x ?? node.x,
      y: nodePositions[node.id]?.y ?? node.y,
    }));
  }, [initialNodes, nodePositions]);

  // 필터링된 노드
  const filteredNodes = useMemo(() => {
    if (filterType === 'all') return nodes;
    return nodes.filter((n) => n.type === filterType);
  }, [nodes, filterType]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
  }, [edges, filteredNodes]);

  // 줌
  const handleZoom = useCallback((delta: number) => {
    setScale((s) => Math.max(0.3, Math.min(2, s + delta)));
  }, []);

  // 줌 리셋
  const handleResetView = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  // 노드 드래그 시작
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
  }, []);

  // 패닝 시작
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (draggingNode) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [draggingNode, offset]);

  // 마우스 이동
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (draggingNode) {
      const svg = svgRef.current;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / scale;
      const y = (e.clientY - rect.top - offset.y) / scale;

      setNodePositions((prev) => ({
        ...prev,
        [draggingNode]: { x, y },
      }));
    } else if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [draggingNode, isPanning, panStart, offset, scale]);

  // 마우스 업
  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
    setIsPanning(false);
  }, []);

  // 휠 줌
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -0.1 : 0.1);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleZoom]);

  // 선택된 노드 정보
  const selectedNodeData = selectedNode ? nodes.find((n) => n.id === selectedNode) : null;
  const selectedEpisode = selectedNodeData?.type === 'episode' ? episodes.find((e) => e.id === selectedNode) : null;
  const selectedTask = selectedNodeData?.type === 'task' ? tasks.find((t) => t.id === selectedNode) : null;
  const selectedMember = selectedNodeData?.type === 'member' ? teamMembers.find((m) => m.id === selectedNode) : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="h-[calc(100vh-160px)] flex gap-4"
    >
      {/* 메인 캔버스 */}
      <div
        ref={containerRef}
        className="flex-1 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden relative"
        onMouseDown={handlePanStart}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 툴바 */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <button
            onClick={() => handleZoom(0.2)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="확대"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="축소"
          >
            <ZoomOut size={18} />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={handleResetView}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="뷰 초기화"
          >
            <Maximize2 size={18} />
          </button>
        </div>

        {/* 필터 */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <Filter size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
            className="bg-transparent text-sm border-none focus:outline-none text-light-text dark:text-dark-text"
          >
            <option value="all">전체</option>
            <option value="episode">에피소드</option>
            <option value="task">태스크</option>
            <option value="member">팀원</option>
          </select>
        </div>

        {/* 줌 레벨 표시 */}
        <div className="absolute bottom-4 left-4 z-10 text-xs text-light-text-secondary dark:text-dark-text-secondary bg-light-bg/80 dark:bg-dark-bg/80 backdrop-blur-sm rounded px-2 py-1">
          {Math.round(scale * 100)}%
        </div>

        {/* SVG 캔버스 */}
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className={cn(
            'cursor-grab',
            isPanning && 'cursor-grabbing',
            draggingNode && 'cursor-grabbing'
          )}
        >
          <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
            {/* 엣지 */}
            {filteredEdges.map((edge, i) => {
              const fromNode = nodes.find((n) => n.id === edge.from);
              const toNode = nodes.find((n) => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const isHighlighted =
                selectedNode === edge.from || selectedNode === edge.to;

              return (
                <motion.line
                  key={`${edge.from}-${edge.to}-${i}`}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: isHighlighted ? 1 : 0.3 }}
                  transition={{ duration: 0.5, delay: i * 0.02 }}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isHighlighted ? fromNode.color : '#9CA3AF'}
                  strokeWidth={isHighlighted ? 2 : 1}
                  strokeDasharray={edge.type === 'assigned' ? '4 2' : undefined}
                />
              );
            })}

            {/* 노드 */}
            {filteredNodes.map((node) => (
              <NodeComponent
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                isDragging={draggingNode === node.id}
                onSelect={setSelectedNode}
                onDragStart={handleNodeDragStart}
                scale={scale}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* 사이드 패널 - 선택된 노드 정보 */}
      <div className="w-72 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-4 flex-shrink-0">
        <h3 className="font-semibold text-light-text dark:text-dark-text mb-4">노드 정보</h3>

        {!selectedNodeData && (
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
            노드를 클릭하여 상세 정보를 확인하세요.
          </p>
        )}

        {selectedEpisode && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedNodeData?.color }}
              />
              <span className="font-medium text-light-text dark:text-dark-text">
                {selectedEpisode.name}
              </span>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">진행률</span>
                <span className="font-medium">{selectedEpisode.progress}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">현재 단계</span>
                <span className="font-medium">{selectedEpisode.currentStage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">태스크 수</span>
                <span className="font-medium">{selectedEpisode.taskIds.length}개</span>
              </div>
            </div>
          </div>
        )}

        {selectedTask && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedNodeData?.color }}
              />
              <span className="font-medium text-light-text dark:text-dark-text">
                {selectedTask.title}
              </span>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">상태</span>
                <span className={cn(
                  'font-medium',
                  selectedTask.status === 'done' && 'text-green-500',
                  selectedTask.status === 'progress' && 'text-blue-500',
                  selectedTask.status === 'review' && 'text-amber-500'
                )}>
                  {selectedTask.status === 'done' ? '완료' :
                   selectedTask.status === 'progress' ? '진행 중' :
                   selectedTask.status === 'review' ? '검토 중' : '대기'}
                </span>
              </div>
              {selectedTask.assigneeId && (
                <div className="flex justify-between">
                  <span className="text-light-text-secondary dark:text-dark-text-secondary">담당자</span>
                  <span className="font-medium">
                    {teamMembers.find((m) => m.id === selectedTask.assigneeId)?.name || '-'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedMember && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedNodeData?.color }}
              />
              <span className="font-medium text-light-text dark:text-dark-text">
                {selectedMember.name}
              </span>
            </div>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">역할</span>
                <span className="font-medium">{selectedMember.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">상태</span>
                <span className={cn(
                  'font-medium',
                  selectedMember.status === 'working' && 'text-green-500',
                  selectedMember.status === 'review' && 'text-amber-500',
                  selectedMember.status === 'done' && 'text-indigo-500'
                )}>
                  {selectedMember.status === 'working' ? '작업 중' :
                   selectedMember.status === 'review' ? '검토 중' :
                   selectedMember.status === 'done' ? '완료' :
                   selectedMember.status === 'absent' ? '부재' : '대기'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-text-secondary dark:text-dark-text-secondary">할당 태스크</span>
                <span className="font-medium">
                  {tasks.filter((t) => t.assigneeId === selectedMember.id).length}개
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 범례 */}
        <div className="mt-6 pt-4 border-t border-light-border dark:border-dark-border">
          <h4 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3">
            범례
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <span>에피소드 (큰 원)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>태스크 (작은 원)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span>팀원 (외곽 원)</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-6 h-px bg-gray-400" />
              <span>연결선: 소속</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-px bg-gray-400" style={{ strokeDasharray: '4 2' }} />
              <span className="border-b border-dashed border-gray-400 w-6" />
              <span>점선: 담당</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

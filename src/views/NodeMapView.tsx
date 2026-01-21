import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Maximize2, Filter, Settings, Play, Pause } from 'lucide-react';
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
  vx: number;
  vy: number;
  color: string;
  status?: string;
  progress?: number;
}

interface Edge {
  from: string;
  to: string;
  type: 'contains' | 'assigned' | 'dependency';
}

interface PhysicsSettings {
  springStiffness: number;
  springLength: number;
  repulsion: number;
  gravity: number;
  damping: number;
}

const DEFAULT_PHYSICS: PhysicsSettings = {
  springStiffness: 0.03,
  springLength: 100,
  repulsion: 5000,
  gravity: 0.02,
  damping: 0.85,
};

// 초기 노드 위치 계산 (원형 레이아웃)
function calculateInitialPositions(
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
  const episodeRadius = 180;
  episodes.forEach((ep, i) => {
    const angle = (2 * Math.PI * i) / episodes.length - Math.PI / 2;
    const project = projects.find((p) => p.id === ep.projectId);
    nodes.push({
      id: ep.id,
      type: 'episode',
      label: ep.name,
      x: centerX + episodeRadius * Math.cos(angle),
      y: centerY + episodeRadius * Math.sin(angle),
      vx: 0,
      vy: 0,
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
      const taskAngle = epAngle + ((taskIndex - (epTasks.length - 1) / 2) * 0.4);
      const taskX = epX + taskRadius * Math.cos(taskAngle);
      const taskY = epY + taskRadius * Math.sin(taskAngle);

      nodes.push({
        id: task.id,
        type: 'task',
        label: task.title,
        x: taskX,
        y: taskY,
        vx: 0,
        vy: 0,
        color: project?.color || '#6B7280',
        status: task.status,
      });

      edges.push({ from: ep.id, to: task.id, type: 'contains' });

      if (task.assigneeId) {
        edges.push({ from: task.id, to: task.assigneeId, type: 'assigned' });
      }
    });
  });

  // 팀원 노드 (외곽 원)
  const memberRadius = 320;
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
      vx: 0,
      vy: 0,
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

export function NodeMapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);

  const { episodes, projects } = useProjectStore();
  const { tasks } = useTaskStore();
  const { members: teamMembers } = useTeamStore();

  const [scale, setScale] = useState(0.9);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [physics, setPhysics] = useState<PhysicsSettings>(DEFAULT_PHYSICS);
  const [filterType, setFilterType] = useState<'all' | 'episode' | 'task' | 'member'>('all');

  // 초기 노드 계산
  useEffect(() => {
    const centerX = 450;
    const centerY = 350;
    const { nodes: initialNodes, edges: initialEdges } = calculateInitialPositions(
      episodes, tasks, teamMembers, projects, centerX, centerY
    );
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [episodes, tasks, teamMembers, projects]);

  // 물리 시뮬레이션
  useEffect(() => {
    if (!isSimulating || nodes.length === 0) return;

    const simulate = () => {
      setNodes((prevNodes) => {
        const newNodes = prevNodes.map((node) => ({ ...node }));
        const centerX = 450;
        const centerY = 350;

        // 힘 계산
        newNodes.forEach((node, i) => {
          if (draggingNode === node.id) return;

          let fx = 0;
          let fy = 0;

          // 중력 (중심으로 끌어당김)
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          fx += dx * physics.gravity;
          fy += dy * physics.gravity;

          // 반발력 (다른 노드들과)
          newNodes.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = physics.repulsion / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          });

          // 스프링 힘 (연결된 노드들과)
          edges.forEach((edge) => {
            let other: Node | undefined;
            if (edge.from === node.id) {
              other = newNodes.find((n) => n.id === edge.to);
            } else if (edge.to === node.id) {
              other = newNodes.find((n) => n.id === edge.from);
            }
            if (other) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const displacement = dist - physics.springLength;
              const force = displacement * physics.springStiffness;
              fx += (dx / dist) * force;
              fy += (dy / dist) * force;
            }
          });

          // 속도 업데이트
          node.vx = (node.vx + fx) * physics.damping;
          node.vy = (node.vy + fy) * physics.damping;

          // 위치 업데이트
          node.x += node.vx;
          node.y += node.vy;
        });

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSimulating, edges, physics, draggingNode, nodes.length]);

  // 필터링된 노드와 엣지
  const filteredNodes = useMemo(() => {
    if (filterType === 'all') return nodes;
    return nodes.filter((n) => n.type === filterType);
  }, [nodes, filterType]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));
  }, [edges, filteredNodes]);

  // 연결된 노드 ID 목록
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode && !selectedNode) return new Set<string>();
    const targetId = hoveredNode || selectedNode;
    const ids = new Set<string>([targetId!]);
    edges.forEach((e) => {
      if (e.from === targetId) ids.add(e.to);
      if (e.to === targetId) ids.add(e.from);
    });
    return ids;
  }, [hoveredNode, selectedNode, edges]);

  // 줌
  const handleZoom = useCallback((delta: number) => {
    setScale((s) => Math.max(0.3, Math.min(2, s + delta)));
  }, []);

  const handleResetView = useCallback(() => {
    setScale(0.9);
    setOffset({ x: 0, y: 0 });
  }, []);

  // 노드 드래그
  const handleNodeDragStart = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
  }, []);

  // 패닝
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

      setNodes((prev) =>
        prev.map((node) =>
          node.id === draggingNode ? { ...node, x, y, vx: 0, vy: 0 } : node
        )
      );
    } else if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [draggingNode, isPanning, panStart, offset, scale]);

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

  // 노드 크기
  const getNodeSize = (type: string) => {
    switch (type) {
      case 'episode': return 50;
      case 'task': return 32;
      case 'member': return 28;
      default: return 30;
    }
  };

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
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-light-bg/90 dark:bg-dark-bg/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
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
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isSimulating ? "bg-green-100 dark:bg-green-900/30 text-green-600" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
            title={isSimulating ? "시뮬레이션 중지" : "시뮬레이션 시작"}
          >
            {isSimulating ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showSettings ? "bg-brand-primary/20 text-brand-primary" : "hover:bg-gray-100 dark:hover:bg-gray-700"
            )}
            title="물리 설정"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* 필터 */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-light-bg/90 dark:bg-dark-bg/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
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

        {/* 물리 설정 패널 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute top-16 left-4 z-10 bg-light-bg/95 dark:bg-dark-bg/95 backdrop-blur-sm rounded-lg p-4 shadow-lg w-64"
            >
              <h4 className="font-medium text-sm mb-3 text-light-text dark:text-dark-text">물리 설정</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-light-text-secondary dark:text-dark-text-secondary block mb-1">
                    장력 (Spring): {physics.springStiffness.toFixed(3)}
                  </label>
                  <input
                    type="range"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={physics.springStiffness}
                    onChange={(e) => setPhysics((p) => ({ ...p, springStiffness: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-text-secondary dark:text-dark-text-secondary block mb-1">
                    스프링 길이: {physics.springLength}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="10"
                    value={physics.springLength}
                    onChange={(e) => setPhysics((p) => ({ ...p, springLength: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-text-secondary dark:text-dark-text-secondary block mb-1">
                    반발력: {physics.repulsion}
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="15000"
                    step="500"
                    value={physics.repulsion}
                    onChange={(e) => setPhysics((p) => ({ ...p, repulsion: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-text-secondary dark:text-dark-text-secondary block mb-1">
                    중력: {physics.gravity.toFixed(3)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.1"
                    step="0.005"
                    value={physics.gravity}
                    onChange={(e) => setPhysics((p) => ({ ...p, gravity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-light-text-secondary dark:text-dark-text-secondary block mb-1">
                    감쇠: {physics.damping.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="0.99"
                    step="0.01"
                    value={physics.damping}
                    onChange={(e) => setPhysics((p) => ({ ...p, damping: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <button
                  onClick={() => setPhysics(DEFAULT_PHYSICS)}
                  className="w-full text-xs py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  기본값으로 초기화
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 줌 레벨 */}
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

              const isHighlighted = connectedNodeIds.has(edge.from) && connectedNodeIds.has(edge.to);

              return (
                <motion.line
                  key={`${edge.from}-${edge.to}-${i}`}
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={isHighlighted ? fromNode.color : '#9CA3AF'}
                  strokeWidth={isHighlighted ? 2.5 : 1}
                  strokeOpacity={isHighlighted ? 0.8 : 0.2}
                  strokeDasharray={edge.type === 'assigned' ? '6 3' : undefined}
                />
              );
            })}

            {/* 노드 */}
            {filteredNodes.map((node) => {
              const size = getNodeSize(node.type);
              const isHovered = hoveredNode === node.id;
              const isSelected = selectedNode === node.id;
              const isConnected = connectedNodeIds.has(node.id);
              const isHighlighted = isHovered || isSelected || isConnected;

              return (
                <motion.g
                  key={node.id}
                  animate={{
                    scale: isHovered ? 1.2 : 1,
                    y: isHovered ? -5 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  style={{ cursor: draggingNode === node.id ? 'grabbing' : 'grab' }}
                  onMouseDown={(e) => handleNodeDragStart(node.id, e)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                >
                  {/* 그림자/글로우 효과 */}
                  {isHovered && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size / 2 + 12}
                      fill={node.color}
                      fillOpacity={0.15}
                      className="blur-sm"
                    />
                  )}

                  {/* 선택 링 */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={size / 2 + 6}
                      fill="none"
                      stroke={node.color}
                      strokeWidth={2}
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* 메인 노드 */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={size / 2}
                    fill={node.color}
                    fillOpacity={isHighlighted ? 1 : 0.7}
                    stroke={isHighlighted ? 'white' : 'transparent'}
                    strokeWidth={isHighlighted ? 2 : 0}
                    filter={isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' : undefined}
                  />

                  {/* 진행률 (에피소드) */}
                  {node.type === 'episode' && node.progress !== undefined && (
                    <>
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={size / 2 - 4}
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth={3}
                        strokeDasharray={`${(node.progress / 100) * Math.PI * (size - 8)} ${Math.PI * (size - 8)}`}
                        transform={`rotate(-90 ${node.x} ${node.y})`}
                      />
                      <text
                        x={node.x}
                        y={node.y + 4}
                        textAnchor="middle"
                        fill="white"
                        fontSize={11}
                        fontWeight="bold"
                      >
                        {node.progress}%
                      </text>
                    </>
                  )}

                  {/* 내부 원 (태스크/멤버) */}
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
                    fill="currentColor"
                    className="text-light-text dark:text-dark-text"
                    fontSize={11}
                    fontWeight={node.type === 'episode' ? 600 : 400}
                    opacity={isHighlighted ? 1 : 0.6}
                  >
                    {node.label.length > 12 ? node.label.slice(0, 12) + '...' : node.label}
                  </text>
                </motion.g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 사이드 패널 */}
      <div className="w-72 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border p-4 flex-shrink-0 overflow-y-auto">
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
          <div className="space-y-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-400" />
              <span>에피소드</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-gray-400" />
              <span>태스크</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>팀원</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-8 h-0.5 bg-gray-400" />
              <span>실선: 소속</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-gray-400 border-b border-dashed" style={{ borderStyle: 'dashed' }} />
              <span>점선: 담당</span>
            </div>
          </div>
        </div>

        {/* 단축키 안내 */}
        <div className="mt-4 pt-4 border-t border-light-border dark:border-dark-border text-xs text-light-text-secondary dark:text-dark-text-secondary">
          <p>휠: 확대/축소</p>
          <p>드래그: 캔버스 이동</p>
          <p>노드 드래그: 노드 이동</p>
        </div>
      </div>
    </motion.div>
  );
}

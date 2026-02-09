# Phase 5: 고급 기능

> 노드맵, 노션 연동, Slack 웹훅

---

## 목표

Phase 5가 완료되면:
- 옵시디언 스타일 그래프 뷰 노드맵
- 에피소드/태스크/팀원 관계 시각화
- 노드 드래그, 줌/팬
- (옵션) 노션 북마크 연동
- (옵션) Slack 알림

---

## Step 5.1: 노드맵 뷰

### src/views/NodeMapView.tsx

```typescript
import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { useTeamStore } from '../stores/useTeamStore';
import { subscribeToEpisodes, subscribeToTasks } from '../services/projects';
import { subscribeToTeamMembers } from '../services/team';
import { NodeMap } from '../components/nodemap/NodeMap';
import { NodeMapControls } from '../components/nodemap/NodeMapControls';

export function NodeMapView() {
  const { setEpisodes, setTasks, episodes, tasks } = useProjectStore();
  const { setMembers, members } = useTeamStore();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const unsubEpisodes = subscribeToEpisodes(null, setEpisodes);
    const unsubTasks = subscribeToTasks(setTasks);
    const unsubMembers = subscribeToTeamMembers(setMembers);

    return () => {
      unsubEpisodes();
      unsubTasks();
      unsubMembers();
    };
  }, [setEpisodes, setTasks, setMembers]);

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-xl overflow-hidden">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">노드맵</h2>
          <p className="text-sm text-gray-400">
            {episodes.length}개 에피소드 · {tasks.length}개 태스크 · {members.length}명
          </p>
        </div>
        <NodeMapControls zoom={zoom} onZoomChange={setZoom} />
      </div>

      {/* 노드맵 캔버스 */}
      <div className="flex-1 relative">
        <NodeMap
          episodes={episodes}
          tasks={tasks}
          members={members}
          zoom={zoom}
        />
      </div>
    </div>
  );
}
```

---

## Step 5.2: 노드맵 컨트롤

### src/components/nodemap/NodeMapControls.tsx

```typescript
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface NodeMapControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export function NodeMapControls({ zoom, onZoomChange }: NodeMapControlsProps) {
  const handleZoomIn = () => onZoomChange(Math.min(zoom + 0.2, 2));
  const handleZoomOut = () => onZoomChange(Math.max(zoom - 0.2, 0.5));
  const handleReset = () => onZoomChange(1);

  return (
    <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
      <button
        onClick={handleZoomOut}
        className="p-2 hover:bg-gray-600 rounded transition-colors"
        title="축소"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <span className="px-2 text-sm text-gray-400 min-w-[50px] text-center">
        {Math.round(zoom * 100)}%
      </span>

      <button
        onClick={handleZoomIn}
        className="p-2 hover:bg-gray-600 rounded transition-colors"
        title="확대"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-gray-600" />

      <button
        onClick={handleReset}
        className="p-2 hover:bg-gray-600 rounded transition-colors"
        title="초기화"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
    </div>
  );
}
```

---

## Step 5.3: 노드맵 메인 컴포넌트

### src/components/nodemap/NodeMap.tsx

```typescript
import { useRef, useEffect, useState, useCallback } from 'react';
import { Episode, Task, TeamMember } from '../../types';
import { Node } from './Node';
import { Edge } from './Edge';

interface NodeMapProps {
  episodes: Episode[];
  tasks: Task[];
  members: TeamMember[];
  zoom: number;
}

interface NodeData {
  id: string;
  type: 'episode' | 'task' | 'person';
  label: string;
  x: number;
  y: number;
  color?: string;
  avatar?: string;
}

interface EdgeData {
  from: string;
  to: string;
  type: 'dependency' | 'assigned' | 'sequence';
}

export function NodeMap({ episodes, tasks, members, zoom }: NodeMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // 데이터를 노드/엣지로 변환
  useEffect(() => {
    const newNodes: NodeData[] = [];
    const newEdges: EdgeData[] = [];

    // 에피소드 노드 (중앙 상단)
    episodes.forEach((ep, i) => {
      newNodes.push({
        id: `ep-${ep.id}`,
        type: 'episode',
        label: ep.name,
        x: 200 + i * 250,
        y: 100,
        color: '#F0E68C',
      });
    });

    // 태스크 노드 (에피소드 아래)
    tasks.forEach((task, i) => {
      const parentEp = episodes.find((ep) => ep.id === task.episodeId);
      const parentNode = newNodes.find((n) => n.id === `ep-${task.episodeId}`);

      newNodes.push({
        id: `task-${task.id}`,
        type: 'task',
        label: task.title,
        x: parentNode ? parentNode.x + (i % 3 - 1) * 100 : 300 + i * 120,
        y: parentNode ? parentNode.y + 150 + Math.floor(i / 3) * 80 : 250,
        color: task.status === 'done' ? '#22C55E' : task.status === 'progress' ? '#F59E0B' : '#6B7280',
      });

      // 에피소드 → 태스크 연결
      if (parentEp) {
        newEdges.push({
          from: `ep-${task.episodeId}`,
          to: `task-${task.id}`,
          type: 'sequence',
        });
      }

      // 태스크 → 담당자 연결
      if (task.assigneeId) {
        newEdges.push({
          from: `task-${task.id}`,
          to: `person-${task.assigneeId}`,
          type: 'assigned',
        });
      }
    });

    // 팀원 노드 (오른쪽)
    members.forEach((member, i) => {
      newNodes.push({
        id: `person-${member.id}`,
        type: 'person',
        label: member.name,
        x: 700,
        y: 100 + i * 80,
        avatar: member.avatar,
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [episodes, tasks, members]);

  // 노드 드래그
  const handleNodeDrag = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y } : n))
    );
  }, []);

  // 팬 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // 팬 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  // 팬 종료
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        className="w-full h-full"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          transformOrigin: 'center center',
        }}
      >
        {/* 배경 그리드 */}
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* 엣지 (연결선) */}
        {edges.map((edge, i) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          return (
            <Edge
              key={i}
              from={fromNode}
              to={toNode}
              type={edge.type}
            />
          );
        })}

        {/* 노드 */}
        {nodes.map((node) => (
          <Node
            key={node.id}
            node={node}
            onDrag={(x, y) => handleNodeDrag(node.id, x, y)}
          />
        ))}
      </svg>
    </div>
  );
}
```

---

## Step 5.4: 노드 컴포넌트

### src/components/nodemap/Node.tsx

```typescript
import { useState, useRef } from 'react';

interface NodeProps {
  node: {
    id: string;
    type: 'episode' | 'task' | 'person';
    label: string;
    x: number;
    y: number;
    color?: string;
    avatar?: string;
  };
  onDrag: (x: number, y: number) => void;
}

export function Node({ node, onDrag }: NodeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onDrag(
        e.clientX - dragOffset.current.x,
        e.clientY - dragOffset.current.y
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getNodeSize = () => {
    switch (node.type) {
      case 'episode': return 60;
      case 'task': return 40;
      case 'person': return 50;
      default: return 40;
    }
  };

  const size = getNodeSize();

  return (
    <g
      transform={`translate(${node.x}, ${node.y})`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* 호버 시 글로우 효과 */}
      {isHovered && (
        <circle
          r={size / 2 + 8}
          fill="none"
          stroke={node.color || '#F0E68C'}
          strokeWidth="2"
          opacity="0.3"
        />
      )}

      {/* 메인 원 */}
      {node.type === 'person' && node.avatar ? (
        <clipPath id={`avatar-${node.id}`}>
          <circle r={size / 2} />
        </clipPath>
      ) : null}

      <circle
        r={size / 2}
        fill={node.color || '#374151'}
        stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.2)'}
        strokeWidth={isHovered ? 2 : 1}
      />

      {/* 아바타 이미지 (person) */}
      {node.type === 'person' && node.avatar && (
        <image
          href={node.avatar}
          x={-size / 2}
          y={-size / 2}
          width={size}
          height={size}
          clipPath={`url(#avatar-${node.id})`}
        />
      )}

      {/* 아이콘 또는 텍스트 */}
      {node.type !== 'person' && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={node.type === 'episode' ? 14 : 10}
          fontWeight={node.type === 'episode' ? 600 : 400}
        >
          {node.type === 'episode' ? 'EP' : '●'}
        </text>
      )}

      {/* 라벨 */}
      <text
        y={size / 2 + 16}
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontWeight="500"
      >
        {node.label.length > 12 ? node.label.slice(0, 12) + '...' : node.label}
      </text>
    </g>
  );
}
```

---

## Step 5.5: 엣지 컴포넌트

### src/components/nodemap/Edge.tsx

```typescript
interface EdgeProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'dependency' | 'assigned' | 'sequence';
}

export function Edge({ from, to, type }: EdgeProps) {
  const color = {
    dependency: '#EF4444',
    assigned: '#3B82F6',
    sequence: 'rgba(255,255,255,0.3)',
  }[type];

  const strokeDash = type === 'assigned' ? '5,5' : undefined;

  // 베지어 곡선 제어점
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const curvature = 0.2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const controlX = midX - dy * curvature;
  const controlY = midY + dx * curvature;

  const pathD = `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;

  return (
    <path
      d={pathD}
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeDasharray={strokeDash}
      markerEnd="url(#arrowhead)"
    />
  );
}
```

---

## Step 5.6: Slack 웹훅 서비스

### src/services/slack.ts

```typescript
interface SlackMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_emoji?: string;
  blocks?: any[];
}

export async function sendSlackNotification(
  webhookUrl: string,
  message: SlackMessage
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message.text,
        username: message.username || 'Bflow',
        icon_emoji: message.icon_emoji || ':calendar:',
        ...message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Slack notification failed:', error);
    return false;
  }
}

// 마감 리마인더 발송
export async function sendDeadlineReminder(
  webhookUrl: string,
  episodeName: string,
  daysLeft: number,
  assignees: string[]
): Promise<void> {
  const urgency = daysLeft <= 1 ? ':rotating_light:' : daysLeft <= 3 ? ':warning:' : ':calendar:';

  await sendSlackNotification(webhookUrl, {
    text: `${urgency} *${episodeName}* 마감 D-${daysLeft}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${urgency} *${episodeName}* 마감까지 *${daysLeft}일* 남았습니다.`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `담당: ${assignees.join(', ') || '미지정'}`,
          },
        ],
      },
    ],
  });
}

// 공유 알림
export async function sendShareNotification(
  webhookUrl: string,
  sharedBy: string,
  itemTitle: string,
  sharedWith: string[]
): Promise<void> {
  await sendSlackNotification(webhookUrl, {
    text: `📤 ${sharedBy}님이 "${itemTitle}"을(를) 공유했습니다.`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📤 *${sharedBy}*님이 *${itemTitle}*을(를) 공유했습니다.`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `공유 대상: ${sharedWith.join(', ')}`,
          },
        ],
      },
    ],
  });
}
```

---

## Step 5.7: 노션 연동 (옵션)

### src/services/notion.ts

```typescript
// 노션 API 연동은 서버 사이드에서 처리하는 것이 권장됩니다.
// 클라이언트에서 직접 호출 시 CORS 문제가 발생할 수 있습니다.
// 이 파일은 Firebase Functions 또는 별도 백엔드에서 구현할 참고용입니다.

interface NotionBookmark {
  id: string;
  category: string;
  name: string;
  url: string;
}

// 노션 데이터베이스 조회 (서버 사이드용)
export async function fetchNotionBookmarks(
  notionToken: string,
  databaseId: string
): Promise<NotionBookmark[]> {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_size: 100,
      }),
    }
  );

  const data = await response.json();

  return data.results.map((page: any) => ({
    id: page.id,
    category: page.properties.Category?.select?.name || '',
    name: page.properties.Name?.title?.[0]?.plain_text || '',
    url: page.properties.URL?.url || '',
  }));
}

// 클라이언트 사용 시 프록시 필요
// Firebase Functions 예시:
/*
exports.fetchNotionBookmarks = functions.https.onCall(async (data, context) => {
  const { databaseId } = data;
  const notionToken = functions.config().notion.token;

  // 위 함수 호출
  return await fetchNotionBookmarks(notionToken, databaseId);
});
*/
```

---

## Phase 5 완료 체크리스트

- [ ] NodeMapView 페이지 구현
- [ ] NodeMapControls 컴포넌트 구현
- [ ] NodeMap 메인 컴포넌트 구현
- [ ] Node 컴포넌트 구현
- [ ] Edge 컴포넌트 구현
- [ ] 노드 드래그 기능 구현
- [ ] 줌/팬 기능 구현
- [ ] Slack 서비스 구현
- [ ] (옵션) 노션 연동 설계
- [ ] 노드맵에서 관계 시각화 확인
- [ ] 노드 드래그 동작 확인
- [ ] 줌/팬 동작 확인

import React, { useEffect, useRef } from 'react';
import { FileJson } from 'lucide-react';

interface TableInfo {
    table_name: string;
    access_type: string;
    rows_examined_per_scan?: number;
    filtered?: string;
    cost_info?: {
        read_cost: string;
        eval_cost: string;
        prefix_cost: string;
    };
}

interface QueryBlock {
    select_id: number;
    cost_info: {
        query_cost: string;
    };
    ordering_operation?: {
        using_temporary_table?: boolean;
        using_filesort?: boolean;
        nested_loop?: Array<{
            table: TableInfo;
        }>;
    };
}

interface NodeData {
    id: string;
    label: string;
    cost?: string;
    rows?: number;
    filtered?: string;
    width: number;
    height: number;
    x?: number;
    y?: number;
    level: number;
    childNodes: string[];
}

interface EdgeData {
    source: string;
    target: string;
}

const CANVAS_CONFIG = {
    width: 1900,
    height: 300,
    horizontalGap: 180,  // 가로 간격 축소
    verticalGap: 110,    // 세로 간격 증가
    startX: 120,
    levelY: {            // 각 레벨별 고정 Y 위치
        0: 50,           // Select
        1: 50,           // Ordering Operation
        2: 50,          // Nested Loops
        3: 50,          // Tables
    }
} as const;

const NODE_STYLE = {
    width: 200,
    height: 80,
} as const;

export function QueryPlanVisualization({ explainResult }: { explainResult: { json: { query_block: QueryBlock } } }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !explainResult?.json) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 캔버스 초기화
        canvas.width = CANVAS_CONFIG.width;
        canvas.height = CANVAS_CONFIG.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { nodes, edges } = parseQueryPlan(explainResult.json.query_block);
        calculateLayout(nodes);
        drawVisualization(ctx, nodes, edges);
    }, [explainResult]);

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4 flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Query Execution Plan
            </h3>
            <canvas
                ref={canvasRef}
                className="w-full border border-gray-200 rounded-lg"
                style={{ maxWidth: `${CANVAS_CONFIG.width}px`, height: `${CANVAS_CONFIG.height}px` }}
            />
        </div>
    );
}

function parseQueryPlan(queryBlock: QueryBlock): { nodes: NodeData[], edges: EdgeData[] } {
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];

    function addNode(label: string, level: number, options: Partial<NodeData> = {}): string {
        const id = `node_${nodes.length}`;
        nodes.push({
            id,
            label,
            width: NODE_STYLE.width,
            height: NODE_STYLE.height,
            level,
            childNodes: [],
            ...options
        });
        return id;
    }

    function addEdge(source: string, target: string) {
        edges.push({ source, target });
        const sourceNode = nodes.find(n => n.id === source);
        if (sourceNode) {
            sourceNode.childNodes.push(target);
        }
    }

    // Root 노드 (Select)
    const rootId = addNode('Select', 0, {
        cost: queryBlock.cost_info.query_cost
    });

    if (queryBlock.ordering_operation) {
        // Ordering Operation 노드
        const orderingId = addNode('Ordering_Operation', 1);
        addEdge(rootId, orderingId);

        if (queryBlock.ordering_operation.nested_loop) {
            const loops = queryBlock.ordering_operation.nested_loop;

            // 첫 번째 Nested Loop
            const firstLoopId = addNode('Nested_Loop#1', 2);
            addEdge(orderingId, firstLoopId);

            if (loops[0]?.table) {
                const table = loops[0].table;
                const tableId = addNode(`${table.table_name} (${table.access_type})`, 3, {
                    rows: table.rows_examined_per_scan,
                    filtered: table.filtered
                });
                addEdge(firstLoopId, tableId);
            }

            // 두 번째 Nested Loop (있는 경우)
            if (loops[1]) {
                const secondLoopId = addNode('Nested_Loop#2', 2);
                addEdge(orderingId, secondLoopId);

                if (loops[1].table) {
                    const table = loops[1].table;
                    const tableId = addNode(`${table.table_name} (${table.access_type})`, 3, {
                        rows: table.rows_examined_per_scan,
                        filtered: table.filtered
                    });
                    addEdge(secondLoopId, tableId);
                }
            }
        }
    }

    return { nodes, edges };
}

function calculateLayout(nodes: NodeData[]) {
    // 특별한 레이아웃 계산
    nodes.forEach(node => {
        // Y 위치는 레벨에 따라 고정
        node.y = CANVAS_CONFIG.levelY[node.level as keyof typeof CANVAS_CONFIG.levelY];

        // X 위치 계산
        switch(node.label) {
            case 'Select':
                node.x = CANVAS_CONFIG.startX;
                break;
            case 'Ordering_Operation':
                node.x = CANVAS_CONFIG.startX + NODE_STYLE.width + CANVAS_CONFIG.horizontalGap;
                break;
            case 'Nested_Loop#1':
                node.x = CANVAS_CONFIG.startX + (NODE_STYLE.width + CANVAS_CONFIG.horizontalGap) * 2;
                break;
            case 'Nested_Loop#2':
                node.x = CANVAS_CONFIG.startX + (NODE_STYLE.width + CANVAS_CONFIG.horizontalGap) * 2;
                node.y = CANVAS_CONFIG.levelY[2] + CANVAS_CONFIG.verticalGap; // 아래쪽에 배치
                break;
            default:
                // 테이블 노드들
                if (node.label.includes('(')) {
                    const parentNode = nodes.find(n => n.childNodes.includes(node.id));
                    if (parentNode) {
                        node.x = parentNode.x + NODE_STYLE.width + CANVAS_CONFIG.horizontalGap;
                        node.y = parentNode.y;
                    }
                }
        }
    });
}

function drawNode(ctx: CanvasRenderingContext2D, node: NodeData) {
    const { x = 0, y = 0 } = node;

    // 그림자 효과
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 노드 색상 설정
    let barColor = '#e63946';  // 기본 색상 (Select)
    if (node.label.includes('Ordering')) {
        barColor = '#457b9d';
    } else if (node.label.includes('Nested_Loop')) {
        barColor = '#2a9d8f';
    } else if (node.label.includes('(')) {  // 테이블 노드
        barColor = '#f4a261';
    }

    // 노드 배경
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y, node.width, node.height);

    // 노드 테두리와 왼쪽 바
    ctx.strokeStyle = barColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, node.width, node.height);
    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, 5, node.height);

    // 그림자 제거
    ctx.shadowColor = 'transparent';

    // 텍스트 설정
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';

    // 라벨
    ctx.font = 'bold 12px Arial';
    ctx.fillText(node.label, x + 10, y + 20);

    // 추가 정보
    ctx.font = '12px Arial';
    if (node.cost) {
        ctx.fillText(`Cost: ${node.cost}`, x + 10, y + 40);
    }
    if (node.rows) {
        ctx.fillText(`Rows: ${node.rows}`, x + 10, y + 55);
    }
    if (node.filtered) {
        ctx.fillText(`Filtered: ${node.filtered}%`, x + 10, y + 70);
    }
}

function drawEdge(ctx: CanvasRenderingContext2D, source: NodeData, target: NodeData) {
    const { x: sx = 0, y: sy = 0 } = source;
    const { x: tx = 0, y: ty = 0 } = target;

    const startX = sx + source.width;
    const startY = sy + NODE_STYLE.height / 2;
    const endX = tx;
    const endY = ty + NODE_STYLE.height / 2;

    // 연결선 그리기
    ctx.beginPath();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;

    // 직선 또는 부드러운 곡선
    if (Math.abs(startY - endY) < 10) {
        // 거의 같은 높이면 직선
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
    } else {
        // 높이 차이가 있으면 부드러운 곡선
        const controlX1 = startX + (endX - startX) * 0.4;
        const controlX2 = startX + (endX - startX) * 0.6;
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(controlX1, startY, controlX2, endY, endX, endY);
    }
    ctx.stroke();

    // 화살표
    const arrowSize = 8;
    ctx.beginPath();
    ctx.moveTo(endX - arrowSize, endY - arrowSize);
    ctx.lineTo(endX, endY);
    ctx.lineTo(endX + arrowSize, endY - arrowSize);
    ctx.stroke();
}

function drawVisualization(ctx: CanvasRenderingContext2D, nodes: NodeData[], edges: EdgeData[]) {
    // 먼저 엣지 그리기
    edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (source && target) {
            drawEdge(ctx, source, target);
        }
    });

    // 그 다음 노드 그리기
    nodes.forEach(node => {
        drawNode(ctx, node);
    });
}
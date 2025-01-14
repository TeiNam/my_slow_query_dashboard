import React, { useEffect, useRef } from 'react';
import { FileJson } from 'lucide-react';

interface QueryPlanVisualizationProps {
    explainResult: {
        json: {
            query_block: {
                select_id: number;
                cost_info: { query_cost: string };
                ordering_operation: {
                    using_temporary_table: boolean;
                    using_filesort: boolean;
                    nested_loop: Array<{
                        table: {
                            table_name: string;
                            access_type: string;
                            rows_examined_per_scan: number;
                            filtered: string;
                            cost_info: {
                                read_cost: string;
                                eval_cost: string;
                                prefix_cost: string;
                            };
                        };
                    }>;
                };
            };
        };
        tree: string;
    };
}

interface NodeData {
    id: string;
    label: string;
    cost?: string;
    rows?: number;
    filtered?: number;
    width: number;
    height: number;
    x?: number;
    y?: number;
    level: number;
}

interface EdgeData {
    source: string;
    target: string;
}

export function QueryPlanVisualization({ explainResult }: QueryPlanVisualizationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasRef.current || !explainResult?.json) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = 1200;
        canvas.height = 400;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Parse the query plan
        const queryBlock = explainResult.json.query_block;
        const { nodes, edges } = parseQueryPlan(queryBlock);

        // Calculate layout
        calculateLayout(nodes, canvas.width, canvas.height);

        // Draw the visualization
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
                style={{ maxWidth: '1200px', height: '400px' }}
            />
        </div>
    );
}

function parseQueryPlan(queryBlock: any): { nodes: NodeData[], edges: EdgeData[] } {
    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];

    // Select node
    const selectId = `node_${nodes.length}`;
    nodes.push({
        id: selectId,
        label: 'Select',
        cost: queryBlock.cost_info.query_cost,
        width: 180,
        height: 80,
        level: 0
    });

    if (queryBlock.ordering_operation) {
        // Ordering Operation node
        const orderingId = `node_${nodes.length}`;
        nodes.push({
            id: orderingId,
            label: 'Ordering Operation',
            width: 180,
            height: 80,
            level: 1
        });
        edges.push({ source: selectId, target: orderingId });

        // Nested Loop nodes
        const nestedLoop1Id = `node_${nodes.length}`;
        nodes.push({
            id: nestedLoop1Id,
            label: 'Nested Loop #1',
            width: 180,
            height: 80,
            level: 2
        });
        edges.push({ source: orderingId, target: nestedLoop1Id });

        // Table nodes from nested loop
        queryBlock.ordering_operation.nested_loop.forEach((loop, index) => {
            const tableId = `node_${nodes.length}`;
            const parentId = nestedLoop1Id;

            nodes.push({
                id: tableId,
                label: `${loop.table.table_name} (${loop.table.access_type})`,
                cost: loop.table.cost_info.prefix_cost,
                rows: loop.table.rows_examined_per_scan,
                filtered: parseFloat(loop.table.filtered || '0'),
                width: 180,
                height: 80,
                level: 3
            });
            edges.push({ source: parentId, target: tableId });
        });
    }

    return { nodes, edges };
}

function calculateLayout(nodes: NodeData[], canvasWidth: number, canvasHeight: number) {
    // Group nodes by level
    const levelGroups = nodes.reduce((groups: { [key: number]: NodeData[] }, node) => {
        if (!groups[node.level]) groups[node.level] = [];
        groups[node.level].push(node);
        return groups;
    }, {});

    // 간격 조정
    const horizontalGap = 300;  // 200에서 300으로 증가
    const verticalGap = 160;    // 120에서 160으로 증가
    const startX = 100;         // 50에서 100으로 증가

    Object.entries(levelGroups).forEach(([level, levelNodes]) => {
        const levelNum = parseInt(level);
        const totalHeight = levelNodes.length * 80 + (levelNodes.length - 1) * verticalGap;
        const startY = (canvasHeight - totalHeight) / 2;

        levelNodes.forEach((node, index) => {
            node.x = startX + levelNum * horizontalGap;
            node.y = startY + index * verticalGap;
        });
    });
}

function drawVisualization(ctx: CanvasRenderingContext2D, nodes: NodeData[], edges: EdgeData[]) {
    // Draw edges first
    edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);

        if (source && target && source.x !== undefined && source.y !== undefined &&
            target.x !== undefined && target.y !== undefined) {
            drawEdge(ctx, source, target);
        }
    });

    // Draw nodes
    nodes.forEach(node => {
        if (node.x !== undefined && node.y !== undefined) {
            drawNode(ctx, node);
        }
    });
}

function drawNode(ctx: CanvasRenderingContext2D, node: NodeData) {
    // Draw shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // Draw node background
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 2;

    // Draw red bar on the left
    ctx.fillStyle = '#e63946';
    ctx.fillRect(node.x, node.y, 5, node.height);

    // Draw main box
    ctx.fillStyle = '#fff';
    ctx.fillRect(node.x + 5, node.y, node.width - 5, node.height);
    ctx.strokeRect(node.x, node.y, node.width, node.height);

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Draw node content
    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(node.label, node.x + 10, node.y + 20);

    // Draw metrics
    ctx.font = '11px Arial';
    if (node.cost) {
        ctx.fillText(`Cost: ${node.cost}`, node.x + 10, node.y + 40);
    }
    if (node.rows !== undefined) {
        ctx.fillText(`Rows: ${node.rows}`, node.x + 10, node.y + 55);
    }
    if (node.filtered !== undefined) {
        ctx.fillText(`Filtered: ${node.filtered}%`, node.x + 10, node.y + 70);
    }
}

function drawEdge(ctx: CanvasRenderingContext2D, source: NodeData, target: NodeData) {
    ctx.strokeStyle = '#2a9d8f';
    ctx.lineWidth = 2;

    const startX = source.x + source.width;
    const startY = source.y + source.height / 2;
    const endX = target.x;
    const endY = target.y + target.height / 2;

    // Draw curved line
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Calculate control points for curve
    const midX = (startX + endX) / 2;

    ctx.bezierCurveTo(
        midX - 20,
        startY,
        midX + 20,
        endY,
        endX,
        endY
    );

    ctx.stroke();

    // Draw arrow
    const arrowSize = 8;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize, endY - arrowSize);
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - arrowSize, endY + arrowSize);
    ctx.stroke();
}
'use client'

// Core React and Hooks
import React, { useCallback, useEffect, useMemo, useState } from 'react' // useRef kept *only* if needed by MiniMap/Controls implicitly, can often be removed

// React Flow Imports
import ReactFlow, {
  addEdge,
  applyNodeChanges, // Helper
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  Handle, // Import Handle
  MarkerType, // Import MarkerType for markerEnd
  MiniMap,
  type Node,
  type NodeChange, // For specific updates
  type NodeProps, // Use NodeProps type
  Position, // Import Position
  type ReactFlowInstance, // For fitView
  useEdgesState,
  useNodesState,
} from 'reactflow'
import 'reactflow/dist/style.css' // Import React Flow CSS

// Shadcn/ui and Utils
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/components/ui/lib/utils' // Assuming your cn utility is here
import { ArrowLeft, ArrowRight, PlusCircle, Trash2 } from 'lucide-react' // Icons

// --- Constants ---
const PREDEFINED_STAGE_TYPES = [
  'Application Review',
  'Recruiter Screen',
  'Assessment',
  'Technical Interview',
  'Behavioral Interview',
  'Take-Home Assignment',
  'Hiring Manager Interview',
  'Team Interview/Meet & Greet',
  'Final Interview',
  'Reference Check',
  'Background Check',
  'Offer Extended',
  'Offer Accepted',
  'Hired',
  'Rejected',
]
const STAGE_COLORS: { [key: string]: string } = {
  'Application Review': 'bg-blue-100',
  'Recruiter Screen': 'bg-green-100',
  Assessment: 'bg-yellow-100',
  'Technical Interview': 'bg-purple-100',
  'Behavioral Interview': 'bg-indigo-100',
  'Take-Home Assignment': 'bg-orange-100',
  'Hiring Manager Interview': 'bg-teal-100',
  'Team Interview/Meet & Greet': 'bg-pink-100',
  'Final Interview': 'bg-cyan-100',
  'Reference Check': 'bg-gray-100',
  'Background Check': 'bg-gray-200',
  'Offer Extended': 'bg-lime-100',
  'Offer Accepted': 'bg-emerald-100',
  Hired: 'bg-green-200',
  Rejected: 'bg-red-100',
}
const NODE_WIDTH = 150
const NODE_HEIGHT = 70
const HORIZONTAL_GAP = 60
const START_Y = 50

// --- Types ---
interface StageData {
  text: string
  description?: string
  assignedTeamMembers?: string
  expectedDuration?: number
  automationTriggers?: string
}

// --- Custom Node Component ---
const PipelineStageNode = React.memo(({ data, selected }: NodeProps<StageData>) => {
  const nodeColor = useMemo(() => STAGE_COLORS[data.text] || 'bg-card', [data.text])
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-3 border rounded-md cursor-pointer transition-all duration-200 ease-in-out text-center shadow-sm',
        nodeColor,
        'text-card-foreground',
        'hover:shadow-md',
        selected ? 'border-primary ring-2 ring-primary/30' : 'border-border'
      )}
      style={{ width: `${NODE_WIDTH}px`, height: `${NODE_HEIGHT}px` }}>
      <Handle
        type='target'
        position={Position.Left}
        className='!bg-primary !w-3 !h-3 opacity-50 hover:opacity-100'
        isConnectable={true}
      />
      <span className='text-xs sm:text-sm font-medium line-clamp-2'>{data.text}</span>
      <Handle
        type='source'
        position={Position.Right}
        className='!bg-primary !w-3 !h-3 opacity-50 hover:opacity-100'
        isConnectable={true}
      />
    </div>
  )
})
PipelineStageNode.displayName = 'PipelineStageNode'

const nodeTypes = { pipelineStage: PipelineStageNode }

// --- Helper function to create an edge ---
const createEdge = (sourceId: string, targetId: string): Edge => ({
  id: `e-${sourceId}-${targetId}`,
  source: sourceId,
  target: targetId,
  type: 'smoothstep',
  style: { stroke: '#333', strokeWidth: 2 }, // Using hardcoded dark gray
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#333',
    width: 20,
    height: 20,
  },
})

// --- Initial State ---
const initialNodesData: Node<StageData>[] = [
  {
    id: '1',
    type: 'pipelineStage',
    data: { text: 'Application Review' },
    position: { x: 0 * (NODE_WIDTH + HORIZONTAL_GAP), y: START_Y },
    draggable: true,
  },
  {
    id: '2',
    type: 'pipelineStage',
    data: { text: 'Recruiter Screen' },
    position: { x: 1 * (NODE_WIDTH + HORIZONTAL_GAP), y: START_Y },
    draggable: true,
  },
  {
    id: '3',
    type: 'pipelineStage',
    data: { text: 'Hiring Manager Interview' },
    position: { x: 2 * (NODE_WIDTH + HORIZONTAL_GAP), y: START_Y },
    draggable: true,
  },
]
const initialEdgesData: Edge[] = [createEdge('1', '2'), createEdge('2', '3')]

// --- Main Component ---
export default function StructuredPipelineReactFlow() {
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<StageData>(initialNodesData)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesData)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(
    initialNodesData.length > 0 ? initialNodesData[0].id : null
  )
  const [selectedStageType, setSelectedStageType] = useState<string>(PREDEFINED_STAGE_TYPES[0])
  const [hasChanges, setHasChanges] = useState(false)

  // --- Effects ---
  useEffect(() => {
    // If selected node is deleted, select the first node or null
    if (selectedStageId && !nodes.find((n) => n.id === selectedStageId)) {
      setSelectedStageId(nodes.length > 0 ? nodes[0].id : null)
    }
  }, [nodes, selectedStageId])

  // --- Event Handlers ---
  const onNodesChangeCustom = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
      if (changes.some((c) => (c.type === 'position' && c.dragging === false) || c.type === 'dimensions')) {
        setHasChanges(true)
      }
      const selectionChange = changes.find((c) => c.type === 'select')
      if (selectionChange && selectionChange.type === 'select') {
        setSelectedStageId(selectionChange.selected ? selectionChange.id : null)
      }
    },
    [setNodes]
  )

  // onConnect is kept in case it's needed for programmatic connections,
  // but manual UI connections will be disabled via props below.
  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source === params.target || !params.source || !params.target) return
      setEdges((eds) => {
        if (
          eds.some(
            (e) =>
              (e.source === params.source && e.target === params.target) ||
              (e.source === params.target && e.target === params.source)
          )
        )
          return eds
        const newEdge = createEdge(params.source, params.target)
        return addEdge(newEdge, eds)
      })
      setHasChanges(true)
    },
    [setEdges]
  )

  const getNextId = useCallback(() => (Math.max(0, ...nodes.map((n) => Number.parseInt(n.id))) + 1).toString(), [nodes])

  // --- Add Node Handler ---
  const handleAddNode = useCallback(
    (position: 'before' | 'after' | 'end') => {
      if (!selectedStageType) return
      if ((position === 'before' || position === 'after') && selectedStageId === null) return

      const newNodeId = getNextId()
      let newNodePosition = { x: 0, y: START_Y }
      const currentNodes = [...nodes]
      let currentEdges = [...edges]
      let insertionIndex = nodes.length

      try {
        if (position === 'end') {
          const lastNode = currentNodes.length > 0 ? currentNodes[currentNodes.length - 1] : null
          if (lastNode) {
            newNodePosition = {
              x: lastNode.position.x + NODE_WIDTH + HORIZONTAL_GAP,
              y: lastNode.position.y,
            }
            currentEdges.push(createEdge(lastNode.id, newNodeId))
          } else {
            newNodePosition = { x: 0, y: START_Y }
          }
          insertionIndex = currentNodes.length
        } else if (selectedStageId) {
          const selectedNode = currentNodes.find((n) => n.id === selectedStageId)
          const selectedNodeIndex = currentNodes.findIndex((n) => n.id === selectedStageId)
          if (!selectedNode || selectedNodeIndex === -1) return

          if (position === 'before') {
            insertionIndex = selectedNodeIndex
            newNodePosition = {
              x: selectedNode.position.x - (NODE_WIDTH + HORIZONTAL_GAP),
              y: selectedNode.position.y,
            }
            if (newNodePosition.x < 0) newNodePosition.x = 10
            const incomingEdge = currentEdges.find((e) => e.target === selectedStageId)
            if (incomingEdge) {
              currentEdges = currentEdges.filter((e) => e.id !== incomingEdge.id)
              currentEdges.push(createEdge(incomingEdge.source, newNodeId))
            }
            currentEdges.push(createEdge(newNodeId, selectedStageId))
          } else {
            // after
            insertionIndex = selectedNodeIndex + 1
            newNodePosition = {
              x: selectedNode.position.x + NODE_WIDTH + HORIZONTAL_GAP,
              y: selectedNode.position.y,
            }
            const outgoingEdge = currentEdges.find((e) => e.source === selectedStageId)
            if (outgoingEdge) {
              currentEdges = currentEdges.filter((e) => e.id !== outgoingEdge.id)
              currentEdges.push(createEdge(newNodeId, outgoingEdge.target))
            }
            currentEdges.push(createEdge(selectedStageId, newNodeId))
          }
        }

        const newNode: Node<StageData> = {
          id: newNodeId,
          type: 'pipelineStage',
          data: { text: selectedStageType },
          position: newNodePosition,
          draggable: true,
        }
        const finalNodes = [...currentNodes]
        finalNodes.splice(insertionIndex, 0, newNode)

        setNodes(finalNodes)
        setEdges(currentEdges)
        setSelectedStageId(newNodeId)
        setHasChanges(true)
        setTimeout(() => reactFlowInstance?.fitView({ duration: 300, padding: 0.3 }), 50)
      } catch (error) {
        console.error('Error in handleAddNode:', error)
      }
    },
    [nodes, edges, selectedStageId, selectedStageType, setNodes, setEdges, getNextId, reactFlowInstance]
  )

  // --- Delete Handler ---
  const handleDeleteStage = useCallback(() => {
    if (selectedStageId === null) return
    try {
      const incomingEdge = edges.find((e) => e.target === selectedStageId)
      const outgoingEdge = edges.find((e) => e.source === selectedStageId)
      const remainingNodes = nodes.filter((node) => node.id !== selectedStageId)
      const remainingEdges = edges.filter((e) => e.source !== selectedStageId && e.target !== selectedStageId)
      if (incomingEdge && outgoingEdge) {
        if (!remainingEdges.some((e) => e.source === incomingEdge.source && e.target === outgoingEdge.target)) {
          remainingEdges.push(createEdge(incomingEdge.source, outgoingEdge.target))
        }
      }
      setNodes(remainingNodes)
      setEdges(remainingEdges)
      setSelectedStageId(remainingNodes.length > 0 ? remainingNodes[0].id : null)
      setHasChanges(true)
      setTimeout(() => reactFlowInstance?.fitView({ duration: 300, padding: 0.3 }), 50)
    } catch (error) {
      console.error('Error in handleDeleteStage:', error)
    }
  }, [nodes, edges, selectedStageId, setNodes, setEdges, reactFlowInstance])

  // --- Update, Save, Cancel Handlers ---
  const handleUpdateStageData = useCallback(
    (field: keyof StageData, value: string | number) => {
      if (selectedStageId === null) return
      setNodes((nds) =>
        nds.map((node) => (node.id === selectedStageId ? { ...node, data: { ...node.data, [field]: value } } : node))
      )
      setHasChanges(true)
      if (field === 'text' && typeof value === 'string') setSelectedStageType(value) // Keep dropdown in sync
    },
    [selectedStageId, setNodes]
  )

  const handleSave = useCallback(() => {
    setHasChanges(false)
    alert('Pipeline Saved (Check Console)') // Placeholder
  }, [nodes, edges])

  const handleCancel = useCallback(() => {
    setNodes([...initialNodesData])
    setEdges([...initialEdgesData])
    setSelectedStageId(initialNodesData.length > 0 ? initialNodesData[0].id : null)
    setHasChanges(false)
    setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2 }), 50)
  }, [setNodes, setEdges, reactFlowInstance])

  const selectedStageData = useMemo(
    () => nodes.find((node) => node.id === selectedStageId)?.data,
    [nodes, selectedStageId]
  )

  // --- JSX ---
  return (
    <div className='flex flex-col p-4 md:p-8'>
      {/* Header and Save/Cancel */}
      <div className='flex flex-wrap justify-between items-center gap-4 mb-6'>
        <h1 className='text-2xl font-bold'>Pipeline Designer</h1> {/* Simplified Title */}
        <div className='flex justify-end gap-2'>
          <Button variant='outline' onClick={handleCancel} disabled={!hasChanges}>
            Cancel Changes
          </Button>
          <Button variant='default' onClick={handleSave} disabled={!hasChanges}>
            Save Pipeline
          </Button>
        </div>
      </div>

      {/* Controls Card */}
      <Card className='w-full mb-6 shadow-sm border'>
        <CardContent className='p-4'>
          <div className='flex flex-wrap items-end gap-4'>
            <div className='grid gap-1.5'>
              <Label htmlFor='stageTypeSelect'>Stage Type to Add</Label>
              <Select value={selectedStageType} onValueChange={setSelectedStageType}>
                <SelectTrigger id='stageTypeSelect' className='w-[220px]'>
                  <SelectValue placeholder='Select stage type' />
                </SelectTrigger>
                <SelectContent>
                  {PREDEFINED_STAGE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='flex items-center gap-2 pt-1'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleAddNode('before')}
                disabled={!selectedStageType || selectedStageId === null}
                title={`Add "${selectedStageType}" before selected`}>
                <ArrowLeft className='h-4 w-4 mr-1.5' /> Before
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handleAddNode('after')}
                disabled={!selectedStageType || selectedStageId === null}
                title={`Add "${selectedStageType}" after selected`}>
                After <ArrowRight className='h-4 w-4 ml-1.5' />
              </Button>
              <Button
                variant='default'
                size='sm'
                onClick={() => handleAddNode('end')}
                disabled={!selectedStageType}
                title={`Add "${selectedStageType}" to end`}>
                <PlusCircle className='h-4 w-4 mr-1.5' /> Add to End
              </Button>
              <Button
                variant='destructive'
                size='sm'
                onClick={handleDeleteStage}
                disabled={selectedStageId === null}
                title='Delete selected stage'>
                <Trash2 className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* React Flow Container */}
      <div className='w-full h-[500px] border rounded-lg bg-background shadow-inner overflow-hidden'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChangeCustom}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect} // Keep handler if needed programmatically
          nodeTypes={nodeTypes}
          snapToGrid={true}
          snapGrid={[15, 15]}
          fitView
          fitViewOptions={{ padding: 0.3 }} // Slightly more padding
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          onInit={setReactFlowInstance}
          nodesDraggable={true}
          nodesConnectable={false} // *** Disable manual connections via UI ***
          elementsSelectable={true}
          //    connectionMode={ConnectionMode.Loose} // Or Strict
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
          <Controls />
          <MiniMap nodeStrokeWidth={3} zoomable pannable nodeColor={(n) => STAGE_COLORS[n.data.text] || '#eee'} />
        </ReactFlow>
      </div>

      {/* Stage Details Editor Card */}
      <Card className='w-full mt-6 shadow-sm border'>
        <CardHeader>
          <CardTitle>{selectedStageId ? `Edit Stage: ${selectedStageData?.text ?? '...'}` : 'Stage Details'}</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedStageId && selectedStageData ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {/* Stage Type/Name */}
              <div className='grid gap-1.5'>
                <Label htmlFor='stageName'>Stage Type</Label>
                <Select value={selectedStageData.text} onValueChange={(value) => handleUpdateStageData('text', value)}>
                  <SelectTrigger id='stageName'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_STAGE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Description */}
              <div className='grid gap-1.5'>
                <Label htmlFor='stageDescription'>Description</Label>
                <Input
                  id='stageDescription'
                  value={selectedStageData.description ?? ''}
                  onChange={(e) => handleUpdateStageData('description', e.target.value)}
                  placeholder='Optional description...'
                />
              </div>
              {/* Assigned Team */}
              <div className='grid gap-1.5'>
                <Label htmlFor='assignedTeamMembers'>Assigned Team/Members</Label>
                <Input
                  id='assignedTeamMembers'
                  value={selectedStageData.assignedTeamMembers ?? ''}
                  onChange={(e) => handleUpdateStageData('assignedTeamMembers', e.target.value)}
                  placeholder='e.g., Recruiting Team, Jane Doe'
                />
              </div>
              {/* Duration */}
              <div className='grid gap-1.5'>
                <Label htmlFor='expectedDuration'>Expected Duration (Days)</Label>
                <Input
                  id='expectedDuration'
                  type='number'
                  value={selectedStageData.expectedDuration ?? 0}
                  onChange={(e) => handleUpdateStageData('expectedDuration', Number.parseInt(e.target.value) || 0)}
                  min={0}
                />
              </div>
              {/* Automation */}
              <div className='grid gap-1.5 md:col-span-2'>
                <Label htmlFor='automationTriggers'>Automation</Label>
                <Input
                  id='automationTriggers'
                  value={selectedStageData.automationTriggers ?? ''}
                  onChange={(e) => handleUpdateStageData('automationTriggers', e.target.value)}
                  placeholder='e.g., Send rejection email, Move to next stage'
                />
              </div>
            </div>
          ) : (
            <p className='text-muted-foreground text-center py-4'>
              {nodes.length > 0
                ? 'Select a stage above to view or edit its details.'
                : 'No stages in the pipeline. Add a stage to begin.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

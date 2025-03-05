'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

// Pipeline stage component with structured positioning
const PipelineStage = ({ stage, isSelected, onSelect }) => {
  const handleClick = (e) => {
    e.stopPropagation()
    onSelect(stage.id)
  }

  const stageStyle = {
    backgroundColor: isSelected ? '#d4e6ff' : '#e0e0e0',
    border: isSelected ? '2px solid #3b82f6' : '1px solid #333',
    borderRadius: '4px',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.2s',
    boxShadow: isSelected
      ? '0 0 0 2px rgba(59, 130, 246, 0.5)'
      : '0 1px 3px rgba(0,0,0,0.1)',
    width: '100%',
    height: '100%',
    position: 'relative',
  }

  return (
    <div style={stageStyle} onClick={handleClick} className='stage'>
      <span className='text-sm font-medium'>{stage.text}</span>
    </div>
  )
}

// Arrow component for connections
const ConnectionArrow = ({ from, to, layout, gridSize }) => {
  if (layout === 'horizontal' || layout === 'snake') {
    // Horizontal arrow
    if (from.row === to.row && from.col + 1 === to.col) {
      return (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${from.col * gridSize + gridSize - 10}px`,
            width: '20px',
            height: '2px',
            backgroundColor: '#3b82f6',
            transform: 'translateY(-50%)',
          }}>
          <div
            style={{
              position: 'absolute',
              right: '0',
              top: '-3px',
              width: '0',
              height: '0',
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent',
              borderLeft: '6px solid #3b82f6',
            }}
          />
        </div>
      )
    }

    // Snake layout arrow (transitioning to next row)
    if (layout === 'snake' && from.row + 1 === to.row) {
      const startX = from.col * gridSize + gridSize / 2
      const endX = to.col * gridSize + gridSize / 2

      return (
        <>
          {/* Vertical line down */}
          <div
            style={{
              position: 'absolute',
              top: `${from.row * gridSize + gridSize - 5}px`,
              left: `${startX}px`,
              width: '2px',
              height: '10px',
              backgroundColor: '#3b82f6',
            }}
          />

          {/* Arrow at the beginning of next row */}
          <div
            style={{
              position: 'absolute',
              top: `${to.row * gridSize - 5}px`,
              left: `${endX}px`,
              width: '2px',
              height: '10px',
              backgroundColor: '#3b82f6',
            }}>
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                left: '-3px',
                width: '0',
                height: '0',
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderTop: '6px solid #3b82f6',
              }}
            />
          </div>
        </>
      )
    }
  }

  // For vertical layout
  if (layout === 'vertical') {
    if (from.row + 1 === to.row) {
      return (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: `${from.row * gridSize + gridSize - 10}px`,
            width: '2px',
            height: '20px',
            backgroundColor: '#3b82f6',
            transform: 'translateX(-50%)',
          }}>
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '-3px',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '6px solid #3b82f6',
            }}
          />
        </div>
      )
    }
  }

  return null
}

export default function StructuredPipeline() {
  // Define layout modes
  const LAYOUTS = {
    HORIZONTAL: 'horizontal',
    VERTICAL: 'vertical',
    SNAKE: 'snake',
  }

  const router = useRouter()
  const searchParams = useSearchParams()

  // Read the layout directly from the URL
  const layoutParam = searchParams.get('orientation')
  const initialLayout =
    layoutParam && Object.values(LAYOUTS).includes(layoutParam)
      ? layoutParam
      : LAYOUTS.HORIZONTAL

  // Use URL state for layout
  const [currentLayout, setCurrentLayout] = useState(initialLayout)

  // Initialize stages
  const [stages, setStages] = useState([
    { id: 1, text: 'Application', row: 0, col: 0 },
    { id: 2, text: 'Phone Screening', row: 0, col: 1 },
    { id: 3, text: 'Technical Challenge', row: 0, col: 2 },
    { id: 4, text: 'Interview', row: 0, col: 3 },
    { id: 5, text: 'Offer', row: 0, col: 4 },
  ])

  const [connections, setConnections] = useState([
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ])

  const [selectedStage, setSelectedStage] = useState(null)

  // Update URL when changing layout
  const updateUrlParams = (newLayout) => {
    const params = new URLSearchParams(window.location.search)
    params.set('orientation', newLayout)
    router.replace(`/jobs/pipelines?${params.toString()}`, { scroll: false })
  }

  // Arrange stages based on layout
  const arrangeStagesBasedOnLayout = (
    stagesToArrange,
    layout = currentLayout
  ) => {
    let updatedStages = [...stagesToArrange]
    if (layout === LAYOUTS.HORIZONTAL) {
      updatedStages = updatedStages.map((stage, index) => ({
        ...stage,
        row: 0,
        col: index,
      }))
    } else if (layout === LAYOUTS.VERTICAL) {
      updatedStages = updatedStages.map((stage, index) => ({
        ...stage,
        row: index,
        col: 0,
      }))
    } else if (layout === LAYOUTS.SNAKE) {
      const stagesPerRow = 4
      updatedStages = updatedStages.map((stage, index) => {
        const row = Math.floor(index / stagesPerRow)
        const col =
          row % 2 === 0
            ? index % stagesPerRow
            : stagesPerRow - 1 - (index % stagesPerRow)
        return { ...stage, row, col }
      })
    }
    return updatedStages
  }

  // Handle adding a stage after the selected stage
  const handleAddStageAfter = () => {
    if (!selectedStage) return
    const selectedIndex = stages.findIndex((s) => s.id === selectedStage)
    if (selectedIndex === -1) return

    const newId = Math.max(...stages.map((s) => s.id)) + 1
    const newStages = [...stages]
    newStages.splice(selectedIndex + 1, 0, {
      id: newId,
      text: `New Stage ${newId}`,
      row: 0,
      col: 0, // will be recalculated
    })

    let newConnections = [...connections]
    // Check if the selected stage already has an outgoing connection
    const existingNext = connections.find(([from]) => from === selectedStage)
    if (existingNext) {
      // Remove the connection from the selected stage
      newConnections = newConnections.filter(([from]) => from !== selectedStage)
      // Connect selected stage to the new stage, then new stage to the previously connected stage
      newConnections.push([selectedStage, newId])
      newConnections.push([newId, existingNext[1]])
    } else {
      newConnections.push([selectedStage, newId])
    }

    const arrangedStages = arrangeStagesBasedOnLayout(newStages)
    setStages(arrangedStages)
    setConnections(newConnections)
    setSelectedStage(newId)
  }

  // Handle adding a stage before the selected stage
  const handleAddStageBefore = () => {
    if (!selectedStage) return
    const selectedIndex = stages.findIndex((s) => s.id === selectedStage)
    if (selectedIndex === -1) return

    const newId = Math.max(...stages.map((s) => s.id)) + 1
    const newStages = [...stages]
    newStages.splice(selectedIndex, 0, {
      id: newId,
      text: `New Stage ${newId}`,
      row: 0,
      col: 0,
    })

    let newConnections = [...connections]
    // Check if the selected stage has an incoming connection
    const existingPrev = connections.find(([, to]) => to === selectedStage)
    if (existingPrev) {
      newConnections = newConnections.filter(([, to]) => to !== selectedStage)
      newConnections.push([existingPrev[0], newId])
      newConnections.push([newId, selectedStage])
    } else {
      newConnections.push([newId, selectedStage])
    }

    const arrangedStages = arrangeStagesBasedOnLayout(newStages)
    setStages(arrangedStages)
    setConnections(newConnections)
    setSelectedStage(newId)
  }

  // Handle deleting the selected stage
  const handleDeleteStage = () => {
    if (!selectedStage) return
    const newStages = stages.filter((stage) => stage.id !== selectedStage)
    const newConnections = connections.filter(
      ([from, to]) => from !== selectedStage && to !== selectedStage
    )

    // If there is both an incoming and outgoing connection, connect them directly
    const incomingConnection = connections.find(
      ([, to]) => to === selectedStage
    )
    const outgoingConnection = connections.find(
      ([from]) => from === selectedStage
    )
    if (incomingConnection && outgoingConnection) {
      newConnections.push([incomingConnection[0], outgoingConnection[1]])
    }

    const arrangedStages = arrangeStagesBasedOnLayout(newStages)
    setStages(arrangedStages)
    setConnections(newConnections)
    setSelectedStage(null)
  }

  // Change layout mode
  const handleLayoutChange = (newLayout) => {
    const arrangedStages = arrangeStagesBasedOnLayout(stages, newLayout)
    setStages(arrangedStages)
    setCurrentLayout(newLayout)
    updateUrlParams(newLayout)
  }

  // Calculate grid style based on current layout
  const getGridStyle = () => {
    const GRID_SIZE = 120
    const baseStyles = {
      display: 'grid',
      gap: '20px',
      transition: 'all 0.3s ease-in-out',
      margin: '0 auto',
    }
    if (currentLayout === LAYOUTS.HORIZONTAL) {
      return {
        ...baseStyles,
        gridTemplateColumns: `repeat(${stages.length}, ${GRID_SIZE}px)`,
        gridTemplateRows: `${GRID_SIZE}px`,
      }
    } else if (currentLayout === LAYOUTS.VERTICAL) {
      return {
        ...baseStyles,
        gridTemplateColumns: `${GRID_SIZE}px`,
        gridTemplateRows: `repeat(${stages.length}, ${GRID_SIZE}px)`,
      }
    } else if (currentLayout === LAYOUTS.SNAKE) {
      const stagesPerRow = 4
      const rows = Math.ceil(stages.length / stagesPerRow)
      return {
        ...baseStyles,
        gridTemplateColumns: `repeat(${stagesPerRow}, ${GRID_SIZE}px)`,
        gridTemplateRows: `repeat(${rows}, ${GRID_SIZE}px)`,
      }
    }
  }

  return (
    <div className='flex flex-col items-center p-4'>
      <h1 className='text-2xl font-bold mb-2'>Job Pipeline Designer</h1>

      <div className='mb-2 text-xs text-gray-500'>
        Current URL: /jobs/pipelines?orientation={currentLayout}
      </div>

      {/* Layout Controls */}
      <div className='mb-4 flex gap-2'>
        <button
          onClick={() => handleLayoutChange(LAYOUTS.HORIZONTAL)}
          className={`px-3 py-1 rounded ${
            currentLayout === LAYOUTS.HORIZONTAL
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}>
          Horizontal
        </button>
        <button
          onClick={() => handleLayoutChange(LAYOUTS.VERTICAL)}
          className={`px-3 py-1 rounded ${
            currentLayout === LAYOUTS.VERTICAL
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}>
          Vertical
        </button>
        <button
          onClick={() => handleLayoutChange(LAYOUTS.SNAKE)}
          className={`px-3 py-1 rounded ${
            currentLayout === LAYOUTS.SNAKE
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          }`}>
          Snake
        </button>
      </div>

      {/* Stage Controls */}
      <div className='mb-4 flex gap-2'>
        {selectedStage && (
          <>
            <button
              onClick={handleAddStageBefore}
              className='px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600'>
              Add Before
            </button>
            <button
              onClick={handleAddStageAfter}
              className='px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600'>
              Add After
            </button>
            <button
              onClick={handleDeleteStage}
              className='px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600'>
              Delete
            </button>
          </>
        )}
      </div>

      {/* Pipeline Canvas */}
      <div
        onClick={() => setSelectedStage(null)}
        style={{
          position: 'relative',
          padding: '40px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px solid #ccc',
          overflowX: 'auto',
          overflowY: 'auto',
          maxWidth: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}>
        <div style={getGridStyle()}>
          {stages.map((stage) => (
            <div
              key={stage.id}
              style={{
                gridColumn: stage.col + 1,
                gridRow: stage.row + 1,
                width: '100%',
                height: '100%',
                transition: 'all 0.3s ease-in-out',
              }}>
              <PipelineStage
                stage={stage}
                isSelected={selectedStage === stage.id}
                onSelect={setSelectedStage}
              />
            </div>
          ))}
        </div>

        {/* Render connections/arrows */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}>
          {connections.map(([fromId, toId], index) => {
            const fromStage = stages.find((s) => s.id === fromId)
            const toStage = stages.find((s) => s.id === toId)
            if (fromStage && toStage) {
              return (
                <ConnectionArrow
                  key={`conn-${index}`}
                  from={fromStage}
                  to={toStage}
                  layout={currentLayout}
                  gridSize={140} // GRID_SIZE (120) + gap (20)
                />
              )
            }
            return null
          })}
        </div>
      </div>
    </div>
  )
}

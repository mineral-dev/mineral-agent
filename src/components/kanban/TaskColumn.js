'use client';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';

const colColors = {
  not_started:    { header: 'bg-neutral-100 border-neutral-200', dot: 'bg-neutral-400' },
  ready_to_start: { header: 'bg-blue-100 border-blue-200',      dot: 'bg-blue-500'    },
  in_progress:    { header: 'bg-yellow-100 border-yellow-200',   dot: 'bg-yellow-500'  },
  in_review:      { header: 'bg-purple-100 border-purple-200',   dot: 'bg-purple-500'  },
  completed:      { header: 'bg-green-100 border-green-200',    dot: 'bg-green-500'   },
};

export function TaskColumn({ column, tasks, onUpdate, onDelete, onDrop }) {
  const colors = colColors[column.id] || colColors.not_started;

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-lg border ${colors.header} ${colors.dot.replace('bg-', 'text-')}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className="font-semibold text-sm">{column.label}</span>
        </div>
        <span className="text-xs font-medium bg-white/70 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-32 p-2 rounded-b-lg border-x border-b transition-colors ${
              snapshot.isDraggingOver ? 'bg-primary/5 border-primary/30' : 'bg-muted/20 border-muted'
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                {(prov, snap) => (
                  <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                    <TaskCard
                      task={task}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      isDragging={snap.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-muted-foreground text-center py-8">Drop tasks here</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

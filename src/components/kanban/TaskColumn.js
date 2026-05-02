'use client';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from './TaskCard';

export function TaskColumn({ column, tasks, onUpdate, onDelete }) {
  return (
    <div className="w-72 shrink-0 flex flex-col">
      <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-lg border border-l-4 ${column.borderColor}`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${column.dotColor}`} />
          <span className="font-semibold text-sm">{column.label}</span>
        </div>
        <span className="text-xs font-medium bg-muted/50 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 min-h-32 p-2 rounded-b-lg border-x border-b transition-colors ${
              snapshot.isDraggingOver ? 'bg-primary/5' : 'bg-muted/10'
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

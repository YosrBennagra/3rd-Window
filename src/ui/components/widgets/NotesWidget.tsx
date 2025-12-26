import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGridStore } from '../../../application/stores/gridStore';
import type { WidgetLayout } from '../../../domain/models/layout';
import { ensureNotesWidgetSettings } from '../../../domain/models/widgets';

interface NotesWidgetProps {
  widget: WidgetLayout;
}

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export function NotesWidget({ widget }: NotesWidgetProps) {
  const updateWidgetSettings = useGridStore((state) => state.updateWidgetSettings);
  const settings = ensureNotesWidgetSettings(widget.settings);
  
  const [mode, setMode] = useState<'notes' | 'todos'>(settings.mode || 'notes');
  const [noteText, setNoteText] = useState(settings.noteText || '');
  const [todos, setTodos] = useState<TodoItem[]>(settings.todos || []);
  const [newTodoText, setNewTodoText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced save
  const saveTimeoutRef = useRef<number | null>(null);

  const saveSettings = useCallback((
    updatedMode: 'notes' | 'todos',
    updatedNoteText: string,
    updatedTodos: TodoItem[]
  ) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      updateWidgetSettings(widget.id, {
        ...settings,
        mode: updatedMode,
        noteText: updatedNoteText,
        todos: updatedTodos,
      });
    }, 500);
  }, [widget.id, settings, updateWidgetSettings]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleModeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMode = mode === 'notes' ? 'todos' : 'notes';
    setMode(newMode);
    saveSettings(newMode, noteText, todos);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setNoteText(newText);
    saveSettings(mode, newText, todos);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!newTodoText.trim()) return;

    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    setNewTodoText('');
    saveSettings(mode, noteText, updatedTodos);
    
    inputRef.current?.focus();
  };

  const handleToggleTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    setTodos(updatedTodos);
    saveSettings(mode, noteText, updatedTodos);
  };

  const handleDeleteTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    saveSettings(mode, noteText, updatedTodos);
  };

  const handleClearCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedTodos = todos.filter(todo => !todo.completed);
    setTodos(updatedTodos);
    saveSettings(mode, noteText, updatedTodos);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mode === 'notes') {
      setNoteText('');
      saveSettings(mode, '', todos);
    } else {
      setTodos([]);
      saveSettings(mode, noteText, []);
    }
  };

  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="notes-widget">
      <div className="notes-widget__header">
        <div className="notes-widget__tabs">
          <button
            type="button"
            className={`notes-widget__tab ${mode === 'notes' ? 'notes-widget__tab--active' : ''}`}
            onClick={handleModeToggle}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Switch to Notes mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Notes
          </button>
          <button
            type="button"
            className={`notes-widget__tab ${mode === 'todos' ? 'notes-widget__tab--active' : ''}`}
            onClick={handleModeToggle}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label="Switch to Todos mode"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Todos
          </button>
        </div>
        <button
          type="button"
          className="notes-widget__clear"
          onClick={handleClearAll}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          title={mode === 'notes' ? 'Clear notes' : 'Clear all todos'}
          aria-label={mode === 'notes' ? 'Clear notes' : 'Clear all todos'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {mode === 'notes' ? (
        <div className="notes-widget__content">
          <textarea
            ref={textareaRef}
            className="notes-widget__textarea"
            value={noteText}
            onChange={handleNoteChange}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            placeholder="Type your notes here..."
            spellCheck={true}
            autoComplete="off"
            aria-label="Notes text area"
          />
        </div>
      ) : (
        <div className="notes-widget__content">
          <form className="notes-widget__add-form" onSubmit={handleAddTodo}>
            <input
              ref={inputRef}
              type="text"
              className="notes-widget__input"
              value={newTodoText}
              onChange={(e) => setNewTodoText(e.target.value)}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add a new todo..."
              autoComplete="off"
            />
            <button
              type="submit"
              className="notes-widget__add-btn"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              aria-label="Add todo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </form>

          <div className="notes-widget__todos">
            {todos.length === 0 ? (
              <div className="notes-widget__empty">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="9 11 12 14 22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
                <p>No todos yet</p>
              </div>
            ) : (
              <>
                {todos.map(todo => (
                  <div
                    key={todo.id}
                    className={`notes-widget__todo ${todo.completed ? 'notes-widget__todo--completed' : ''}`}
                  >
                    <button
                      type="button"
                      className="notes-widget__checkbox"
                      onClick={(e) => handleToggleTodo(todo.id, e)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label={todo.completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {todo.completed && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <span className="notes-widget__todo-text">{todo.text}</span>
                    <button
                      type="button"
                      className="notes-widget__delete"
                      onClick={(e) => handleDeleteTodo(todo.id, e)}
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      aria-label="Delete todo"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>

          {todos.length > 0 && (
            <div className="notes-widget__footer">
              <span className="notes-widget__count">
                {completedCount} / {totalCount} completed
              </span>
              {completedCount > 0 && (
                <button
                  type="button"
                  className="notes-widget__clear-completed"
                  onClick={handleClearCompleted}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  Clear completed
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

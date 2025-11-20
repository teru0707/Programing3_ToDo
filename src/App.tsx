import { useState, useEffect } from 'react';
import { Trash2, Play, Pause, Plus, CheckCircle, Circle } from 'lucide-react';
import './App.css';

// Todoの型定義
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  timeLeft: number; // 残り時間（秒）
  isTimerRunning: boolean;
  initialTime: number; // 設定時間（秒）
}

function App() {
  // ローカルストレージから初期データを読み込む
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('focus-todos');
    if (saved) return JSON.parse(saved);
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [selectedTime, setSelectedTime] = useState(25); // デフォルト25分

  // データ保存
  useEffect(() => {
    localStorage.setItem('focus-todos', JSON.stringify(todos));
  }, [todos]);

  // タイマー処理
  useEffect(() => {
    const interval = setInterval(() => {
      setTodos(currentTodos =>
        currentTodos.map(todo => {
          if (todo.isTimerRunning && todo.timeLeft > 0) {
            return { ...todo, timeLeft: todo.timeLeft - 1 };
          } else if (todo.isTimerRunning && todo.timeLeft === 0) {
            // タイマー終了時
            return { ...todo, isTimerRunning: false, completed: true };
          }
          return todo;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: inputValue,
      completed: false,
      initialTime: selectedTime * 60,
      timeLeft: selectedTime * 60,
      isTimerRunning: false,
    };
    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed, isTimerRunning: false } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTimer = (id: string) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        // 他のタスクのタイマーを止める（シングルタスク集中）
        return { ...todo, isTimerRunning: !todo.isTimerRunning };
      }
      return { ...todo, isTimerRunning: false };
    }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container">
      <header>
        <h1>Focus Track ⏳</h1>
        <p>「時間」を意識してタスクを消化する</p>
      </header>

      <form onSubmit={addTodo} className="input-group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="新しいタスクを入力..."
        />
        <select 
          value={selectedTime} 
          onChange={(e) => setSelectedTime(Number(e.target.value))}
          className="time-select"
        >
          <option value="10">10分</option>
          <option value="25">25分</option>
          <option value="45">45分</option>
          <option value="60">60分</option>
        </select>
        <button type="submit" className="add-btn"><Plus size={20} /></button>
      </form>

      <div className="todo-list">
        {todos.length === 0 && <p className="empty-msg">タスクを追加して集中を開始しましょう！</p>}
        {todos.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''} ${todo.isTimerRunning ? 'active' : ''}`}>
            <button onClick={() => toggleTodo(todo.id)} className="check-btn">
              {todo.completed ? <CheckCircle color="#4ade80" /> : <Circle color="#94a3b8" />}
            </button>
            
            <div className="todo-content">
              <span className="todo-text">{todo.text}</span>
              <div className="timer-display">
                <span className={`time ${todo.timeLeft < 60 ? 'urgent' : ''}`}>
                  {formatTime(todo.timeLeft)}
                </span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(todo.timeLeft / todo.initialTime) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {!todo.completed && (
              <button onClick={() => toggleTimer(todo.id)} className={`timer-btn ${todo.isTimerRunning ? 'running' : ''}`}>
                {todo.isTimerRunning ? <Pause size={20} /> : <Play size={20} />}
              </button>
            )}
            
            <button onClick={() => deleteTodo(todo.id)} className="delete-btn">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
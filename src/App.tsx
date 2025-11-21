import { useState, useEffect } from 'react';
import { Trash2, Play, Pause, Plus, CheckCircle, Circle, Zap, Trophy, Brain, Battery } from 'lucide-react';
import './App.css';

// 型定義
interface Todo {
  id: string;
  text: string;
  completed: boolean;
  timeLeft: number;
  isTimerRunning: boolean;
  initialTime: number;
  category: 'Work' | 'Study' | 'Health' | 'Other';
  difficulty: 1 | 2 | 3;
  xpReward: number;
}

interface UserStats {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  streak: number;
}

function App() {
  // --- State Management ---
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('focus-todos-v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [userStats, setUserStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('focus-user-stats');
    return saved ? JSON.parse(saved) : { level: 1, currentXP: 0, nextLevelXP: 100, streak: 0 };
  });

  const [inputValue, setInputValue] = useState('');
  
  // デフォルト8時間 (480分)
  const [workCapacity, setWorkCapacity] = useState(480);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('focus-todos-v2', JSON.stringify(todos));
    localStorage.setItem('focus-user-stats', JSON.stringify(userStats));
  }, [todos, userStats]);

  // --- Timer Logic ---
  useEffect(() => {
    const interval = setInterval(() => {
      setTodos(currentTodos =>
        currentTodos.map(todo => {
          if (todo.isTimerRunning && todo.timeLeft > 0) {
            return { ...todo, timeLeft: todo.timeLeft - 1 };
          } else if (todo.isTimerRunning && todo.timeLeft === 0) {
            handleComplete(todo.id); // タイマー終了で自動完了
            return { ...todo, isTimerRunning: false, completed: true };
          }
          return todo;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- "AI" Logic: Smart Parser ---
  const parseInput = (text: string) => {
    let time = 25; // デフォルト
    let cleanText = text;
    let category: Todo['category'] = 'Other';

    // 時間抽出 (例: "30m", "60min")
    const timeMatch = text.match(/(\d+)(m|min)/i);
    if (timeMatch) {
      time = parseInt(timeMatch[1]);
      cleanText = text.replace(timeMatch[0], '').trim();
    }

    // カテゴリ推論
    const lower = text.toLowerCase();
    if (lower.match(/mail|report|mtg|会議|メール|資料|提案/)) category = 'Work';
    else if (lower.match(/study|read|book|英単語|勉強|課題/)) category = 'Study';
    else if (lower.match(/gym|walk|run|筋トレ|散歩|運動/)) category = 'Health';

    // 難易度判定と報酬計算
    const difficulty = time > 60 ? 3 : time > 30 ? 2 : 1;
    const xp = time * difficulty; 

    return { text: cleanText, time, category, difficulty, xp };
  };

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const parsed = parseInput(inputValue);

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      text: parsed.text,
      completed: false,
      initialTime: parsed.time * 60,
      timeLeft: parsed.time * 60,
      isTimerRunning: false,
      category: parsed.category,
      difficulty: parsed.difficulty as 1 | 2 | 3,
      xpReward: parsed.xp
    };

    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  // --- Gamification Logic ---
  const gainXP = (amount: number) => {
    setUserStats(prev => {
      let newXP = prev.currentXP + amount;
      let newLevel = prev.level;
      let newNext = prev.nextLevelXP;

      if (newXP >= newNext) {
        newXP -= newNext;
        newLevel += 1;
        newNext = Math.floor(newNext * 1.2);
        alert(`🎉 LEVEL UP! You reached Level ${newLevel}!`);
      }

      return { ...prev, level: newLevel, currentXP: newXP, nextLevelXP: newNext };
    });
  };

  const handleComplete = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo && !todo.completed) {
      gainXP(todo.xpReward);
    }
    setTodos(todos.map(t => 
      t.id === id ? { ...t, completed: !t.completed, isTimerRunning: false } : t
    ));
  };

  // --- Feature: Gap Time Suggestion ---
  const suggestTask = () => {
    const available = todos.filter(t => !t.completed && t.timeLeft <= 15 * 60);
    if (available.length > 0) {
      const random = available[Math.floor(Math.random() * available.length)];
      alert(`隙間時間AIの提案: 「${random.text}」 (残り${Math.floor(random.timeLeft/60)}分) を片付けましょう！`);
    } else {
      alert('15分以内で終わるタスクはありません。新しいタスクを追加するか、休憩しましょう☕️');
    }
  };

  // --- Capacity Calculation ---
  const totalRemainingTime = todos
    .filter(t => !t.completed)
    .reduce((acc, curr) => acc + curr.timeLeft, 0) / 60; // 分
  
  const capacityPercent = Math.min((totalRemainingTime / workCapacity) * 100, 100);

  // Helpers
  const toggleTimer = (id: string) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) return { ...todo, isTimerRunning: !todo.isTimerRunning };
      return { ...todo, isTimerRunning: false };
    }));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container">
      {/* Header: Gamification Stats */}
      <header>
        <div>
          <h1>Focus AI <Zap size={24} color="#fbbf24" style={{display:'inline'}}/></h1>
          <p style={{color: '#94a3b8', fontSize:'0.9rem'}}>AI Assisted Productivity</p>
        </div>
        <div className="user-stats">
          <div className="xp-bar-container">
            <span className="xp-text">XP: {userStats.currentXP} / {userStats.nextLevelXP}</span>
            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${(userStats.currentXP / userStats.nextLevelXP) * 100}%` }}></div>
            </div>
          </div>
          <div className="level-badge">
            Lv.{userStats.level}
          </div>
        </div>
      </header>

      {/* Feature: Capacity Meter (ここを修正しました) */}
      <section className="capacity-section">
        <div className="capacity-label">
          <span><Battery size={16} style={{verticalAlign: 'middle'}}/> 今日のエネルギー (残りタスク量)</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{Math.floor(totalRemainingTime)}分 / </span>
            <select 
              value={workCapacity} 
              onChange={(e) => setWorkCapacity(Number(e.target.value))}
              style={{ 
                background: 'transparent', 
                color: 'inherit', 
                border: '1px solid #475569', 
                borderRadius: '4px',
                padding: '2px',
                cursor: 'pointer'
              }}
            >
              <option value="120">2時間 (超短期)</option>
              <option value="240">4時間 (半日)</option>
              <option value="360">6時間 (軽め)</option>
              <option value="480">8時間 (標準)</option>
              <option value="600">10時間 (ガチ)</option>
              <option value="720">12時間 (限界)</option>
            </select>
          </div>
        </div>
        <div className="xp-track" style={{background: '#1e293b'}}>
          <div 
            className="xp-fill" 
            style={{ 
              width: `${capacityPercent}%`, 
              background: capacityPercent > 80 ? '#ef4444' : '#6366f1' 
            }}
          ></div>
        </div>
        {capacityPercent > 100 && <p style={{color:'#ef4444', fontSize:'0.8rem', marginTop:'0.5rem'}}>⚠️ キャパシティ超過です！タスクを減らすか明日に回しましょう。</p>}
      </section>

      {/* Input Area */}
      <form onSubmit={addTodo} className="input-group">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="例: 資料作成 45min (AIが時間を自動設定します)"
        />
        <span className="magic-hint">✨ AI自動解析ON</span>
        <button type="submit" className="add-btn"><Plus size={20} /></button>
      </form>

      {/* Quick Actions */}
      <div className="feature-actions">
        <button onClick={suggestTask} className="action-btn">
          <Brain size={16} /> 隙間時間AI提案
        </button>
        <button onClick={() => alert('AIによる優先順位並び替えを実行しました（デモ）')} className="action-btn">
          <Trophy size={16} /> 優先度ソート
        </button>
      </div>

      {/* List */}
      <div className="todo-list">
        {todos.length === 0 && <p style={{textAlign:'center', color:'#64748b'}}>タスクを追加してレベルアップを目指しましょう！</p>}
        
        {todos.map(todo => (
          <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''} ${todo.isTimerRunning ? 'active' : ''}`}>
            <button onClick={() => handleComplete(todo.id)} className="check-btn">
              {todo.completed ? <CheckCircle color="#4ade80" /> : <Circle color="#94a3b8" />}
            </button>
            
            <div className="todo-content">
              <div className="todo-header">
                <span className="todo-text">{todo.text}</span>
                <div className="tags">
                  <span className="tag">{todo.category}</span>
                  <span className="tag">XP +{todo.xpReward}</span>
                </div>
              </div>
              
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
import React, { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function DrillSimulator({ token }) {
  const [drills, setDrills] = useState([]);
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [simState, setSimState] = useState(null); // current event
  const [response, setResponse] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [sessionRounds, setSessionRounds] = useState(0);
  const [complete, setComplete] = useState(false);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetch(`${API}/drills?limit=50`, { headers })
      .then(r => r.json())
      .then(d => setDrills(d.data || d || []))
      .catch(() => {});
  }, []);

  const startSim = async (drill) => {
    setLoading(true);
    setComplete(false);
    setEvaluation(null);
    setSessionScore(0);
    setSessionRounds(0);
    setResponse('');
    try {
      const res = await fetch(`${API}/drills/${drill.id}/simulate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setSelectedDrill(drill);
      setSimState(data.event);
    } catch (err) {
      alert('Error starting simulation');
    } finally {
      setLoading(false);
    }
  };

  const submitResponse = async () => {
    if (!response.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/drills/${selectedDrill.id}/respond`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ response, previous_event: simState }),
      });
      const data = await res.json();
      const eval_ = data.evaluation;
      setEvaluation(eval_);
      setSessionRounds(r => r + 1);
      if (eval_?.score) setSessionScore(s => s + eval_.score);
      if (eval_?.drill_complete) {
        setComplete(true);
      } else if (eval_?.next_event) {
        setSimState({ event: eval_.next_event, question: eval_.next_question, options: eval_.next_options });
      }
      setResponse('');
    } catch (err) {
      alert('Error submitting response');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDrill) {
    return (
      <div style={{ padding: 24 }}>
        <h2>Drill Simulation</h2>
        <p style={{ color: '#64748b' }}>Select a drill to start an interactive AI simulation.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 24 }}>
          {drills.map(drill => (
            <div key={drill.id} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{drill.drill_type}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                {drill.participants} participants | Rating: {drill.rating}/10
              </div>
              <button
                onClick={() => startSim(drill)}
                disabled={loading}
                style={{
                  background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13
                }}
              >
                {loading ? 'Starting...' : 'Start Simulation'}
              </button>
            </div>
          ))}
          {drills.length === 0 && <p style={{ color: '#94a3b8' }}>No drills found. Create some in Drill Simulations.</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0 }}>Simulation: {selectedDrill.drill_type}</h2>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Rounds: {sessionRounds} | Session Score: {sessionScore} points
          </div>
        </div>
        <button onClick={() => { setSelectedDrill(null); setSimState(null); setEvaluation(null); }}
          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>
          End Simulation
        </button>
      </div>

      {complete && (
        <div style={{ background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: '#166534', margin: '0 0 8px' }}>Simulation Complete!</h3>
          <p>Total rounds: {sessionRounds} | Total score: {sessionScore} | Average: {sessionRounds > 0 ? (sessionScore / sessionRounds).toFixed(1) : 0}/10</p>
          <button onClick={() => startSim(selectedDrill)} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>
            Restart Simulation
          </button>
        </div>
      )}

      {simState && !complete && (
        <div style={{ background: '#fff', border: '2px solid #6366f1', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ background: '#6366f1', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
              INCIDENT COMMANDER
            </div>
          </div>
          <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{simState.event || simState.situation}</p>
          <p style={{ color: '#374151', marginBottom: 16 }}>{simState.question}</p>
          {simState.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Suggested options:</p>
              {simState.options.map((opt, i) => (
                <button key={i} onClick={() => setResponse(opt)}
                  style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 16px', textAlign: 'left', cursor: 'pointer', fontSize: 13 }}>
                  {opt}
                </button>
              ))}
            </div>
          )}
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Describe your response or actions..."
            style={{ width: '100%', minHeight: 80, padding: 12, borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button
            onClick={submitResponse}
            disabled={loading || !response.trim()}
            style={{ marginTop: 12, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 700, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Evaluating...' : 'Submit Response'}
          </button>
        </div>
      )}

      {evaluation && !complete && (
        <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Evaluator Feedback</div>
            <div style={{
              background: evaluation.score >= 7 ? '#22c55e' : evaluation.score >= 4 ? '#f59e0b' : '#ef4444',
              color: '#fff', borderRadius: 20, padding: '4px 12px', fontWeight: 700, fontSize: 14
            }}>
              Score: {evaluation.score}/10
            </div>
          </div>
          <p style={{ color: '#374151' }}>{evaluation.evaluation}</p>
          <p style={{ color: '#64748b', fontSize: 13 }}>{evaluation.feedback}</p>
        </div>
      )}
    </div>
  );
}

export default DrillSimulator;

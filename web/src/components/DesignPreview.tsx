import { useEffect, useState } from 'react';
import axios from 'axios';

interface DesignState {
  frames?: any[];
  nodes?: any[];
  styles?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface DesignPreviewProps {
  sessionId: string | null;
}

const API_BASE = 'http://localhost:8765';

export default function DesignPreview({ sessionId }: DesignPreviewProps) {
  const [designState, setDesignState] = useState<DesignState | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const fetchDesignState = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE}/api/session/${sessionId}`);
        setDesignState(res.data.designState);
      } catch (err) {
        console.error('Failed to fetch design state:', err);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately and every 5 seconds
    fetchDesignState();
    const interval = setInterval(fetchDesignState, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="design-preview">
      <div className="preview-header">
        <h2>Design State</h2>
        {loading && <span className="loading-spinner"></span>}
      </div>

      <div className="preview-content">
        {!sessionId ? (
          <div className="preview-empty">
            <p>Loading session...</p>
          </div>
        ) : designState ? (
          <div className="state-info">
            <div className="info-item">
              <label>Frames</label>
              <span>{designState.frames?.length || 0}</span>
            </div>
            <div className="info-item">
              <label>Nodes</label>
              <span>{designState.nodes?.length || 0}</span>
            </div>
            <div className="info-item">
              <label>Styles</label>
              <span>{Object.keys(designState.styles || {}).length}</span>
            </div>

            {designState.frames && designState.frames.length > 0 && (
              <div className="frames-list">
                <h4>Frames</h4>
                <ul>
                  {designState.frames.slice(0, 5).map((frame: any, idx: number) => (
                    <li key={idx}>
                      {frame.name || 'Untitled'}: {frame.width}x{frame.height}px
                    </li>
                  ))}
                  {designState.frames.length > 5 && (
                    <li>... and {designState.frames.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}

            {designState.nodes && designState.nodes.length > 0 && (
              <div className="nodes-list">
                <h4>Nodes</h4>
                <ul>
                  {designState.nodes.slice(0, 5).map((node: any, idx: number) => (
                    <li key={idx}>
                      {node.name || 'Untitled'} ({node.type})
                    </li>
                  ))}
                  {designState.nodes.length > 5 && (
                    <li>... and {designState.nodes.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="preview-empty">
            <p>No design state yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface Action {
  tool: string;
  params: Record<string, any>;
}

interface ActionLogProps {
  actions?: Action[];
}

export default function ActionLog({ actions }: ActionLogProps) {
  return (
    <div className="action-log">
      <div className="log-header">
        <h3>Actions</h3>
        {actions && <span className="badge">{actions.length}</span>}
      </div>

      <div className="log-content">
        {!actions || actions.length === 0 ? (
          <div className="empty-log">
            <p>No actions yet</p>
          </div>
        ) : (
          <div className="actions-list">
            {actions.map((action, idx) => (
              <div key={idx} className="action-item">
                <div className="action-name">{action.tool}</div>
                <div className="action-params">
                  <pre>{JSON.stringify(action.params, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

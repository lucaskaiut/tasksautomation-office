import { useMemo, useState } from 'react';
import { OFFICE_ACTOR_DEFINITIONS } from '../office/officeActorDefinitions';
import { OFFICE_FURNITURE } from '../office/officeFurniture';
import { useActorRuntimeDispatch } from '../office/ActorRuntimeProvider';
import { issueOwnerInteractWithDesk } from '../office/actorInteractionCommands';
import { ActorAnimationToolbar } from './ActorAnimationToolbar';

export function ActorControlPanel() {
  const [selectedActorId, setSelectedActorId] = useState(OFFICE_ACTOR_DEFINITIONS[0]?.id ?? '');
  const dispatch = useActorRuntimeDispatch();

  const selectedName = useMemo(
    () => OFFICE_ACTOR_DEFINITIONS.find((a) => a.id === selectedActorId)?.name ?? selectedActorId,
    [selectedActorId]
  );

  const ownedDesks = useMemo(() => {
    return OFFICE_FURNITURE.filter((p) => p.kind === 'desk' && p.ownerActorId === selectedActorId);
  }, [selectedActorId]);

  return (
    <div className="office-control-panel">
      <div>
        <p className="office-control-label">Ator</p>
        <div className="office-actor-list">
          {OFFICE_ACTOR_DEFINITIONS.map((def) => (
            <button
              key={def.id}
              type="button"
              onClick={() => setSelectedActorId(def.id)}
              title={def.id}
              className={`office-actor-btn${selectedActorId === def.id ? ' is-active' : ''}`}
            >
              <span className="office-actor-name">{def.name}</span>
              <span className="mono">{def.id}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="office-control-divider">
        <p className="office-control-label">Animações · {selectedName}</p>
        <ActorAnimationToolbar actorId={selectedActorId} />
      </div>
      <div className="office-control-divider">
        <p className="office-control-label">Interações · {selectedName}</p>
        {ownedDesks.length ? (
          <div className="office-actor-list">
            {ownedDesks.map((desk) => (
              <button
                key={desk.id}
                type="button"
                className="office-anim-btn"
                onClick={() => issueOwnerInteractWithDesk(dispatch, selectedActorId, desk.id)}
              >
                Sentar na mesa ({desk.id})
              </button>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#a3a3a3' }}>Nenhuma mesa atribuída a este ator.</div>
        )}
      </div>
    </div>
  );
}

import { OFFICE_ANIMATION_IDS } from '../office/actorRuntimeTypes';
import { useActorRuntime } from '../office/ActorRuntimeProvider';

export type ActorAnimationToolbarProps = {
  actorId: string;
};

export function ActorAnimationToolbar({ actorId }: ActorAnimationToolbarProps) {
  const { animationId, setAnimation } = useActorRuntime(actorId);

  return (
    <div className="office-anim-toolbar" role="toolbar" aria-label="Animações do personagem">
      {OFFICE_ANIMATION_IDS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setAnimation(id)}
          className={`office-anim-btn${animationId === id ? ' is-active' : ''}`}
        >
          {id}
        </button>
      ))}
    </div>
  );
}

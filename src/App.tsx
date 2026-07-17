import { AppDialog } from './components/layout/AppDialog';
import { CozyLayout } from './components/layout/CozyLayout';
import { Topbar } from './components/layout/Topbar';
import { useAppDialog } from './hooks/useAppDialog';
import { useGameActions } from './hooks/useGameActions';
import { usePetRuntime } from './hooks/usePetRuntime';
import { getMandrakeCondition } from './mandrakeCopy';

function App() {
  const runtime = usePetRuntime();
  const dialog = useAppDialog({
    state: runtime.state,
    setState: runtime.setState,
    say: runtime.say,
    previousStage: runtime.previousStage,
    onboardingSeen: runtime.onboardingSeen,
  });
  const actions = useGameActions({
    state: runtime.state,
    setState: runtime.setState,
    say: runtime.say,
    sayActionPhrase: runtime.sayActionPhrase,
    triggerReaction: runtime.triggerReaction,
    beep: runtime.beep,
    previousStage: runtime.previousStage,
    dialogRef: dialog.dialogRef,
  });
  const condition = getMandrakeCondition(runtime.state);
  const sceneClasses = [
    'app-shell',
    'modern-mode',
    `scene-${condition}`,
    runtime.state.asleep ? 'scene-sleeping' : '',
    runtime.state.lightsOff ? 'scene-lights-off' : '',
    runtime.state.callReason ? 'scene-call-active' : '',
    runtime.callPulse ? 'call-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <main className={sceneClasses}>
      <Topbar
        sound={runtime.state.sound}
        paused={runtime.state.paused}
        toggleSound={() => runtime.setState((current) => ({ ...current, sound: !current.sound }))}
        togglePaused={() => runtime.setState((current) => ({ ...current, paused: !current.paused }))}
        reset={dialog.reset}
      />

      <CozyLayout
        state={runtime.state}
        message={runtime.message}
        actions={actions}
        focusReaction={runtime.focusReaction}
        reaction={runtime.reaction}
        idleBehavior={runtime.idleBehavior}
        rename={dialog.rename}
        reset={dialog.reset}
      />

      <AppDialog
        dialog={dialog.dialog}
        dialogRef={dialog.dialogRef}
        nameDraft={dialog.nameDraft}
        setNameDraft={dialog.setNameDraft}
        closeDialog={dialog.closeDialog}
        submitDialog={dialog.submitDialog}
      />
    </main>
  );
}

export default App;

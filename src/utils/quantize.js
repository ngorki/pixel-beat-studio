// Quantize a step position to the nearest grid position
export function quantizeStep(step, gridResolution, totalSteps) {
  if (!gridResolution) return step;

  const stepsPerGrid = totalSteps / gridResolution;
  const quantizedStep = Math.round(step / stepsPerGrid) * stepsPerGrid;

  return Math.max(0, Math.min(totalSteps - 1, quantizedStep));
}

// Apply quantization to all notes in a pattern
export function quantizeNotes(notes, gridResolution, stepsPerMeasure) {
  if (!gridResolution) return notes;

  const stepsPerGrid = stepsPerMeasure / gridResolution;

  return notes.map(note => ({
    ...note,
    step: Math.round(note.step / stepsPerGrid) * stepsPerGrid,
  }));
}

// Humanize notes by adding random timing offset
export function humanizeNotes(notes, amount = 10, stepsPerMeasure = 16) {
  const maxOffset = (amount / 100) * (stepsPerMeasure / 16); // Scale offset based on amount

  return notes.map(note => {
    const offset = (Math.random() - 0.5) * 2 * maxOffset;
    let newStep = note.step + offset;

    // Keep within bounds
    newStep = Math.max(0, Math.min(stepsPerMeasure - 1, Math.round(newStep)));

    return {
      ...note,
      step: newStep,
    };
  });
}

// Calculate swing timing adjustment
export function calculateSwingOffset(step, swingAmount, stepDuration) {
  if (swingAmount === 0 || step % 2 === 0) return 0;

  // Swing affects even-indexed sixteenth notes (second of each pair)
  const maxSwing = stepDuration / 2; // Half step duration is full triplet swing
  return (swingAmount / 100) * maxSwing;
}

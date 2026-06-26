import { describe, it, expect } from 'vitest';
import { evaluateObjects, type DetectedObject, type Box } from '@/lib/face/object-compliance';

// Face occupies center-top; "away" boxes don't overlap it.
const FACE: Box = { x: 0.35, y: 0.08, width: 0.3, height: 0.6 };
const AWAY: Box = { x: 0.0, y: 0.82, width: 0.16, height: 0.16 };
// A box covering a good chunk (>10%) of the face.
const OVER_FACE: Box = { x: 0.4, y: 0.2, width: 0.2, height: 0.35 };

const det = (category: string, score: number, box: Box = AWAY): DetectedObject => ({ category, score, box });

describe('object compliance — overlap-driven rules (YOLO + hands)', () => {
  it('clean photo (only the subject) → PASS', () => {
    const r = evaluateObjects([det('person', 0.95, FACE)], FACE);
    expect(r.objects.status).toBe('PASS');
    expect(r.obstruction.status).toBe('PASS');
  });

  it('book BESIDE the body (not covering face) → PASS (presence alone does not fail)', () => {
    const r = evaluateObjects([det('book', 0.8)], FACE);
    expect(r.objects.status).toBe('PASS');
    expect(r.obstruction.status).toBe('PASS');
    // ...but it is still reported for the API/panel.
    expect(r.detectedObjects.some((d) => d.label.match(/book|document/i))).toBe(true);
  });

  it('phone COVERING the face → objects FAIL + obstruction FAIL', () => {
    const r = evaluateObjects([det('cell phone', 0.8, OVER_FACE)], FACE);
    expect(r.objects.status).toBe('FAIL');
    expect(r.obstruction.status).toBe('FAIL');
    expect(r.detectedObjects[0].overlapsFace).toBe(true);
  });

  it('passport COVERING the mouth → FAIL (obstructing threshold 0.30)', () => {
    const r = evaluateObjects([det('passport', 0.35, OVER_FACE)], FACE);
    expect(r.objects.status).toBe('FAIL');
    expect(r.obstruction.status).toBe('FAIL');
  });

  it('toy COVERING the eyes → FAIL', () => {
    expect(evaluateObjects([det('teddy bear', 0.7, OVER_FACE)], FACE).objects.status).toBe('FAIL');
  });

  it('hand COVERING the cheek → FAIL; hand away from face → PASS', () => {
    expect(evaluateObjects([det('hand', 0.92, OVER_FACE)], FACE).obstruction.status).toBe('FAIL');
    expect(evaluateObjects([det('hand', 0.92, AWAY)], FACE).objects.status).toBe('PASS');
  });

  it('extra person away from the face (parent/bystander) → FAIL', () => {
    const r = evaluateObjects([det('person', 0.9, { x: 0.0, y: 0.0, width: 0.25, height: 0.9 })], FACE);
    expect(r.objects.status).toBe('FAIL');
  });

  it('below score floor (0.25) → ignored → PASS', () => {
    expect(evaluateObjects([det('cell phone', 0.25, OVER_FACE)], FACE).objects.status).toBe('PASS');
  });

  it('unmapped categories (chair) → ignored → PASS', () => {
    expect(evaluateObjects([det('chair', 0.9, OVER_FACE)], FACE).objects.status).toBe('PASS');
  });

  it('face partially out of frame → obstruction FAIL', () => {
    expect(evaluateObjects([], { x: -0.1, y: 0.08, width: 0.3, height: 0.6 }).obstruction.status).toBe('FAIL');
  });

  describe('baby-specific rules', () => {
    it('pacifier visible (not covering) → FAIL for infant, PASS for adult docs', () => {
      expect(evaluateObjects([det('pacifier', 0.7)], FACE, { infant: true }).objects.status).toBe('FAIL');
      expect(evaluateObjects([det('pacifier', 0.7)], FACE, { infant: false }).objects.status).toBe('PASS');
    });

    it('bottle visible (not covering) → FAIL for infant', () => {
      expect(evaluateObjects([det('bottle', 0.7)], FACE, { infant: true }).objects.status).toBe('FAIL');
    });

    it('toy visible but NOT covering the face → WARNING for infant', () => {
      const r = evaluateObjects([det('teddy bear', 0.7)], FACE, { infant: true });
      expect(r.objects.status).toBe('WARNING');
    });

    it('toy COVERING the face → FAIL for infant', () => {
      expect(evaluateObjects([det('teddy bear', 0.7, OVER_FACE)], FACE, { infant: true }).objects.status).toBe('FAIL');
    });
  });
});

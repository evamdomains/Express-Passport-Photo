import { describe, it, expect } from 'vitest';
import { evaluateBabyObjects, type DetectedObject, type Box } from '@/lib/face/baby-objects';

// Face occupies center-top; "away" boxes don't overlap it.
const FACE: Box = { x: 0.35, y: 0.08, width: 0.3, height: 0.6 };
const AWAY: Box = { x: 0.0, y: 0.78, width: 0.18, height: 0.18 };

const det = (category: string, score: number, box: Box = AWAY): DetectedObject => ({ category, score, box });

describe('evaluateBabyObjects — baby object compliance', () => {
  it('1. parent hand visible → FAIL', () => {
    const r = evaluateBabyObjects([det('hand', 0.72)], FACE);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toMatch(/hand/i);
    expect(r.items[0].score).toBe(0.72);
  });

  it('2. parent finger visible → FAIL', () => {
    expect(evaluateBabyObjects([det('finger', 0.68)], FACE).status).toBe('FAIL');
  });

  it('3. pacifier visible → FAIL', () => {
    const r = evaluateBabyObjects([det('pacifier', 0.71)], FACE);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toMatch(/pacifier/i);
  });

  it('4. toy visible (teddy bear) → FAIL', () => {
    expect(evaluateBabyObjects([det('teddy bear', 0.77)], FACE).status).toBe('FAIL');
  });

  it('5. bottle visible → FAIL', () => {
    const r = evaluateBabyObjects([det('bottle', 0.83)], FACE);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toMatch(/bottle/i);
  });

  it('6. no supporting object (only the baby) → PASS', () => {
    // baby itself registers as a `person` overlapping the face → ignored.
    const r = evaluateBabyObjects([det('person', 0.95, FACE)], FACE);
    expect(r.status).toBe('PASS');
    expect(r.items).toHaveLength(0);
  });

  it('extra person NOT overlapping the face (parent) → FAIL', () => {
    const r = evaluateBabyObjects([det('person', 0.9, { x: 0.0, y: 0.0, width: 0.25, height: 0.9 })], FACE);
    expect(r.status).toBe('FAIL');
  });

  it('7. partial / uncertain detection (0.45) → WARNING (not auto-fail)', () => {
    const r = evaluateBabyObjects([det('teddy bear', 0.45)], FACE);
    expect(r.status).toBe('WARNING');
    expect(r.reason).toMatch(/possible/i);
  });

  it('8a. false-positive protection: below score floor (0.25) → ignored → PASS', () => {
    expect(evaluateBabyObjects([det('bottle', 0.25)], FACE).status).toBe('PASS');
  });

  it('8b. between floor and warn (0.35) → ignored → PASS', () => {
    expect(evaluateBabyObjects([det('teddy bear', 0.35)], FACE).status).toBe('PASS');
  });

  it('unmapped categories (e.g. chair) are ignored → PASS', () => {
    expect(evaluateBabyObjects([det('chair', 0.9), det('dining table', 0.8)], FACE).status).toBe('PASS');
  });

  it('object covering the face → FAIL even at moderate score', () => {
    // small bottle box sitting over the face (>25% face coverage)
    const overFace: Box = { x: 0.4, y: 0.2, width: 0.2, height: 0.35 };
    const r = evaluateBabyObjects([det('bottle', 0.5, overFace)], FACE);
    expect(r.status).toBe('FAIL');
    expect(r.reason).toMatch(/covered/i);
  });
});

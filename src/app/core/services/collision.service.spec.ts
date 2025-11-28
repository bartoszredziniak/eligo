import { TestBed } from '@angular/core/testing';
import { CollisionService } from './collision.service';
import { Box } from '../models/drawer.models';

describe('CollisionService', () => {
  let service: CollisionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CollisionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkCollision', () => {
    it('should detect overlapping boxes', () => {
      const b1: Box = { id: '1', x: 0, y: 0, width: 2, depth: 2, height: 50, color: 'white' };
      const b2: Box = { id: '2', x: 1, y: 1, width: 2, depth: 2, height: 50, color: 'white' };
      expect(service.checkCollision(b1, b2)).toBeTrue();
    });

    it('should not detect non-overlapping boxes', () => {
      const b1: Box = { id: '1', x: 0, y: 0, width: 2, depth: 2, height: 50, color: 'white' };
      const b2: Box = { id: '2', x: 3, y: 3, width: 2, depth: 2, height: 50, color: 'white' };
      expect(service.checkCollision(b1, b2)).toBeFalse();
    });

    it('should not detect touching boxes (adjacent)', () => {
      const b1: Box = { id: '1', x: 0, y: 0, width: 2, depth: 2, height: 50, color: 'white' };
      const b2: Box = { id: '2', x: 2, y: 0, width: 2, depth: 2, height: 50, color: 'white' };
      expect(service.checkCollision(b1, b2)).toBeFalse();
    });
  });

  describe('findCollisions', () => {
    it('should return IDs of colliding boxes', () => {
      const boxes: Box[] = [
        { id: '1', x: 0, y: 0, width: 2, depth: 2, height: 50, color: 'white' },
        { id: '2', x: 1, y: 1, width: 2, depth: 2, height: 50, color: 'white' },
        { id: '3', x: 5, y: 5, width: 2, depth: 2, height: 50, color: 'white' },
      ];
      const collisions = service.findCollisions(boxes);
      expect(collisions.size).toBe(2);
      expect(collisions.has('1')).toBeTrue();
      expect(collisions.has('2')).toBeTrue();
      expect(collisions.has('3')).toBeFalse();
    });
  });
});
